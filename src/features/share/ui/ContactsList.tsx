import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useShare } from '../model';
import type { Contact } from '@/shared/config';
import { User, Trash2, Send, Plus, Check, X, Pencil } from 'lucide-react';
import AddContactDialog from './AddContactDialog';

interface Props {
  onSendToContact: (contact: Contact) => void;
}

const ContactsList: React.FC<Props> = ({ onSendToContact }) => {
  const { contacts, updateContact, removeContact } = useShare();
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEdit = (contact: Contact) => {
    setEditingId(contact.deviceId);
    setEditName(contact.name || contact.deviceId.slice(0, 8));
  };

  const saveEdit = async () => {
    if (editingId && editName.trim()) {
      await updateContact(editingId, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  if (!contacts.length) {
    return (
      <div className="space-y-3">
        <div className="text-xs text-secondary text-center py-4">
          {t.share.noContacts}
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-soft w-full text-xs">
          <Plus size={14} />
          {t.share.addContact}
        </button>
        {showAdd && <AddContactDialog onClose={() => setShowAdd(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">{t.share.contacts}</h3>
        <button onClick={() => setShowAdd(true)} className="btn-icon">
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-1">
        {contacts.map((contact) => (
          <div key={contact.deviceId} className="card-inset flex items-center gap-2">
            <User size={16} className="shrink-0 text-secondary" />
            <div className="flex-1 min-w-0">
              {editingId === contact.deviceId ? (
                <div className="flex items-center gap-1">
                  <input
                    ref={inputRef}
                    className="input text-xs flex-1 h-7"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                  <button onClick={saveEdit} className="btn-icon" title={t.common.save}>
                    <Check size={14} className="text-accent" />
                  </button>
                  <button onClick={cancelEdit} className="btn-icon" title={t.common.cancel}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(contact)}
                  className="flex items-center gap-1 group w-full text-left"
                >
                  <span className="text-xs font-medium truncate">{contact.name || contact.deviceId.slice(0, 8)}</span>
                  <Pencil size={10} className="opacity-0 group-hover:opacity-100 text-tertiary shrink-0" />
                </button>
              )}
              {contact.lastSentAt && (
                <p className="text-2xs text-tertiary">
                  {t.share.lastSent}: {new Date(contact.lastSentAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={() => onSendToContact(contact)}
              className="btn-icon"
              title={t.share.send}
            >
              <Send size={14} />
            </button>
            <button
              onClick={() => removeContact(contact.deviceId)}
              className="btn-icon btn-icon-danger"
              title={t.common.delete.confirmTitle}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {showAdd && <AddContactDialog onClose={() => setShowAdd(false)} />}
    </div>
  );
};

export default ContactsList;
