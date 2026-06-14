import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useShare } from '../model';
import { DialogPortal } from '@/shared/ui';
import { UserPlus, X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

function decodeNameFromCode(code: string): string | null {
  try {
    const raw = code.startsWith('m1_') ? code.slice(3) : code;
    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (data.v === 1 && data.d && data.n) return data.n;
    return null;
  } catch {
    return null;
  }
}

const AddContactDialog: React.FC<Props> = ({ onClose }) => {
  const { addContactFromCode } = useShare();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [userEditedName, setUserEditedName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const decodedName = useMemo(() => decodeNameFromCode(code), [code]);
  const effectiveName = userEditedName ? name : (decodedName || name);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!code.trim() || !name.trim()) return;
    setLoading(true);
    setError(null);

    const result = await addContactFromCode(code.trim(), effectiveName.trim());
    if (result) {
      setError(result);
      setLoading(false);
    } else {
      onClose();
    }
  };

  return (
    <DialogPortal>
    <div className="fixed inset-0 z-100 bg-black/60 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t.share.addContact}</h3>
          <button onClick={onClose} className="btn-icon">
            <X size={16} />
          </button>
        </div>

        <div>
          <label className="section-label">{t.share.contactName}</label>
          <input
            ref={nameInputRef}
            className="input text-sm"
            value={effectiveName}
            onChange={(e) => { setName(e.target.value); setUserEditedName(true); }}
            placeholder={t.share.namePlaceholder}
          />
        </div>

        <div>
          <label className="section-label">{t.share.pasteCode}</label>
          <textarea
            className="input text-xs font-mono"
            rows={3}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.share.codePlaceholder}
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="btn btn-ghost flex-1 text-xs">
            {t.common.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !code.trim() || !name.trim()}
            className="btn btn-primary flex-1 text-xs"
          >
            <UserPlus size={14} />
            {t.share.addContact}
          </button>
        </div>
      </div>
    </div>
    </DialogPortal>
  );
};

export default AddContactDialog;
