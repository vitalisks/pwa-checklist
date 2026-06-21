export function isOidcEnabled(): boolean {
  return import.meta.env.VITE_OIDC_ENABLED === 'true';
}

export function isOidcConfigured(): boolean {
  if (!isOidcEnabled()) return false;
  return !!(
    import.meta.env.VITE_OIDC_AUTHORITY &&
    import.meta.env.VITE_OIDC_CLIENT_ID &&
    import.meta.env.VITE_OIDC_REDIRECT_URI &&
    import.meta.env.VITE_CUSTOM_TOKEN_ENDPOINT
  );
}

export function getOidcConfig() {
  return {
    authority: import.meta.env.VITE_OIDC_AUTHORITY,
    clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
    scope: import.meta.env.VITE_OIDC_SCOPE || 'openid profile email',
    redirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI,
    customTokenEndpoint: import.meta.env.VITE_CUSTOM_TOKEN_ENDPOINT,
  };
}
