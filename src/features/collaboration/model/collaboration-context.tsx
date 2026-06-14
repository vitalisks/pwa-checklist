/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import type { CollaborativeChecklist, CollaborativeItem, Checklist } from '@/shared/config';
import { useShare } from '@/features/share';
import { useChecklist } from '@/app/model/checklist-context';
import { listenToInbox, removeCollaborationInvite } from '@/features/share/api/firestore-service';
import { isFirebaseEnabled } from '@/features/share/config';
import {
  createCollaborativeChecklist,
  updateCollaborativeChecklist,
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
  enableCollaboration: (checklist: Checklist, collaboratorDeviceIds: string[]) => Promise<boolean>;
  addCollaborator: (checklistId: string, deviceId: string) => Promise<boolean>;
  acceptInvite: (checklistId: string) => Promise<void>;
  declineInvite: (checklistId: string) => Promise<void>;
  toggleItem: (checklist: Checklist, categoryId: string, itemId: string, field: 'checked' | 'skipped') => void;
  updateItemText: (checklist: Checklist, categoryId: string, itemId: string, text: string, description: string) => void;
  addItem: (checklist: Checklist, categoryId: string) => CollaborativeItem | undefined;
  updateCategoryName: (checklist: Checklist, categoryId: string, name: string) => void;
  addPhoto: (checklist: Checklist, categoryId: string, itemId: string, photoId: string) => void;
  deletePhoto: (checklist: Checklist, categoryId: string, itemId: string, photoId: string) => void;
  deleteItem: (checklist: Checklist, categoryId: string, itemId: string) => void;
  deleteCategory: (checklist: Checklist, categoryId: string) => void;
  syncChecklist: (checklist: Checklist) => void;
  stopCollaboration: (checklistId: string) => Promise<void>;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const CollaborationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { deviceId, contacts } = useShare();
  const { checklists, updateChecklist, persistChecklist } = useChecklist();
  const enabled = isFirebaseEnabled();

  const [collaborativeIds, setCollaborativeIds] = useState<Set<string>>(new Set());
  const collabCache = useRef<Map<string, CollaborativeChecklist>>(new Map());
  const unsyncFunctions = useRef<Map<string, () => void>>(new Map());
  const lastWrittenAt = useRef<Map<string, number>>(new Map());
  const recentlyDeleted = useRef<Set<string>>(new Set());
  const knownInviteIdsRef = useRef<Set<string>>(new Set());
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const localIds = useRef<Set<string>>(new Set(checklists.map(c => c.id)));
  useEffect(() => { localIds.current = new Set(checklists.map(c => c.id)); });

  const writeToFirestore = useCallback((collab: CollaborativeChecklist) => {
    lastWrittenAt.current.set(collab.id, collab.updatedAt);
    updateCollaborativeChecklist(collab);
  }, []);

  const handleRemoteChange = useCallback((collab: CollaborativeChecklist | null) => {
    if (!collab) {
      return;
    }

    if (recentlyDeleted.current.has(collab.id)) {
      return;
    }

    const lastWrite = lastWrittenAt.current.get(collab.id);
    if (lastWrite && collab.updatedAt <= lastWrite) {
      return;
    }

    const existing = collabCache.current.get(collab.id);
    if (existing) {
      const merged = mergeChecklists(existing, collab);
      if (merged.updatedAt !== existing.updatedAt) {
        collabCache.current.set(collab.id, merged);
        updateChecklist(toChecklist(merged));
      }
    } else {
      collabCache.current.set(collab.id, collab);
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
  }, [updateChecklist, persistChecklist]);

  useEffect(() => {
    if (!enabled) return;

    let initialSnapshotProcessed = false;

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

        // Individual notification for invites arriving after initial snapshot
        if (initialSnapshotProcessed && Notification.permission === 'granted') {
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

      if (Object.keys(invites).length > 0) {
        initialSnapshotProcessed = true;
      }

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

  const getCollaboratorIds = useCallback((id: string): string[] => {
    const existing = collabCache.current.get(id);
    return existing ? existing.collaborators : [];
  }, []);

  const enableCollaboration = useCallback(async (
    checklist: Checklist,
    collaboratorDeviceIds: string[],
  ): Promise<boolean> => {
    const collab = toCollaborativeChecklist(checklist, deviceId, [deviceId, ...collaboratorDeviceIds]);
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
  }, [deviceId, handleRemoteChange]);

  const addCollaborator = useCallback(async (
    checklistId: string,
    deviceIdToAdd: string,
  ): Promise<boolean> => {
    const existing = collabCache.current.get(checklistId);
    if (!existing) return false;
    if (existing.collaborators.includes(deviceIdToAdd)) return true;

    const ok = await addCollaboratorToFirestore(checklistId, deviceIdToAdd);
    if (ok) {
      const updated = {
        ...existing,
        collaborators: [...existing.collaborators, deviceIdToAdd],
      };
      collabCache.current.set(checklistId, updated);
      await inviteCollaborator(deviceIdToAdd, checklistId, deviceId, updated.title);
    }
    return ok;
  }, [deviceId]);

  const acceptInvite = useCallback(async (checklistId: string) => {
    setIncomingInvites(prev => prev.filter(i => i.checklistId !== checklistId));

    const unsub = await listenForCollaborativeChecklist(checklistId, handleRemoteChange);
    unsyncFunctions.current.set(checklistId, unsub);
  }, [handleRemoteChange]);

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

  const addPhoto = useCallback((checklist: Checklist, categoryId: string, itemId: string, photoId: string) => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;
    const item = existing.categories.find(c => c.id === categoryId)?.items.find(i => i.id === itemId);
    if (!item) return;
    const photoIds = [...(item.photoIds || []), photoId];
    const updated = applyLocalEdit(existing, categoryId, itemId, { photoIds }, deviceId);
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(updated);
  }, [deviceId, writeToFirestore]);

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

  const syncChecklist = useCallback((checklist: Checklist) => {
    const existing = collabCache.current.get(checklist.id);
    if (!existing) return;
    const updated = toCollaborativeChecklist(checklist, deviceId, existing.collaborators);
    collabCache.current.set(checklist.id, updated);
    writeToFirestore(updated);
  }, [deviceId, writeToFirestore]);

  const stopCollaboration = useCallback(async (checklistId: string) => {
    recentlyDeleted.current.add(checklistId);
    const unsub = unsyncFunctions.current.get(checklistId);
    if (unsub) {
      unsub();
      unsyncFunctions.current.delete(checklistId);
    }
    collabCache.current.delete(checklistId);
    lastWrittenAt.current.delete(checklistId);
    setCollaborativeIds((prev) => {
      const next = new Set(prev);
      next.delete(checklistId);
      return next;
    });
    await deleteCollaborativeChecklist(checklistId);
  }, []);

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
    addPhoto,
    deletePhoto,
    deleteItem,
    deleteCategory,
    syncChecklist,
    stopCollaboration,
  }), [
    enabled, collaborativeIds, incomingInvites, isCollaborative, getCollaboratorIds, enableCollaboration,
    addCollaborator, acceptInvite, declineInvite, toggleItem, updateItemText, addItem,
    updateCategoryName, addPhoto, deletePhoto, deleteItem, deleteCategory,
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
