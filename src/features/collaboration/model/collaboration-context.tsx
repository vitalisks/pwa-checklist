/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import type { CollaborativeChecklist, CollaborativeItem, Checklist } from '@/shared/config';
import { useStorage } from '@/shared/api';
import { useShare } from '@/features/share';
import { useChecklist } from '@/app/model/checklist-context';
import { PhotoRepository } from '@/entities/photo';
import { listenToInbox, removeCollaborationInvite } from '@/features/share/api/firestore-service';
import { isFirebaseEnabled } from '@/features/share/config';
import {
  createCollaborativeChecklist,
  updateCollaborativeChecklist,
  updateCollaborativeChecklistFields,
  deleteCollaborativeChecklist,
  listenForCollaborativeChecklist,
  addCollaboratorToFirestore,
  removeCollaboratorFromFirestore,
  inviteCollaborator,
} from '../api/collaboration-service';
import {
  toCollaborativeChecklist,
  toChecklist,
  mergeChecklists,
  applyLocalEdit,
  applyLocalCategoryEdit,
  applyLocalAddItem,
  applyLocalDeleteCategory,
} from './sync-engine';
import { generateUUID } from '@/shared/lib';

export async function readDeviceUidMapping(deviceId: string): Promise<string | null> {
  const { getFirestoreInstance } = await import('@/features/share/api/firebase-init');
  const db = await getFirestoreInstance();
  if (!db) return null;
  const { doc, getDoc } = await import('firebase/firestore');
  try {
    const snap = await getDoc(doc(db, 'device_uid_mappings', deviceId));
    if (snap.exists()) {
      const data = snap.data() as { uid: string };
      return data.uid;
    }
  } catch {
    // Non-critical
  }
  return null;
}

export interface IncomingInvite {
  checklistId: string;
  ownerDeviceId: string;
  ownerName?: string;
  title: string;
  receivedAt: number;
}

interface CollaborationContextType {
  enabled: boolean;
  collaborativeIds: Set<string>;
  incomingInvites: IncomingInvite[];
  isCollaborative: (id: string) => boolean;
  getCollaboratorIds: (checklistId: string) => string[];
  enableCollaboration: (checklist: Checklist, collaboratorDeviceIds: string[], authInfo?: { ownerUid?: string }) => Promise<boolean>;
  addCollaborator: (checklistId: string, deviceId: string, allowedUid?: string) => Promise<boolean>;
  acceptInvite: (checklistId: string) => Promise<void>;
  declineInvite: (checklistId: string) => Promise<void>;
  toggleItem: (checklist: Checklist, categoryId: string, itemId: string, field: 'checked' | 'skipped') => void;
  updateItemText: (checklist: Checklist, categoryId: string, itemId: string, text: string, description: string) => void;
  addItem: (checklist: Checklist, categoryId: string) => CollaborativeItem | undefined;
  updateCategoryName: (checklist: Checklist, categoryId: string, name: string) => void;
  toggleCategoryUnwrap: (checklist: Checklist, categoryId: string) => void;
  addPhoto: (checklist: Checklist, categoryId: string, itemId: string, photoId: string) => void;
  deletePhoto: (checklist: Checklist, categoryId: string, itemId: string, photoId: string) => void;
  deleteItem: (checklist: Checklist, categoryId: string, itemId: string) => void;
  deleteCategory: (checklist: Checklist, categoryId: string) => void;
  syncChecklist: (checklist: Checklist) => void;
  stopCollaboration: (checklistId: string) => Promise<void>;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const CollaborationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storage = useStorage();
  const photoRepo = useMemo(() => new PhotoRepository(storage), [storage]);
  const { deviceId, contacts } = useShare();
  const { checklists, updateChecklist, persistChecklist } = useChecklist();
  const enabled = isFirebaseEnabled();

  const [collaborativeIds, setCollaborativeIds] = useState<Set<string>>(new Set());
  const collabCache = useRef<Map<string, CollaborativeChecklist>>(new Map());
  const unsyncFunctions = useRef<Map<string, () => void>>(new Map());
  const lastWrittenAt = useRef<Map<string, number>>(new Map());
  const recentlyDeleted = useRef<Set<string>>(new Set());
  const recentlyDeletedAt = useRef<Map<string, number>>(new Map());
  const knownInviteIdsRef = useRef<Set<string>>(new Set());
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const isLoaded = useRef(false);
  const localIds = useRef<Set<string>>(new Set(checklists.map(c => c.id)));
  useEffect(() => { localIds.current = new Set(checklists.map(c => c.id)); });

  const writeToFirestore = useCallback((collab: CollaborativeChecklist) => {
    lastWrittenAt.current.set(collab.id, collab.updatedAt);
    updateCollaborativeChecklist(collab);
  }, []);

  const handleRemoteChange = useCallback(async (collab: CollaborativeChecklist | null, checklistId: string) => {
    if (!collab) {
      recentlyDeleted.current.add(checklistId);
      recentlyDeletedAt.current.set(checklistId, Date.now());
      unsyncFunctions.current.delete(checklistId);
      collabCache.current.delete(checklistId);
      lastWrittenAt.current.delete(checklistId);
      recentlyDeleted.current.delete(checklistId);
      setCollaborativeIds((prev) => {
        const next = new Set(prev);
        next.delete(checklistId);
        return next;
      });
      return;
    }

    if (recentlyDeleted.current.has(collab.id)) {
      return;
    }

    const lastWrite = lastWrittenAt.current.get(collab.id);
    if (lastWrite && collab.updatedAt <= lastWrite) {
      return;
    }

    // Save incoming photo data to IndexedDB
    if (collab.photoDataUrls) {
      for (const [photoId, dataUrl] of Object.entries(collab.photoDataUrls)) {
        const existing = await photoRepo.get(photoId);
        if (!existing) {
          await photoRepo.save({ itemId: photoId, dataUrl, updatedAt: Date.now() });
        }
      }
    }
    const processed = collab.photoDataUrls ? { ...collab, photoDataUrls: undefined } : collab;

    const existing = collabCache.current.get(collab.id);
    if (existing) {
      const merged = mergeChecklists(existing, processed);
      if (merged.updatedAt !== existing.updatedAt) {
        collabCache.current.set(collab.id, merged);
        updateChecklist(toChecklist(merged));
      }
    } else {
      collabCache.current.set(collab.id, processed);
      setCollaborativeIds((prev) => {
        const next = new Set(prev);
        next.add(collab.id);
        return next;
      });
      if (localIds.current.has(collab.id)) {
        updateChecklist(toChecklist(collab));
      } else {
        persistChecklist(toChecklist(collab));
      }
    }
  }, [updateChecklist, persistChecklist, photoRepo]);

  // Load collaborative IDs from IndexedDB on mount and restore listeners
  useEffect(() => {
    if (!enabled || !deviceId) return;

    let cancelled = false;

    (async () => {
      const saved = await storage.getMeta<string[]>('collaborativeIds');
      if (cancelled) return;

      isLoaded.current = true;

      if (saved) {
        setCollaborativeIds(new Set(saved));

        for (const id of saved) {
          if (cancelled) break;
          if (collabCache.current.has(id)) continue;

          const unsub = await listenForCollaborativeChecklist(id, handleRemoteChange);
          unsyncFunctions.current.set(id, unsub);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [enabled, deviceId, handleRemoteChange, storage]);

  // Persist collaborative IDs to IndexedDB on every change
  useEffect(() => {
    if (!enabled || !isLoaded.current) return;

    const arr = [...collaborativeIds];
    if (arr.length > 0) {
      storage.setMeta('collaborativeIds', arr);
    } else {
      storage.deleteMeta('collaborativeIds');
    }
  }, [collaborativeIds, storage, enabled]);

  // Cleanup expired recentlyDeleted entries (60s TTL)
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const cutoff = Date.now() - 60_000;
      for (const [id, ts] of recentlyDeletedAt.current) {
        if (ts < cutoff) {
          recentlyDeleted.current.delete(id);
          recentlyDeletedAt.current.delete(id);
        }
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let isFirstSnapshot = true;

    const unsubPromise = listenToInbox(deviceId, (data) => {
      if (!data) return;
      const invites = (data.collaborationInvites as Record<string, Record<string, unknown>> | undefined) || {};
      const currentIds = new Set(Object.keys(invites));

      // Detect new invites and add to state
      for (const checklistId of Object.keys(invites)) {
        if (knownInviteIdsRef.current.has(checklistId)) continue;
        knownInviteIdsRef.current.add(checklistId);

        const entry = invites[checklistId] as { ownerDeviceId?: string; title?: string; ownerName?: string };
        setIncomingInvites(prev => [...prev, {
          checklistId,
          ownerDeviceId: entry.ownerDeviceId || '',
          ownerName: entry.ownerName,
          title: entry.title || '',
          receivedAt: Date.now(),
        }]);

        // Individual notification for invites arriving after the initial snapshot
        if (!isFirstSnapshot && Notification.permission === 'granted') {
          const sender = contacts.find(c => c.deviceId === (entry as Record<string, string>).ownerDeviceId);
          const senderName = sender?.name || 'Someone';
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification('Moirai', {
              body: `${senderName} invited you to collaborate on: ${entry.title || 'a checklist'}`,
              icon: '/icon.svg',
              badge: '/icon.svg',
              tag: `collab-invite-${checklistId}`,
              renotify: true,
            });
          }).catch(() => {});
        }
      }

      isFirstSnapshot = false;

      // Cleanup when invite disappears from inbox (sender removed it)
      for (const checklistId of knownInviteIdsRef.current) {
        if (!currentIds.has(checklistId)) {
          knownInviteIdsRef.current.delete(checklistId);
          setIncomingInvites(prev => prev.filter(i => i.checklistId !== checklistId));

          const unsub = unsyncFunctions.current.get(checklistId);
          if (unsub) {
            unsub();
            unsyncFunctions.current.delete(checklistId);
          }
          collabCache.current.delete(checklistId);
          recentlyDeleted.current.delete(checklistId);
          setCollaborativeIds((prev) => {
            const next = new Set(prev);
            next.delete(checklistId);
            return next;
          });
        }
      }
    });

    return () => {
      unsubPromise.then((u) => {
        u();
      });
    };
  }, [enabled, deviceId, contacts]);

  const isCollaborative = useCallback((id: string): boolean => {
    return collaborativeIds.has(id);
  }, [collaborativeIds]);

  const collectPhotoIds = useCallback((cl: Checklist): Set<string> => {
    const ids = new Set<string>();
    for (const cat of cl.categories) {
      for (const item of cat.items) {
        for (const pid of item.photoIds ?? []) ids.add(pid);
        for (const pid of item.guidePhotoIds ?? []) ids.add(pid);
      }
    }
    return ids;
  }, []);

  const getMissingPhotoDataUrls = useCallback(async (checklist: Checklist, existing: CollaborativeChecklist): Promise<Record<string, string> | undefined> => {
    const existingIds = collectPhotoIds(toChecklist(existing));
    const newIds = new Set([...collectPhotoIds(checklist)].filter(id => !existingIds.has(id)));
    if (newIds.size === 0) return undefined;

    const result: Record<string, string> = {};
    for (const photoId of newIds) {
      const photo = await photoRepo.get(photoId);
      if (photo) result[photoId] = photo.dataUrl;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }, [collectPhotoIds, photoRepo]);

  const getCollaboratorIds = useCallback((id: string): string[] => {
    const existing = collabCache.current.get(id);
    return existing ? existing.collaborators : [];
  }, []);

  const enableCollaboration = useCallback(async (
    checklist: Checklist,
    collaboratorDeviceIds: string[],
    authInfo?: { ownerUid?: string },
  ): Promise<boolean> => {
    // Load all existing photo data URLs for the invitees
    const allPhotoIds = collectPhotoIds(checklist);
    const photoDataUrls: Record<string, string> = {};
    for (const photoId of allPhotoIds) {
      const photo = await photoRepo.get(photoId);
      if (photo) photoDataUrls[photoId] = photo.dataUrl;
    }

    const allowedUids: string[] = [];
    if (authInfo?.ownerUid) {
      allowedUids.push(authInfo.ownerUid);
      // Look up UIDs for collaborator device IDs
      for (const collabDeviceId of collaboratorDeviceIds) {
        const mapping = await readDeviceUidMapping(collabDeviceId);
        if (mapping) allowedUids.push(mapping);
      }
    }

    const collab = toCollaborativeChecklist(
      checklist, deviceId, [deviceId, ...collaboratorDeviceIds],
      Object.keys(photoDataUrls).length > 0 ? photoDataUrls : undefined,
      authInfo?.ownerUid ? { ownerUid: authInfo.ownerUid, allowedUids: allowedUids.length > 1 ? allowedUids : undefined } : undefined,
    );
    const ok = await createCollaborativeChecklist(collab);
    if (ok) {
      collabCache.current.set(collab.id, collab);
      setCollaborativeIds((prev) => {
        const next = new Set(prev);
        next.add(collab.id);
        return next;
      });

      for (const collabDeviceId of collaboratorDeviceIds) {
        await inviteCollaborator(collabDeviceId, collab.id, deviceId, collab.title);
      }

      listenForCollaborativeChecklist(collab.id, handleRemoteChange).then((unsub) => {
        unsyncFunctions.current.set(collab.id, unsub);
      });
    }
    return ok;
  }, [deviceId, handleRemoteChange, collectPhotoIds, photoRepo]);

  const addCollaborator = useCallback(async (
    checklistId: string,
    deviceIdToAdd: string,
    allowedUid?: string,
  ): Promise<boolean> => {
    const existing = collabCache.current.get(checklistId);
    if (!existing) return false;
    if (existing.collaborators.includes(deviceIdToAdd)) return true;

    const ok = await addCollaboratorToFirestore(checklistId, deviceIdToAdd);
    if (ok) {
      const newAllowedUids = existing.allowedUids ? [...existing.allowedUids] : [];
      if (allowedUid && !newAllowedUids.includes(allowedUid)) {
        newAllowedUids.push(allowedUid);
      }

      const updated: CollaborativeChecklist = {
        ...existing,
        collaborators: [...existing.collaborators, deviceIdToAdd],
        ...(newAllowedUids.length > 0 ? { allowedUids: newAllowedUids } : {}),
      };
      collabCache.current.set(checklistId, updated);
      await inviteCollaborator(deviceIdToAdd, checklistId, deviceId, updated.title);

      // Update Firestore with new allowedUids as well
      if (allowedUid) {
        await updateCollaborativeChecklistFields(checklistId, { allowedUids: newAllowedUids });
      }
    }
    return ok;
  }, [deviceId]);

  const acceptInvite = useCallback(async (checklistId: string) => {
    setIncomingInvites(prev => prev.filter(i => i.checklistId !== checklistId));
    knownInviteIdsRef.current.delete(checklistId);
    setCollaborativeIds((prev) => {
      const next = new Set(prev);
      next.add(checklistId);
      return next;
    });
    await removeCollaborationInvite(deviceId, checklistId);

    const unsub = await listenForCollaborativeChecklist(checklistId, handleRemoteChange);
    unsyncFunctions.current.set(checklistId, unsub);
  }, [deviceId, handleRemoteChange]);

  const declineInvite = useCallback(async (checklistId: string) => {
    setIncomingInvites(prev => prev.filter(i => i.checklistId !== checklistId));
    knownInviteIdsRef.current.delete(checklistId);
    await removeCollaborationInvite(deviceId, checklistId);
    await removeCollaboratorFromFirestore(checklistId, deviceId);
  }, [deviceId]);

  const toggleItem = useCallback((
    checklist: Checklist,
    categoryId: string,
    itemId: string,
    field: 'checked' | 'skipped',
  ) => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;

    const updates = field === 'checked'
      ? { checked: !checklist.categories
          .find(c => c.id === categoryId)?.items.find(i => i.id === itemId)?.checked,
          skipped: false }
      : { skipped: !checklist.categories
          .find(c => c.id === categoryId)?.items.find(i => i.id === itemId)?.skipped,
          checked: false };

    const updated = applyLocalEdit(existing, categoryId, itemId, updates, deviceId);
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(updated);
  }, [deviceId, writeToFirestore]);

  const updateItemText = useCallback((
    checklist: Checklist,
    categoryId: string,
    itemId: string,
    text: string,
    description: string,
  ) => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;
    const updated = applyLocalEdit(existing, categoryId, itemId, { text, description }, deviceId);
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(updated);
  }, [deviceId, writeToFirestore]);

  const addItem = useCallback((checklist: Checklist, categoryId: string): CollaborativeItem | undefined => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;
    const newItem: CollaborativeItem = {
      id: generateUUID(),
      text: '',
      description: '',
      checked: false,
      photoIds: [],
      guidePhotoIds: [],
      imageLinks: [],
      updatedAt: Date.now(),
      updatedBy: deviceId,
    };
    const updated = applyLocalAddItem(existing, categoryId, newItem);
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(updated);
    return newItem;
  }, [deviceId, writeToFirestore]);

  const updateCategoryName = useCallback((checklist: Checklist, categoryId: string, name: string) => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;
    const updated = applyLocalCategoryEdit(existing, categoryId, { name });
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(updated);
  }, [writeToFirestore]);

  const addPhoto = useCallback(async (checklist: Checklist, categoryId: string, itemId: string, photoId: string) => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;
    const item = existing.categories.find(c => c.id === categoryId)?.items.find(i => i.id === itemId);
    if (!item) return;
    const photoIds = [...(item.photoIds || []), photoId];

    // Include photo data URL so collaborators can download it
    const photo = await photoRepo.get(photoId);
    const photoDataUrls = photo ? { [photoId]: photo.dataUrl } : undefined;

    const updated = applyLocalEdit(existing, categoryId, itemId, { photoIds }, deviceId);
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(photoDataUrls ? { ...updated, photoDataUrls } : updated);
  }, [deviceId, writeToFirestore, photoRepo]);

  const deletePhoto = useCallback((checklist: Checklist, categoryId: string, itemId: string, photoId: string) => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;
    const item = existing.categories.find(c => c.id === categoryId)?.items.find(i => i.id === itemId);
    if (!item) return;
    const photoIds = (item.photoIds || []).filter(id => id !== photoId);
    const updated = applyLocalEdit(existing, categoryId, itemId, { photoIds }, deviceId);
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(updated);
  }, [deviceId, writeToFirestore]);

  const deleteItem = useCallback((checklist: Checklist, categoryId: string, itemId: string) => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;
    const updated = applyLocalEdit(existing, categoryId, itemId, { deleted: true as const }, deviceId);
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(updated);
  }, [deviceId, writeToFirestore]);

  const deleteCategory = useCallback((checklist: Checklist, categoryId: string) => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;
    const updated = applyLocalDeleteCategory(existing, categoryId, deviceId);
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(updated);
  }, [deviceId, writeToFirestore]);

  const toggleCategoryUnwrap = useCallback((checklist: Checklist, categoryId: string) => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;
    const updated = {
      ...existing,
      categories: existing.categories.map((c) =>
        c.id === categoryId ? { ...c, unwrapped: !c.unwrapped } : c,
      ),
      updatedAt: Date.now(),
    };
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(updated);
  }, [writeToFirestore]);

  const syncChecklist = useCallback(async (checklist: Checklist) => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;
    const photoDataUrls = await getMissingPhotoDataUrls(checklist, existing);
    const updated = toCollaborativeChecklist(checklist, deviceId, existing.collaborators, photoDataUrls);
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(updated);
  }, [deviceId, writeToFirestore, getMissingPhotoDataUrls]);

  const stopCollaboration = useCallback(async (checklistId: string) => {
    recentlyDeleted.current.add(checklistId);
    recentlyDeletedAt.current.set(checklistId, Date.now());
    const unsub = unsyncFunctions.current.get(checklistId);
    if (unsub) {
      unsub();
      unsyncFunctions.current.delete(checklistId);
    }

    const existing = collabCache.current.get(checklistId);
    if (existing && existing.ownerDeviceId === deviceId) {
      await deleteCollaborativeChecklist(checklistId);
    } else if (existing) {
      await removeCollaboratorFromFirestore(checklistId, deviceId);
    }

    collabCache.current.delete(checklistId);
    lastWrittenAt.current.delete(checklistId);
    setCollaborativeIds((prev) => {
      const next = new Set(prev);
      next.delete(checklistId);
      return next;
    });
  }, [deviceId]);

  const value = useMemo(() => ({
    enabled,
    collaborativeIds,
    incomingInvites,
    isCollaborative,
    getCollaboratorIds,
    enableCollaboration,
    addCollaborator,
    acceptInvite,
    declineInvite,
    toggleItem,
    updateItemText,
    addItem,
    updateCategoryName,
    toggleCategoryUnwrap,
    addPhoto,
    deletePhoto,
    deleteItem,
    deleteCategory,
    syncChecklist,
    stopCollaboration,
  }), [
    enabled, collaborativeIds, incomingInvites, isCollaborative, getCollaboratorIds, enableCollaboration,
    addCollaborator, acceptInvite, declineInvite, toggleItem, updateItemText, addItem,
    updateCategoryName, toggleCategoryUnwrap, addPhoto, deletePhoto, deleteItem, deleteCategory,
    syncChecklist, stopCollaboration,
  ]);

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

export function useCollaboration(): CollaborationContextType {
  const ctx = useContext(CollaborationContext);
  if (!ctx) throw new Error('useCollaboration must be used within a CollaborationProvider');
  return ctx;
}
