import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/shared/i18n';
import { DialogPortal } from '@/shared/ui';
import { useShare } from '@/features/share';
import { useCollaboration } from '../model/collaboration-context';
import type { Checklist } from '@/shared/config';
import { Users, X, Check } from 'lucide-react';
import styles from './CollaboratorPicker.module.css';

interface Props {
  checklist: Checklist;
  onClose: () => void;
}

const AVATAR_COLORS = [
  '#5bbd7e', '#4a9eff', '#e8a44a', '#d45b8a',
  '#6c5ce7', '#00b894', '#fd79a8', '#0984e3',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';
}

export const CollaboratorPicker: React.FC<Props> = ({ checklist, onClose }) => {
  const { t } = useTranslation();
  const { contacts } = useShare();
  const { isCollaborative, getCollaboratorIds, enableCollaboration, addCollaborator } = useCollaboration();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const alreadyCollaborative = isCollaborative(checklist.id);
  const existingCollaborators = alreadyCollaborative ? getCollaboratorIds(checklist.id) : [];

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
      const ok = await enableCollaboration(checklist, Array.from(selected));
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
