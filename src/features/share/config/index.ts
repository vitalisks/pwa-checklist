export function isFirebaseEnabled(): boolean {
  return import.meta.env.VITE_FIREBASE_ENABLED === 'true';
}
