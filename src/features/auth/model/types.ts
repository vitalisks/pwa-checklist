export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface OidcProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  preferred_username?: string;
}

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}
