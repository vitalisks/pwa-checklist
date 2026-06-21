import React, { useRef } from 'react';
import { Check, X } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';

interface CommentInputProps {
  onAddComment: (text: string) => void;
  onClose?: () => void;
}

export const CommentInput: React.FC<CommentInputProps> = ({ onAddComment, onClose }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = React.useState('');

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === 'Escape') {
      setText('');
      onClose?.();
    }
  };

  return (
    <div style={{ paddingLeft: '28px' }} className="mt-2">
      <div className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input text-xs flex-1"
          placeholder={t.item.commentPlaceholder}
        />
        <button onClick={handleAdd} className="btn-icon text-accent" disabled={!text.trim()}>
          <Check size={14} />
        </button>
        <button onClick={() => { setText(''); onClose?.(); }} className="btn-icon text-tertiary">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
