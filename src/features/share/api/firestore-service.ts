import { getFirestoreInstance } from './firebase-init';

function inboxDocId(deviceId: string): string {
  return 'inbox_' + deviceId;
}

const COLLECTION = 'shared_payloads';

type FirestoreModule = typeof import('firebase/firestore');
let _fsModule: FirestoreModule | null = null;

async function getDb(): Promise<{ db: import('firebase/firestore').Firestore; fs: FirestoreModule } | null> {
  const db = await getFirestoreInstance();
  if (!db) return null;
  if (!_fsModule) {
    _fsModule = await import('firebase/firestore');
  }
  return { db, fs: _fsModule };
}

async function getInboxRef(deviceId: string) {
  const d = await getDb();
  if (!d) return null;
  const { db, fs } = d;
  const ref = fs.doc(db, COLLECTION, inboxDocId(deviceId));
  return { ref, fs, db };
}

function log(op: string, path: string, detail: Record<string, unknown>, durationMs: number) {
  console.log(`[Firestore] ${op}`, {
    path,
    durationMs: Math.round(durationMs),
    ...detail,
  });
}

/** Normalize inbox data: merge flat keys (shares.X, collaborationInvites.Y) into nested maps. */
function normalizeInboxData(snapData: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const shares: Record<string, unknown> = {};
  const invites: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(snapData)) {
    if (key.startsWith('shares.')) {
      const shareId = key.slice(7);
      shares[shareId] = value;
    } else if (key.startsWith('collaborationInvites.')) {
      const inviteId = key.slice(21);
      invites[inviteId] = value;
    } else if (key === 'shares') {
      Object.assign(shares, value as Record<string, unknown>);
    } else if (key === 'collaborationInvites') {
      Object.assign(invites, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  if (Object.keys(shares).length) result.shares = shares;
  if (Object.keys(invites).length) result.collaborationInvites = invites;
  return result;
}

export async function addShareToInbox(
  recipientDeviceId: string,
  shareId: string,
  data: {
    senderDeviceId: string;
    senderName: string | null;
    itemType: 'template' | 'checklist';
    title: string;
    payloadData: string;
    sharedAt: number;
  },
): Promise<boolean> {
  const start = performance.now();
  const ctx = await getInboxRef(recipientDeviceId);
  if (!ctx) { log('WRITE', `shared_payloads/inbox_${recipientDeviceId}`, { error: 'no-db' }, performance.now() - start); return false; }
  const { ref, fs } = ctx;
  const path = `shared_payloads/inbox_${recipientDeviceId}/shares.${shareId}`;
  try {
    await fs.setDoc(
      ref,
      { shares: { [shareId]: { ...data, recipientDeviceId } } },
      { merge: true },
    );
    log('WRITE', path, { senderId: data.senderDeviceId.slice(0, 8), itemType: data.itemType, title: data.title, payloadSize: data.payloadData.length, status: 'ok' }, performance.now() - start);
    return true;
  } catch (e) {
    log('WRITE', path, { error: e instanceof Error ? e.message : String(e), status: 'error' }, performance.now() - start);
    console.warn('Failed to add share to inbox:', e);
    return false;
  }
}

export async function removeShareFromInbox(
  deviceId: string,
  shareId: string,
): Promise<boolean> {
  const start = performance.now();
  const ctx = await getInboxRef(deviceId);
  if (!ctx) { log('DELETE', `shared_payloads/inbox_${deviceId}/shares.${shareId}`, { error: 'no-db' }, performance.now() - start); return false; }
  const { ref, fs } = ctx;
  const path = `shared_payloads/inbox_${deviceId}/shares.${shareId}`;
  try {
    await fs.updateDoc(ref, {
      [`shares.${shareId}`]: fs.deleteField(),
    });
    log('DELETE', path, { status: 'ok' }, performance.now() - start);
    return true;
  } catch (e) {
    log('DELETE', path, { error: e instanceof Error ? e.message : String(e), status: 'error' }, performance.now() - start);
    console.warn('Failed to remove share from inbox:', e);
    return false;
  }
}

export async function addCollaborationInvite(
  recipientDeviceId: string,
  checklistId: string,
  data: {
    ownerDeviceId: string;
    title: string;
  },
): Promise<boolean> {
  const start = performance.now();
  const ctx = await getInboxRef(recipientDeviceId);
  if (!ctx) { log('WRITE', `shared_payloads/inbox_${recipientDeviceId}/collaborationInvites.${checklistId}`, { error: 'no-db' }, performance.now() - start); return false; }
  const { ref, fs } = ctx;
  const path = `shared_payloads/inbox_${recipientDeviceId}/collaborationInvites.${checklistId}`;
  try {
    await fs.setDoc(
      ref,
      { collaborationInvites: { [checklistId]: { ...data, recipientDeviceId } } },
      { merge: true },
    );
    log('WRITE', path, { ownerId: data.ownerDeviceId.slice(0, 8), title: data.title, status: 'ok' }, performance.now() - start);
    return true;
  } catch (e) {
    log('WRITE', path, { error: e instanceof Error ? e.message : String(e), status: 'error' }, performance.now() - start);
    console.warn('Failed to add collaboration invite:', e);
    return false;
  }
}

export async function removeCollaborationInvite(
  deviceId: string,
  checklistId: string,
): Promise<boolean> {
  const start = performance.now();
  const ctx = await getInboxRef(deviceId);
  if (!ctx) { log('DELETE', `shared_payloads/inbox_${deviceId}/collaborationInvites.${checklistId}`, { error: 'no-db' }, performance.now() - start); return false; }
  const { ref, fs } = ctx;
  const path = `shared_payloads/inbox_${deviceId}/collaborationInvites.${checklistId}`;
  try {
    await fs.updateDoc(ref, {
      [`collaborationInvites.${checklistId}`]: fs.deleteField(),
    });
    log('DELETE', path, { status: 'ok' }, performance.now() - start);
    return true;
  } catch (e) {
    log('DELETE', path, { error: e instanceof Error ? e.message : String(e), status: 'error' }, performance.now() - start);
    console.warn('Failed to remove collaboration invite:', e);
    return false;
  }
}

export async function listenToInbox(
  deviceId: string,
  onChange: (data: Record<string, unknown> | null) => void,
): Promise<() => void> {
  const start = performance.now();
  const ctx = await getInboxRef(deviceId);
  if (!ctx) { log('LISTEN', `shared_payloads/inbox_${deviceId}`, { error: 'no-db' }, performance.now() - start); return () => {}; }
  const { ref, fs } = ctx;
  const path = `shared_payloads/inbox_${deviceId}`;

  let unsub: () => void = () => {};
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const subscribe = () => {
    log('LISTEN', path, { status: 'setup' }, performance.now() - start);
    unsub = fs.onSnapshot(
      ref,
      (snap) => {
        const snapTime = performance.now();
        const exists = snap.exists();
        const raw = snap.data() as Record<string, unknown>;
        const data = exists ? normalizeInboxData(raw) : null;
        const shareCount = exists ? Object.keys(data?.shares || {}).length : 0;
        const inviteCount = exists ? Object.keys(data?.collaborationInvites || {}).length : 0;
        log('SNAPSHOT', path, { exists, shareCount, inviteCount, data, raw }, performance.now() - snapTime);
        onChange(data);
      },
      (error) => {
        log('SNAPSHOT', path, { error: `${error.code}: ${error.message}`, status: 'error' }, performance.now() - start);
        console.warn('Inbox listener error:', error.code, error.message);
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
