import React from 'react';
import { FileText, ClipboardList } from 'lucide-react';
import { getAvatarColor, getInitials } from '@/shared/lib';
import type { Contact } from '@/shared/config';
import styles from './SendShareDialog.module.css';

interface Props {
  contact: Contact;
  itemType: 'template' | 'checklist';
  title: string;
  typeLabel: string;
}

export const SendShareHeader: React.FC<Props> = ({ contact, itemType, title, typeLabel }) => (
  <>
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
          {typeLabel}
        </div>
      </div>
    </div>
  </>
);
