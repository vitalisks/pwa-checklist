/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import type { AuthState, AuthUser } from './types';
import { isOidcEnabled, isOidcConfigured } from '../config';
import { getFirebaseAuth, signOutFirebase } from '../api/firebase-auth';
import { signIn as oidcSignIn, startSignIn, signOut as oidcSignOut, isCallbackPage } from '../api/oidc-client';
import { completeOidcSignIn } from '../api/token-exchange';

interface AuthContextType {
  enabled: boolean;
  configured: boolean;
  authState: AuthState;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function userFromFirebaseUser(fbUser: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }): AuthUser {
  return {
    uid: fbUser.uid,
    displayName: fbUser.displayName,
    email: fbUser.email,
    photoURL: fbUser.photoURL,
  };
}

async function writeDeviceUidMapping(uid: string): Promise<void> {
  const { getDeviceId } = await import('@/shared/lib');
  const { getFirestoreInstance } = await import('@/features/share/api/firebase-init');
  const db = await getFirestoreInstance();
  if (!db) return;
  const { doc, setDoc } = await import('firebase/firestore');
  const deviceId = getDeviceId();
  // Write UID mapping
  setDoc(doc(db, 'device_uid_mappings', deviceId), {
    uid,
    updatedAt: Date.now(),
  }, { merge: true }).catch(() => {});
  // Protect inbox: only the authenticated owner can read it
  setDoc(doc(db, 'shared_payloads', 'inbox_' + deviceId), {
    ownerUid: uid,
  }, { merge: true }).catch(() => {});
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const enabled = isOidcEnabled();
  const configured = isOidcConfigured();
  const [authState, setAuthState] = useState<AuthState>({
    status: 'loading',
    user: null,
  });
  const processingCallback = useRef(false);
  const oidcProfileRef = useRef<Record<string, unknown> | null>(null);

  // Handle OIDC callback and Firebase Auth state
  useEffect(() => {
    if (!enabled || !configured) {
      setAuthState({ status: 'unauthenticated', user: null });
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        console.log('[Auth] Checking if callback page...');
        const isCallback = await isCallbackPage();
        console.log('[Auth] isCallbackPage result:', isCallback);
        if (isCallback && !processingCallback.current) {
          processingCallback.current = true;
          console.log('[Auth] Processing OIDC callback...');
          try {
            console.log('[Auth] Calling oidcSignIn...');
            const result = await withTimeout(oidcSignIn(), 10_000);
            console.log('[Auth] oidcSignIn result:', !!result);
            if (result && result.idToken) {
              // Store OIDC profile so onAuthStateChanged can use it
              oidcProfileRef.current = result.profile;

              console.log('[Auth] Calling completeOidcSignIn...');
              const userData = await withTimeout(completeOidcSignIn(result.idToken, result.profile), 10_000);
              console.log('[Auth] completeOidcSignIn result:', userData);
              if (!cancelled) {
                setAuthState({
                  status: 'authenticated',
                  user: userFromFirebaseUser(userData),
                });
                console.log('[Auth] State set to authenticated');
                writeDeviceUidMapping(userData.uid);
              }
            }
            window.history.replaceState({}, '', window.location.pathname);
          } catch (error) {
            console.error('[Auth] OIDC callback error:', error);
            if (!cancelled) {
              setAuthState({ status: 'unauthenticated', user: null });
            }
            window.history.replaceState({}, '', window.location.pathname);
          } finally {
            processingCallback.current = false;
          }
          return;
        }

        console.log('[Auth] Not a callback, setting up Firebase Auth listener...');
        const auth = await getFirebaseAuth();
        if (!auth) {
          if (!cancelled) {
            setAuthState({ status: 'unauthenticated', user: null });
          }
          return;
        }

        const { onAuthStateChanged } = await import('firebase/auth');
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          if (cancelled) return;
          if (firebaseUser) {
            const profile = oidcProfileRef.current;
            setAuthState({
              status: 'authenticated',
              user: {
                uid: firebaseUser.uid,
                displayName: (profile?.name as string) || (profile?.preferred_username as string) || firebaseUser.displayName,
                email: (profile?.email as string) || firebaseUser.email,
                photoURL: (profile?.picture as string) || firebaseUser.photoURL,
              },
            });
            writeDeviceUidMapping(firebaseUser.uid);
          } else {
            setAuthState({ status: 'unauthenticated', user: null });
          }
        });
      } catch (error) {
        console.error('[Auth] Initialization error:', error);
        if (!cancelled) {
          setAuthState({ status: 'unauthenticated', user: null });
        }
      }
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [enabled, configured]);

  const signIn = useCallback(async () => {
    if (!enabled || !configured) return;
    await startSignIn();
  }, [enabled, configured]);

  const signOut = useCallback(async () => {
    if (!enabled) return;
    await oidcSignOut();
    await signOutFirebase();
    setAuthState({ status: 'unauthenticated', user: null });
  }, [enabled]);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!enabled || !authState.user) return null;
    const auth = await getFirebaseAuth();
    if (!auth || !auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken();
    } catch {
      return null;
    }
  }, [enabled, authState.user]);

  const value = useMemo(() => ({
    enabled,
    configured,
    authState,
    isAuthenticated: authState.status === 'authenticated',
    signIn,
    signOut,
    getIdToken,
  }), [enabled, configured, authState, signIn, signOut, getIdToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
