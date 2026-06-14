import { getFirestoreInstance } from '@/features/share/api/firebase-init';
import type { CollaborativeChecklist } from '@/shared/config';
import { addCollaborationInvite as addInvite, removeCollaborationInvite as removeInvite } from '@/features/share/api/firestore-service';

const COLLECTION = 'collaborative_checklists';

function stripUndefined<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function log(op: string, path: string, detail: Record<string, unknown>, durationMs: number) {
  console.log(`[Firestore] ${op}`, {
    path,
    durationMs: Math.round(durationMs),
    ...detail,
  });
}

export async function createCollaborativeChecklist(
  checklist: CollaborativeChecklist,
): Promise<boolean> {
  const start = performance.now();
  const db = await getFirestoreInstance();
  if (!db) { log('WRITE', `${COLLECTION}/${checklist.id.slice(0, 8)}...`, { error: 'no-db' }, performance.now() - start); return false; }
  const { doc, setDoc } = await import('firebase/firestore');
  const path = `${COLLECTION}/${checklist.id}`;
  try {
    await setDoc(doc(db, COLLECTION, checklist.id), stripUndefined(checklist));
    log('WRITE', path, { title: checklist.title, collaborators: checklist.collaborators.length, ownerId: checklist.ownerDeviceId.slice(0, 8), status: 'ok' }, performance.now() - start);
    return true;
  } catch (e) {
    log('WRITE', path, { error: e instanceof Error ? e.message : String(e), status: 'error' }, performance.now() - start);
    console.warn('Failed to create collaborative checklist:', e);
    return false;
  }
}

export async function updateCollaborativeChecklist(
  checklist: CollaborativeChecklist,
): Promise<boolean> {
  const start = performance.now();
  const db = await getFirestoreInstance();
  if (!db) { log('UPDATE', `${COLLECTION}/${checklist.id.slice(0, 8)}...`, { error: 'no-db' }, performance.now() - start); return false; }
  const { doc, setDoc } = await import('firebase/firestore');
  const path = `${COLLECTION}/${checklist.id}`;
  try {
    await setDoc(doc(db, COLLECTION, checklist.id), stripUndefined(checklist), { merge: true });
    log('UPDATE', path, { title: checklist.title, catCount: checklist.categories.length, updatedAt: checklist.updatedAt, status: 'ok' }, performance.now() - start);
    return true;
  } catch (e) {
    log('UPDATE', path, { error: e instanceof Error ? e.message : String(e), status: 'error' }, performance.now() - start);
    console.warn('Failed to update collaborative checklist:', e);
    return false;
  }
}

export async function updateCollaborativeChecklistFields(
  checklistId: string,
  fields: Record<string, unknown>,
): Promise<boolean> {
  const start = performance.now();
  const db = await getFirestoreInstance();
  if (!db) { log('UPDATE_FIELDS', `${COLLECTION}/${checklistId.slice(0, 8)}...`, { error: 'no-db' }, performance.now() - start); return false; }
  const { doc, updateDoc } = await import('firebase/firestore');
  const path = `${COLLECTION}/${checklistId}`;
  const fieldKeys = Object.keys(fields);
  try {
    await updateDoc(doc(db, COLLECTION, checklistId), stripUndefined(fields));
    log('UPDATE_FIELDS', path, { fieldCount: fieldKeys.length, fields: fieldKeys.join(','), status: 'ok' }, performance.now() - start);
    return true;
  } catch (e) {
    log('UPDATE_FIELDS', path, { error: e instanceof Error ? e.message : String(e), status: 'error' }, performance.now() - start);
    console.warn('Failed to update collaborative checklist fields:', e);
    return false;
  }
}

export async function deleteCollaborativeChecklist(id: string): Promise<void> {
  const start = performance.now();
  const db = await getFirestoreInstance();
  if (!db) { log('DELETE', `${COLLECTION}/${id.slice(0, 8)}...`, { error: 'no-db' }, performance.now() - start); return; }
  const { doc, deleteDoc } = await import('firebase/firestore');
  const path = `${COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    log('DELETE', path, { status: 'ok' }, performance.now() - start);
  } catch (e) {
    log('DELETE', path, { error: e instanceof Error ? e.message : String(e), status: 'error' }, performance.now() - start);
  }
}

export async function listenForCollaborativeChecklist(
  checklistId: string,
  onChange: (checklist: CollaborativeChecklist) => void,
): Promise<() => void> {
  const start = performance.now();
  const db = await getFirestoreInstance();
  if (!db) { log('LISTEN', `${COLLECTION}/${checklistId.slice(0, 8)}...`, { error: 'no-db' }, performance.now() - start); return () => {}; }
  const { doc, onSnapshot } = await import('firebase/firestore');
  const path = `${COLLECTION}/${checklistId}`;

  let unsub: () => void = () => {};
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const subscribe = () => {
    log('LISTEN', path, { status: 'setup' }, performance.now() - start);
    unsub = onSnapshot(
      doc(db, COLLECTION, checklistId),
      (snap) => {
        const snapTime = performance.now();
        if (snap.exists()) {
          const data = snap.data() as CollaborativeChecklist;
          log('SNAPSHOT', path, { exists: true, title: data.title, updatedAt: data.updatedAt, data }, performance.now() - snapTime);
          onChange(data);
        } else {
          log('SNAPSHOT', path, { exists: false, status: 'deleted', data: null }, performance.now() - snapTime);
          onChange(null as unknown as CollaborativeChecklist);
        }
      },
      (error) => {
        log('SNAPSHOT', path, { error: `${error.code}: ${error.message}`, status: 'error' }, performance.now() - start);
        console.warn('Collaboration doc listener error:', error.code, error.message);
        if (!stopped) {
          retryTimer = setTimeout(subscribe, 3000);
        }
      },
    );
  };

  subscribe();

  return () => {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    unsub();
  };
}

export async function addCollaboratorToFirestore(
  checklistId: string,
  deviceId: string,
): Promise<boolean> {
  const start = performance.now();
  const db = await getFirestoreInstance();
  if (!db) { log('UPDATE', `${COLLECTION}/${checklistId.slice(0, 8)}.../collaborators`, { error: 'no-db' }, performance.now() - start); return false; }
  const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
  const path = `${COLLECTION}/${checklistId}/collaborators`;
  try {
    await updateDoc(doc(db, COLLECTION, checklistId), {
      collaborators: arrayUnion(deviceId),
    });
    log('UPDATE', path, { addedDeviceId: deviceId.slice(0, 8), status: 'ok' }, performance.now() - start);
    return true;
  } catch (e) {
    log('UPDATE', path, { error: e instanceof Error ? e.message : String(e), status: 'error' }, performance.now() - start);
    console.warn('Failed to add collaborator:', e);
    return false;
  }
}

export async function removeCollaboratorFromFirestore(
  checklistId: string,
  deviceId: string,
): Promise<boolean> {
  const start = performance.now();
  const db = await getFirestoreInstance();
  if (!db) { log('UPDATE', `${COLLECTION}/${checklistId.slice(0, 8)}.../collaborators`, { error: 'no-db' }, performance.now() - start); return false; }
  const { doc, updateDoc, arrayRemove } = await import('firebase/firestore');
  const path = `${COLLECTION}/${checklistId}/collaborators`;
  try {
    await updateDoc(doc(db, COLLECTION, checklistId), {
      collaborators: arrayRemove(deviceId),
    });
    log('UPDATE', path, { removedDeviceId: deviceId.slice(0, 8), status: 'ok' }, performance.now() - start);
    return true;
  } catch (e) {
    log('UPDATE', path, { error: e instanceof Error ? e.message : String(e), status: 'error' }, performance.now() - start);
    console.warn('Failed to remove collaborator:', e);
    return false;
  }
}

export async function inviteCollaborator(
  recipientDeviceId: string,
  checklistId: string,
  ownerDeviceId: string,
  title: string,
): Promise<boolean> {
  return addInvite(recipientDeviceId, checklistId, { ownerDeviceId, title });
}

export async function removeCollaboratorInvite(
  deviceId: string,
  checklistId: string,
): Promise<boolean> {
  return removeInvite(deviceId, checklistId);
}
