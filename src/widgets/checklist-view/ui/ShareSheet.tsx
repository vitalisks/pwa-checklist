import React from 'react';
import { Users, UserPlus, X } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import type { Contact } from '@/shared/config';
import { motion, AnimatePresence } from 'framer-motion';
import { DialogPortal } from '@/shared/ui';
import { getAvatarColor, getInitials } from './utils';
import styles from './ChecklistView.module.css';

interface ShareSheetProps {
  isOpen: boolean;
  contacts: Contact[];
  onSend: (contact: Contact) => void;
  onAddContact: () => void;
  onClose: () => void;
}

const ShareSheet: React.FC<ShareSheetProps> = ({ isOpen, contacts, onSend, onAddContact, onClose }) => {
  const { t } = useTranslation();

  return (
    <DialogPortal>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="share-picker-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className={styles.shareOverlay}
          onClick={onClose}
        >
          <motion.div
            key="share-picker-sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '30%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 400, mass: 0.8 }}
            className={styles.shareSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.shareHandle} />
            <div className={styles.shareHeader}>
              <span className={styles.shareTitle}>
                <Users size={14} />
                {t.share.sendTo}
              </span>
              <button onClick={onClose} className={styles.shareClose}>
                <X size={14} />
              </button>
            </div>
            <div className={styles.shareContactList}>
              {contacts.length === 0 && (
                <p className={styles.shareEmpty}>{t.share.noContacts}</p>
              )}
              {contacts.map((c) => (
                <button
                  key={c.deviceId}
                  className={styles.shareContactRow}
                  onClick={() => onSend(c)}
                >
                  <div className={styles.shareAvatar} style={{ background: getAvatarColor(c.deviceId) }}>
                    {getInitials(c.name)}
                  </div>
                  <span className={styles.shareContactName}>{c.name}</span>
                  <span className={styles.shareContactId}>{c.deviceId.slice(0, 8)}</span>
                </button>
              ))}
              <button
                className={styles.addContactRow}
                onClick={onAddContact}
              >
                <UserPlus size={14} />
                {t.share.addContact}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </DialogPortal>
  );
};

export default ShareSheet;
