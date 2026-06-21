import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/shared/i18n';
import { DialogPortal } from '@/shared/ui';
import { useShare } from '@/features/share';
import { useAuth } from '@/features/auth';
import { useCollaboration, readDeviceUidMapping } from '../model/collaboration-context';
import type { Checklist } from '@/shared/config';
import { getAvatarColor, getInitials } from '@/shared/lib';
import { Users, X, Check, Globe, Lock } from 'lucide-react';
import styles from './CollaboratorPicker.module.css';

interface Props {
  checklist: Checklist;
  onClose: () => void;
}

export const CollaboratorPicker: React.FC<Props> = ({ checklist, onClose }) => {
  const { t } = useTranslation();
  const { contacts } = useShare();
  const { isCollaborative, getCollaboratorIds, enableCollaboration, addCollaborator } = useCollaboration();
  const { isAuthenticated, authState } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [makePublic, setMakePublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [uidMapping, setUidMapping] = useState<Map<string, boolean>>(new Map());

  const alreadyCollaborative = isCollaborative(checklist.id);
  const existingCollaborators = alreadyCollaborative ? getCollaboratorIds(checklist.id) : [];

  // Fetch UID registration status for all contacts once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        contacts.map(c => readDeviceUidMapping(c.deviceId).then(Boolean))
      );
      if (cancelled) return;
      const map = new Map<string, boolean>();
      contacts.forEach((c, i) => map.set(c.deviceId, results[i]));
      setUidMapping(map);
    })();
    return () => { cancelled = true; };
  }, [contacts]);

  const hasUnregistered = useMemo(
    () => selected.size > 0 && Array.from(selected).some(d => !uidMapping.get(d)),
    [selected, uidMapping],
  );

  // Force public when any collaborator is unregistered
  const isPublic = makePublic || hasUnregistered;

  const toggleContact = (deviceId: string) => {
    if (done) return;
    if (existingCollaborators.includes(deviceId)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) next.delete(deviceId);
      else next.add(deviceId);
      return next;
    });
  };

  const handleStart = async () => {
    if (selected.size === 0) return;
    setSaving(true);

    // Determine auth protection level
    let authInfo: { ownerUid: string } | undefined;
    if (isAuthenticated && !makePublic && authState.user) {
      const uidResults = await Promise.all(
        Array.from(selected).map(d => readDeviceUidMapping(d).then(Boolean))
      );
      if (uidResults.every(Boolean)) {
        authInfo = { ownerUid: authState.user.uid };
      }
    }

    if (alreadyCollaborative) {
      const selectedArr = Array.from(selected);
      let allOk = true;
      for (const deviceIdToAdd of selectedArr) {
        const ok = await addCollaborator(checklist.id, deviceIdToAdd);
        if (!ok) allOk = false;
      }
      if (allOk) {
        setDone(true);
        setTimeout(onClose, 1400);
      }
    } else {
      const ok = await enableCollaboration(checklist, Array.from(selected), authInfo);
      if (ok) {
        setDone(true);
        setTimeout(onClose, 1400);
      }
    }

    setSaving(false);
  };

  const count = selected.size;

  return (
    <DialogPortal>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={styles.overlay}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '30%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 400, mass: 0.8 }}
          className={styles.sheet}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.handle} />

          <div className={styles.header}>
            <span className={styles.title}>
              <Users size={16} className={styles.titleIcon} />
              {alreadyCollaborative ? t.collaboration.addCollaborator : t.collaboration.collaborate}
            </span>
            <button onClick={onClose} className={styles.closeBtn}>
              <X size={14} />
            </button>
          </div>

          {contacts.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={28} className={styles.emptyIcon} />
              <p className={styles.emptyText}>
                {t.collaboration.pickContacts}
              </p>
            </div>
          ) : (
            <div className={styles.contactList}>
                {contacts.map((c) => {
                const isSelected = selected.has(c.deviceId);
                const isExisting = existingCollaborators.includes(c.deviceId);
                return (
                  <div
                    key={c.deviceId}
                    className={`${styles.contactRow} ${isSelected ? styles.contactRowSelected : ''} ${isExisting ? styles.contactRowDisabled : ''}`}
                    onClick={() => toggleContact(c.deviceId)}
                  >
                    <div
                      className={styles.avatar}
                      style={{ background: getAvatarColor(c.deviceId) }}
                    >
                      {getInitials(c.name)}
                    </div>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactName}>{c.name}</div>
                      <div className={styles.contactId}>{c.deviceId.slice(0, 8)}</div>
                    </div>
                    {isExisting ? (
                      <span className={styles.addedBadge}>{t.collaboration.added}</span>
                    ) : (
                      <motion.div
                        className={`${styles.checkbox} ${isSelected ? styles.checkboxChecked : ''}`}
                        animate={isSelected ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isSelected && <Check size={12} className={styles.checkIcon} />}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {isAuthenticated && !alreadyCollaborative && selected.size > 0 && (
            <div className={styles.publicToggle}>
              <div className={styles.accessStatus}>
                {isPublic ? (
                  <><Globe size={12} className={styles.accessIcon} /> {t.collaboration.public}</>
                ) : (
                  <><Lock size={12} className={styles.accessIconPrivate} /> {t.collaboration.private}</>
                )}
              </div>
              <label className={styles.toggleLabel}>
                <span className={styles.toggleText}>
                  {t.collaboration.makePublic}
                  <span className={styles.toggleDesc}>
                    {isPublic
                      ? t.collaboration.publicDesc
                      : t.collaboration.privateDesc}
                  </span>
                  {hasUnregistered && (
                    <span className={styles.warningText}>
                      {t.collaboration.unregisteredWarning}
                    </span>
                  )}
                </span>
                <button
                  className={`${styles.toggleSwitch} ${isPublic ? styles.toggleOn : ''}`}
                  onClick={() => setMakePublic(prev => !prev)}
                  disabled={hasUnregistered}
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </label>
            </div>
          )}

          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.successState}
            >
              <Check size={18} className={styles.successIcon} />
              {alreadyCollaborative ? t.collaboration.addedCollaborator : t.collaboration.started}
            </motion.div>
          ) : (
            contacts.length > 0 && (
              <div className={styles.footer}>
                <button onClick={onClose} className={styles.cancelBtn}>
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleStart}
                  disabled={count === 0 || saving}
                  className={styles.shareBtn}
                >
                  {saving ? (
                    <div className={styles.spinner} />
                  ) : (
                    <>
                      <Users size={16} className={styles.btnIcon} />
                      {count === 0
                        ? (alreadyCollaborative ? t.collaboration.addCollaborator : t.collaboration.collaborate)
                        : (alreadyCollaborative
                          ? t.collaboration.addCollaborator
                          : t.collaboration.collaborateWith.replace('{count}', String(count)))}
                    </>
                  )}
                </button>
              </div>
            )
          )}
        </motion.div>
        </motion.div>
    </AnimatePresence>
    </DialogPortal>
  );
};
