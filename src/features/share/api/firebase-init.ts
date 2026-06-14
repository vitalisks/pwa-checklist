import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import { isFirebaseEnabled } from '../config';

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;

export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (!isFirebaseEnabled()) return null;
  if (app) return app;

  const { initializeApp } = await import('firebase/app');
  app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  return app;
}

export async function getFirestoreInstance(): Promise<Firestore | null> {
  if (!isFirebaseEnabled()) return null;
  if (firestore) return firestore;

  const fb = await getFirebaseApp();
  if (!fb) return null;

  const { getFirestore } = await import('firebase/firestore');
  firestore = getFirestore(fb);
  return firestore;
}
