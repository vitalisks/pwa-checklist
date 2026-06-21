import type { Auth } from 'firebase/auth';
import { isOidcEnabled } from '../config';

let authInstance: Auth | null = null;

export async function getFirebaseAuth(): Promise<Auth | null> {
  if (!isOidcEnabled()) return null;
  if (authInstance) return authInstance;

  const { getAuth } = await import('firebase/auth');
  const { getFirebaseApp } = await import('@/features/share/api/firebase-init');
  const app = await getFirebaseApp();
  if (!app) return null;

  authInstance = getAuth(app);
  return authInstance;
}

export async function signInWithCustomToken(customToken: string) {
  const auth = await getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth not available');

  const { signInWithCustomToken: firebaseSignIn } = await import('firebase/auth');
  return firebaseSignIn(auth, customToken);
}

export async function signOutFirebase() {
  const auth = await getFirebaseAuth();
  if (!auth) return;
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
}
