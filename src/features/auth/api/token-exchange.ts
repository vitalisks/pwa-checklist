import { getOidcConfig } from '../config';
import { signInWithCustomToken as firebaseSignIn } from './firebase-auth';

const BLOCKED_ALGORITHMS = new Set(['none', 'HS256', 'HS384', 'HS512']);

function validateTokenStructure(idToken: string): void {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid ID token: wrong number of segments');

  const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
  if (typeof header.alg !== 'string' || BLOCKED_ALGORITHMS.has(header.alg)) {
    throw new Error(`Invalid ID token: algorithm '${header.alg}' is not allowed`);
  }
}

export async function exchangeOidcTokenForFirebase(idToken: string): Promise<string> {
  const config = getOidcConfig();
  if (!config.customTokenEndpoint) {
    throw new Error('CUSTOM_TOKEN_ENDPOINT is not configured');
  }

  validateTokenStructure(idToken);

  console.log('[Auth] Exchanging OIDC token for Firebase custom token...');
  const response = await fetch(config.customTokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`Token exchange failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  if (!data.customToken) {
    throw new Error('Token exchange returned no customToken');
  }

  console.log('[Auth] Firebase custom token received');
  return data.customToken;
}

export async function completeOidcSignIn(
  idToken: string,
  oidcProfile?: Record<string, unknown>,
): Promise<{ uid: string; displayName: string | null; email: string | null; photoURL: string | null }> {
  const customToken = await exchangeOidcTokenForFirebase(idToken);
  console.log('[Auth] Signing in to Firebase with custom token...');
  const userCredential = await firebaseSignIn(customToken);
  const firebaseUser = userCredential.user;
  console.log('[Auth] Firebase sign-in successful:', firebaseUser.uid);
  console.log('[Auth] OIDC profile claims:', oidcProfile ? Object.keys(oidcProfile) : 'none');

  const displayName = (oidcProfile?.name as string) || (oidcProfile?.preferred_username as string) || firebaseUser.displayName;
  const email = (oidcProfile?.email as string) || firebaseUser.email;
  const photoURL = (oidcProfile?.picture as string) || firebaseUser.photoURL;
  console.log('[Auth] Result profile:', { displayName, email, photoURL });

  if (displayName || photoURL) {
    const { updateProfile } = await import('firebase/auth');
    await updateProfile(firebaseUser, {
      displayName: displayName || undefined,
      photoURL: photoURL || undefined,
    }).catch((err: unknown) => console.warn('[Auth] updateProfile failed:', err));
  }

  return { uid: firebaseUser.uid, displayName, email, photoURL };
}