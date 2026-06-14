import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface EditableItem {
  id: string;
  text: string;
  description?: string;
}

export interface CategoryEditCardProps<ItemType extends EditableItem> {
  categoryId: string;
  name: string;
  items: ItemType[];
  showValidation: boolean;
  categoryPlaceholder?: string;
  addItemLabel?: string;
  emptyItemsMessage?: string;
  onUpdateName: (name: string) => void;
  onRemove: () => void;
  onAddItem: () => void;
  renderItem: (item: ItemType) => React.ReactNode;
  dragHandle?: React.ReactNode;
  unwrapped?: boolean;
  headerExtras?: React.ReactNode;
}

function CategoryEditCard<ItemType extends EditableItem = EditableItem>({
  name,
  items,
  showValidation,
  categoryPlaceholder,
  addItemLabel,
  emptyItemsMessage,
  onUpdateName,
  onRemove,
  onAddItem,
  renderItem,
  dragHandle,
  unwrapped,
  headerExtras,
}: CategoryEditCardProps<ItemType>) {
  if (unwrapped) {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <React.Fragment key={item.id}>
            {renderItem(item)}
          </React.Fragment>
        ))}
        <div className="flex items-center gap-1">
          <button
            onClick={onAddItem}
            className="flex items-center gap-1.5 text-xs text-tertiary hover:text-primary transition-colors py-1"
          >
            <Plus size={12} /> {addItemLabel}
          </button>
          {headerExtras}
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-2">
        {dragHandle}
        <input
          type="text"
          className={`input font-semibold bg-surface-1 border-transparent focus:border-accent h-8 flex-1${showValidation && !name.trim() ? ' input-invalid' : ''}`}
          value={name}
          onChange={(e) => onUpdateName(e.target.value)}
          placeholder={categoryPlaceholder}
        />
        {headerExtras}
        <button onClick={onRemove} className="btn-icon w-6 h-6 btn-icon-danger shrink-0">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="space-y-1.5 pl-2.5 border-l border-subtle">
        {items.length === 0 ? (
          <p className="text-xs text-tertiary italic">{emptyItemsMessage}</p>
        ) : (
          items.map((item) => (
            <React.Fragment key={item.id}>
              {renderItem(item)}
            </React.Fragment>
          ))
        )}
        <button
          onClick={onAddItem}
          className="flex items-center gap-1.5 text-xs text-tertiary hover:text-primary transition-colors py-1 mt-1"
        >
          <Plus size={12} /> {addItemLabel}
        </button>
      </div>
    </div>
  );
}

export { CategoryEditCard };
