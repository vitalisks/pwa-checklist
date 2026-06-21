import type { UserManager } from 'oidc-client-ts';
import { isOidcEnabled, getOidcConfig } from '../config';

let userManager: UserManager | null = null;

export async function getOidcUserManager(): Promise<UserManager | null> {
  if (!isOidcEnabled()) return null;
  if (userManager) return userManager;

  const { UserManager, WebStorageStateStore } = await import('oidc-client-ts');
  const config = getOidcConfig();

  if (!config.authority || !config.clientId || !config.redirectUri) {
    console.warn('[OIDC] Missing configuration. Auth will be unavailable.');
    return null;
  }

  userManager = new UserManager({
    authority: config.authority,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    automaticSilentRenew: true,
    includeIdTokenInSilentRenew: true,
    loadUserInfo: true,
  });

  return userManager;
}

export async function signIn(): Promise<{ idToken: string; profile: Record<string, unknown> } | null> {
  console.log('[OIDC] Processing callback...');
  const mgr = await getOidcUserManager();
  if (!mgr) return null;

  console.log('[OIDC] Calling signinRedirectCallback...');
  const user = await mgr.signinRedirectCallback();
  console.log('[OIDC] signinRedirectCallback completed, has id_token:', !!user?.id_token);
  if (!user || !user.id_token) {
    throw new Error('OIDC sign-in failed — no ID token received');
  }
  console.log('[OIDC] ID token obtained successfully');

  // Extract claims directly from the ID token JWT (most reliable,
  // avoids relying on userinfo endpoint which may have CORS issues).
  const profile = decodeJwtPayload(user.id_token);
  console.log('[OIDC] ID token claims:', Object.keys(profile));

  return { idToken: user.id_token, profile: profile as Record<string, unknown> };
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export async function startSignIn(): Promise<void> {
  const mgr = await getOidcUserManager();
  if (!mgr) return;
  console.log('[OIDC] Starting sign in redirect...');
  await mgr.signinRedirect();
}

export async function signOut(): Promise<void> {
  const mgr = await getOidcUserManager();
  if (!mgr) return;
  await mgr.removeUser();
}

export async function isCallbackPage(): Promise<boolean> {
  const mgr = await getOidcUserManager();
  if (!mgr) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const hasState = params.has('state');
    const hasCode = params.has('code');
    console.log('[OIDC] isCallbackPage check:', { hasState, hasCode, search: window.location.search });
    return hasState && hasCode;
  } catch {
    return false;
  }
}
