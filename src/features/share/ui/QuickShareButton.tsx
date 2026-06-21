import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShare } from '../model';
import { useTranslation } from '@/shared/i18n';
import { DialogPortal } from '@/shared/ui';
import { getAvatarColor, getInitials } from '@/shared/lib';
import SendShareDialog from './SendShareDialog';
import { Share2, X, Users } from 'lucide-react';
import type { Contact, Template, Checklist } from '@/shared/config';
import styles from './QuickShareButton.module.css';

interface Props {
  item: Template | Checklist;
  itemType: 'template' | 'checklist';
}

const QuickShareButton: React.FC<Props> = ({ item, itemType }) => {
  const { contacts, enabled } = useShare();
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  if (!enabled || !contacts.length) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contacts.length === 1) {
      setSelectedContact(contacts[0]);
    } else {
      setShowPicker(true);
    }
  };

  return (
    <span className={styles.wrapper}>
      <button onClick={handleClick} className={styles.triggerBtn} title={t.share.send}>
        <Share2 size={14} />
      </button>

      <DialogPortal>
      <AnimatePresence>
        {showPicker && (
          <motion.div
            key="picker-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={styles.overlay}
            onClick={() => setShowPicker(false)}
          >
            <motion.div
              key="picker-sheet"
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
                  <Users size={14} />
                  {t.share.sendTo}
                </span>
                <button onClick={() => setShowPicker(false)} className={styles.closeBtn}>
                  <X size={14} />
                </button>
              </div>
              <div className={styles.contactList}>
                {contacts.map((c) => (
                  <button
                    key={c.deviceId}
                    className={styles.contactRow}
                    onClick={() => {
                      setShowPicker(false);
                      setSelectedContact(c);
                    }}
                  >
                    <div className={styles.avatar} style={{ background: getAvatarColor(c.deviceId) }}>
                      {getInitials(c.name)}
                    </div>
                    <div className={styles.contactName}>{c.name}</div>
                    <span className={styles.contactId}>{c.deviceId.slice(0, 8)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </DialogPortal>

      {selectedContact && (
        <SendShareDialog
          contact={selectedContact}
          item={item}
          itemType={itemType}
          onClose={() => setSelectedContact(null)}
        />
      )}
    </span>
  );
};

export default QuickShareButton;
