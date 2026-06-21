/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Contact, Template, Checklist } from '@/shared/config';
import { useStorage } from '@/shared/api';
import { ContactRepository } from '@/entities/contact';
import { generateUUID, getDeviceId, getDeviceName, setDeviceName } from '@/shared/lib';
import { isFirebaseEnabled } from '../config';
import { addShareToInbox, removeShareFromInbox, listenToInbox } from '../api/firestore-service';
import type { IncomingShare } from './share-types';

function encodeContactCode(deviceId: string, name: string): string {
  const json = JSON.stringify({ v: 1, d: deviceId, n: name });
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return 'm1_' + btoa(binary);
}

function decodeContactCode(code: string): { deviceId: string; name: string } | null {
  try {
    const raw = code.startsWith('m1_') ? code.slice(3) : code;
    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (data.v === 1 && data.d) {
      return { deviceId: data.d, name: data.n || data.d.slice(0, 8) };
    }
    return null;
  } catch {
    return parseLegacyCode(code);
  }
}

function parseLegacyCode(code: string): { deviceId: string; name: string } | null {
  const parts = code.split(':');
  if (
    parts.length >= 3 &&
    parts[0] === 'moirai' &&
    parts[1] === 'contact' &&
    parts[2].length > 0
  ) {
    return {
      deviceId: parts[2],
      name: parts[3] || parts[2].slice(0, 8),
    };
  }
  return null;
}

async function showIncomingNotification(
  senderName: string | undefined,
  itemType: 'template' | 'checklist',
  title: string,
  shareId: string,
) {
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('Moirai', {
      body: `${senderName || 'Someone'} shared ${itemType === 'template' ? 'a template' : 'a checklist'} with you: ${title}`,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { shareId },
      tag: `share-${shareId}`,
      renotify: true,
    });
  } catch {
    // notification not supported
  }
}

interface SharingContextType {
  enabled: boolean;
  myCode: string;
  deviceId: string;
  deviceName: string;
  setDeviceName: (name: string) => void;
  contacts: Contact[];
  incomingShares: IncomingShare[];
  notificationGranted: boolean;
  requestNotification: () => Promise<boolean>;
  addContactFromCode: (code: string, customName?: string) => Promise<string | null>;
  updateContact: (deviceId: string, updates: Partial<Pick<Contact, 'name'>>) => Promise<void>;
  removeContact: (deviceId: string) => Promise<void>;
  shareChecklist: (contact: Contact, checklist: Checklist, photos?: Record<string, string>) => Promise<boolean>;
  shareTemplate: (contact: Contact, template: Template, photos?: Record<string, string>) => Promise<boolean>;
  acceptShare: (share: IncomingShare) => Promise<{ payload: Template | Checklist; photos?: Record<string, string> } | null>;
  dismissShare: (share: IncomingShare) => Promise<void>;
}

const SharingContext = createContext<SharingContextType | undefined>(undefined);

export const ShareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storage = useStorage();
  const contactRepo = useMemo(() => new ContactRepository(storage), [storage]);

  const enabled = isFirebaseEnabled();
  const deviceId = useMemo(() => getDeviceId(), []);
  const [deviceName, setDeviceNameState] = useState(getDeviceName);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [incomingShares, setIncomingShares] = useState<IncomingShare[]>([]);
  const [notificationGranted, setNotificationGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted',
  );

  const myCode = useMemo(() => encodeContactCode(deviceId, deviceName), [deviceId, deviceName]);

  useEffect(() => {
    if (!enabled) return;
    contactRepo.getAll().then(setContacts);
  }, [enabled, contactRepo]);

  useEffect(() => {
    if (!enabled) return;

    const knownShareIds = new Set<string>();
    let initialSnapshotProcessed = false;
    let pendingShareCount = 0;

    const unsubPromise = listenToInbox(deviceId, (data) => {
      if (!data) { console.log('[Inbox] received null data'); return; }
      const sharesMap = (data.shares as Record<string, Record<string, unknown>> | undefined) || {};

      const newShareIds: string[] = [];
      for (const [shareId, entry] of Object.entries(sharesMap)) {
        if (knownShareIds.has(shareId)) continue;
        knownShareIds.add(shareId);
        newShareIds.push(shareId);
        const share: IncomingShare = {
          shareId,
          type: entry.itemType as 'template' | 'checklist',
          senderDeviceId: entry.senderDeviceId as string,
          senderName: entry.senderName as string | undefined,
          title: entry.title as string,
          data: entry.payloadData as string,
          photos: entry.photos as Record<string, string> | undefined,
          sharedAt: entry.sharedAt as number,
          receivedAt: Date.now(),
          status: 'pending',
        };
        setIncomingShares((prev) => [share, ...prev]);
      }

      if (newShareIds.length > 0 && notificationGranted) {
        if (!initialSnapshotProcessed) {
          pendingShareCount += newShareIds.length;
        } else {
          for (const shareId of newShareIds) {
            const entry = sharesMap[shareId];
            const share: IncomingShare = {
              shareId,
              type: entry.itemType as 'template' | 'checklist',
              senderDeviceId: entry.senderDeviceId as string,
              senderName: entry.senderName as string | undefined,
              title: entry.title as string,
              data: entry.payloadData as string,
              photos: entry.photos as Record<string, string> | undefined,
              sharedAt: entry.sharedAt as number,
              receivedAt: Date.now(),
              status: 'pending',
            };
            showIncomingNotification(share.senderName, share.type, share.title, shareId);
          }
        }
      }

      if (!initialSnapshotProcessed) {
        if (Object.keys(sharesMap).length > 0) {
          initialSnapshotProcessed = true;
          if (pendingShareCount > 0 && notificationGranted) {
            const count = pendingShareCount;
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification('Moirai', {
                body: `You have ${count} pending share${count > 1 ? 's' : ''}`,
                icon: '/icon.svg',
                badge: '/icon.svg',
                tag: 'shares-summary',
                renotify: true,
              });
            }).catch(() => {});
            pendingShareCount = 0;
          }
        }
      }
    });

    return () => {
      unsubPromise.then((u) => u());
    };
  }, [enabled, deviceId, notificationGranted]);

  const handleSetDeviceName = useCallback((name: string) => {
    setDeviceNameState(name);
    setDeviceName(name);
  }, []);

  const requestNotification = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false;
    try {
      const result = await Notification.requestPermission();
      const granted = result === 'granted';
      setNotificationGranted(granted);
      return granted;
    } catch {
      setNotificationGranted(false);
      return false;
    }
  }, []);

  const addContactFromCode = useCallback(async (code: string, customName?: string): Promise<string | null> => {
    const parsed = decodeContactCode(code);
    if (!parsed) return 'Invalid code format';
    if (parsed.deviceId === deviceId) return 'Cannot add yourself';

    const existing = contacts.find((c) => c.deviceId === parsed.deviceId);
    if (existing) return 'Contact already added';

    const contact: Contact = {
      deviceId: parsed.deviceId,
      name: (customName || parsed.name).trim(),
      addedAt: Date.now(),
    };

    if (!contact.name) return 'Name is required';

    try {
      await contactRepo.add(contact);
      setContacts((prev) => [...prev, contact]);
      return null;
    } catch {
      return 'Failed to save contact';
    }
  }, [contacts, contactRepo, deviceId]);

  const updateContact = useCallback(async (id: string, updates: Partial<Pick<Contact, 'name'>>) => {
    const contact = contacts.find((c) => c.deviceId === id);
    if (!contact) return;
    const updated = { ...contact, ...updates };
    await contactRepo.update(updated);
    setContacts((prev) => prev.map((c) => (c.deviceId === id ? updated : c)));
  }, [contacts, contactRepo]);

  const removeContact = useCallback(async (id: string) => {
    await contactRepo.delete(id);
    setContacts((prev) => prev.filter((c) => c.deviceId !== id));
  }, [contactRepo]);

  const shareHelper = useCallback(async (
    contact: Contact,
    payload: Template | Checklist,
    itemType: 'template' | 'checklist',
    photos?: Record<string, string>,
  ): Promise<boolean> => {
    const title = 'title' in payload ? payload.title : 'Untitled';
    const data = JSON.stringify(payload);
    const shareId = generateUUID();

    const ok = await addShareToInbox(contact.deviceId, shareId, {
      senderDeviceId: deviceId,
      senderName: deviceName || null,
      itemType,
      title,
      payloadData: data,
      photos,
      sharedAt: Date.now(),
    });

    if (!ok) return false;

    await contactRepo.update({ ...contact, lastSentAt: Date.now() });
    setContacts((prev) => prev.map((c) =>
      c.deviceId === contact.deviceId ? { ...c, lastSentAt: Date.now() } : c,
    ));

    return true;
  }, [deviceId, deviceName, contactRepo]);

  const shareChecklist = useCallback((contact: Contact, checklist: Checklist, photos?: Record<string, string>) =>
    shareHelper(contact, checklist, 'checklist', photos), [shareHelper]);

  const shareTemplate = useCallback((contact: Contact, template: Template, photos?: Record<string, string>) =>
    shareHelper(contact, template, 'template', photos), [shareHelper]);

  const acceptShare = useCallback(async (share: IncomingShare): Promise<{ payload: Template | Checklist; photos?: Record<string, string> } | null> => {
    try {
      const parsed = JSON.parse(share.data) as Template | Checklist;
      await removeShareFromInbox(deviceId, share.shareId);
      setIncomingShares((prev) =>
        prev.map((s) =>
          s.shareId === share.shareId ? { ...s, status: 'accepted' as const } : s,
        ),
      );
      return { payload: parsed, photos: share.photos };
    } catch {
      return null;
    }
  }, [deviceId]);

  const dismissShare = useCallback(async (share: IncomingShare) => {
    await removeShareFromInbox(deviceId, share.shareId);
    setIncomingShares((prev) => prev.filter((s) => s.shareId !== share.shareId));
  }, [deviceId]);

  const value = useMemo(() => ({
    enabled,
    myCode,
    deviceId,
    deviceName,
    setDeviceName: handleSetDeviceName,
    contacts,
    incomingShares,
    notificationGranted,
    requestNotification,
    addContactFromCode,
    updateContact,
    removeContact,
    shareChecklist,
    shareTemplate,
    acceptShare,
    dismissShare,
  }), [
    enabled, myCode, deviceId, deviceName, handleSetDeviceName,
    contacts, incomingShares, notificationGranted, requestNotification,
    addContactFromCode, updateContact, removeContact,
    shareChecklist, shareTemplate, acceptShare, dismissShare,
  ]);

  return (
    <SharingContext.Provider value={value}>
      {children}
    </SharingContext.Provider>
  );
};

export function useShare(): SharingContextType {
  const ctx = useContext(SharingContext);
  if (!ctx) throw new Error('useShare must be used within a ShareProvider');
  return ctx;
}
