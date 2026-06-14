import React from 'react';
import { X } from 'lucide-react';

interface ItemEditRowProps {
  itemId: string;
  text: string;
  placeholder?: string;
  showValidation: boolean;
  description?: string;
  descriptionPlaceholder?: string;
  onUpdateText: (text: string) => void;
  onUpdateDescription?: (desc: string) => void;
  onRemove: () => void;
  dragHandle?: React.ReactNode;
  extras?: React.ReactNode;
}

const ItemEditRow: React.FC<ItemEditRowProps> = ({
  text,
  placeholder,
  showValidation,
  description,
  descriptionPlaceholder,
  onUpdateText,
  onUpdateDescription,
  onRemove,
  dragHandle,
  extras,
}) => {
  return (
    <div className="bg-surface-1 border border-subtle rounded px-3 py-1.5">
      <div className="flex items-center gap-1.5">
        {dragHandle}
        <input
          type="text"
          className={`input h-7 flex-1 font-medium bg-transparent${showValidation && !text.trim() ? ' input-invalid' : ''}`}
          value={text}
          onChange={(e) => onUpdateText(e.target.value)}
          placeholder={placeholder}
        />
        {extras}
        <button onClick={onRemove} className="btn-icon w-5 h-5 btn-icon-danger shrink-0">
          <X size={12} />
        </button>
      </div>
      {description !== undefined && (
        <textarea
          className="input bg-transparent border-subtle mt-1 ml-5"
          style={{ resize: 'none', overflow: 'hidden' }}
          value={description}
          onChange={(e) => onUpdateDescription?.(e.target.value)}
          placeholder={descriptionPlaceholder}
        />
      )}
    </div>
  );
};

export { ItemEditRow };
export type { ItemEditRowProps };
