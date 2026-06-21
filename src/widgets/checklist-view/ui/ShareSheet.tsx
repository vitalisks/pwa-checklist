import React from 'react';
import { Users, UserPlus } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import type { Contact } from '@/shared/config';
import { BottomSheet } from '@/shared/ui';
import { getAvatarColor, getInitials } from '@/shared/lib';
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
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.share.sendTo} icon={<Users size={14} />}>
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
    </BottomSheet>
  );
};

export default ShareSheet;
