import React, { useState } from 'react';
import { useShare } from '../model';
import { useTranslation } from '@/shared/i18n';
import { BottomSheet } from '@/shared/ui';
import { getAvatarColor, getInitials } from '@/shared/lib';
import SendShareDialog from './SendShareDialog';
import { Share2, Users } from 'lucide-react';
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

      <BottomSheet isOpen={showPicker} onClose={() => setShowPicker(false)} title={t.share.sendTo} icon={<Users size={14} />}>
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
      </BottomSheet>

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
