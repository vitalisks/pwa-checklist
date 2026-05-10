import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface InlineTitleEditProps {
  title: string;
  onSave: (newTitle: string) => void;
  className?: string;
}

const InlineTitleEdit: React.FC<InlineTitleEditProps> = ({ title, onSave, className }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleSave = () => {
    if (draft.trim()) {
      onSave(draft.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(title);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (editing) {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input flex-1"
          autoFocus
        />
        <button onClick={handleSave} className="btn-icon text-accent">
          <Check size={16} />
        </button>
        <button onClick={handleCancel} className="btn-icon text-tertiary">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <span className="flex-1">{title}</span>
      <button onClick={() => { setDraft(title); setEditing(true); }} className="btn-icon text-tertiary">
        <Pencil size={14} />
      </button>
    </div>
  );
};

export default InlineTitleEdit;
