import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/shared/i18n';
import { useShare } from '../model';
import { DialogPortal } from '@/shared/ui';
import type { Contact, Template, Checklist } from '@/shared/config';
import { X, Send, Check, FileText, ClipboardList } from 'lucide-react';
import styles from './SendShareDialog.module.css';

interface Props {
  contact: Contact;
  item: Template | Checklist;
  itemType: 'template' | 'checklist';
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

const SendShareDialog: React.FC<Props> = ({ contact, item, itemType, onClose }) => {
  const { shareChecklist, shareTemplate } = useShare();
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setSending(true);
    setError(null);

    const ok = itemType === 'checklist'
      ? await shareChecklist(contact, item as Checklist)
      : await shareTemplate(contact, item as Template);

    if (ok) {
      setDone(true);
      setTimeout(onClose, 1400);
    } else {
      setError(t.share.sendError);
    }
    setSending(false);
  };

  const title = 'title' in item ? item.title : 'Untitled';

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
              {t.share.sendTo} <span className={styles.titleHighlight}>{contact.name}</span>
            </span>
            <button onClick={onClose} className={styles.closeBtn}>
              <X size={14} />
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.recipientRow}>
              <div className={styles.avatar} style={{ background: getAvatarColor(contact.deviceId) }}>
                {getInitials(contact.name)}
              </div>
              <div>
                <div className={styles.recipientName}>{contact.name}</div>
                <div className={styles.recipientLabel}>{contact.deviceId.slice(0, 8)}</div>
              </div>
            </div>

            <div className={styles.itemPreview}>
              <div className={`${styles.itemIcon} ${itemType === 'template' ? styles.itemIconTemplate : styles.itemIconChecklist}`}>
                {itemType === 'template' ? <FileText size={18} /> : <ClipboardList size={18} />}
              </div>
              <div className={styles.itemInfo}>
                <div className={styles.itemTitle}>{title}</div>
                <div className={`${styles.itemType} ${itemType === 'template' ? styles.itemTypeTemplate : styles.itemTypeChecklist}`}>
                  {itemType === 'template' ? t.templates.title : t.nav.home}
                </div>
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}
          </div>

          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.successState}
            >
              <Check size={18} className={styles.successIcon} />
              {t.share.sentSuccess}
            </motion.div>
          ) : (
            <div className={styles.footer}>
              <button onClick={onClose} className={styles.cancelBtn}>
                {t.common.cancel}
              </button>
              <button onClick={handleSend} disabled={sending} className={styles.sendBtn}>
                {sending ? (
                  <div className={styles.spinner} />
                ) : (
                  <>
                    <Send size={14} />
                    {t.share.send}
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
        </motion.div>
    </AnimatePresence>
    </DialogPortal>
  );
};

export default SendShareDialog;
