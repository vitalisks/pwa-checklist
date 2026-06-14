import { Plus, Check, X } from 'lucide-react';
import type { Checklist } from '@/shared/config';
import { useTranslation } from '@/shared/i18n';
import { ChecklistItemRow } from '@/features/toggle-checklist-item';

export interface ReadHandlers {
  toggleChecked: (categoryId: string, itemId: string) => void;
  toggleSkipped: (categoryId: string, itemId: string) => void;
  addPhoto: (categoryId: string, itemId: string, file: File) => void;
  deletePhoto: (categoryId: string, itemId: string, photoId: string) => void;
  viewPhotos: (photoIds: string[], startIndex: number, categoryId: string, itemId: string, canDelete: boolean) => void;
  startAddItem: (categoryId: string) => void;
  newItemTextChange: (text: string) => void;
  confirmAddItem: (categoryId: string) => void;
  cancelAddItem: () => void;
  startAddCategory: () => void;
  newCategoryNameChange: (name: string) => void;
  confirmAddCategory: () => void;
  cancelAddCategory: () => void;
}

interface ReadContentProps {
  currentChecklist: Checklist;
  addingItemCategoryId: string | null;
  newItemText: string;
  addingCategory: boolean;
  newCategoryName: string;
  handlers: ReadHandlers;
}

function ReadContent({
  currentChecklist,
  addingItemCategoryId,
  newItemText,
  addingCategory,
  newCategoryName,
  handlers,
}: ReadContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {currentChecklist.categories.map((category) => (
        <div key={category.id}>
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <h3 className="section-label flex-1">{category.name}</h3>
            </div>
            <div className="space-y-2">
              {category.items.length === 0 ? (
                <p className="text-xs text-tertiary italic">{t.checklist.noItems}</p>
              ) : (
                category.items.map((item) => {
                  const guideCount = (item.guidePhotoIds?.length || 0) + (item.imageLinks?.length || 0);
                  return (
                    <div key={item.id} className="flex items-center gap-1">
                      <div className="flex-1">
                        <ChecklistItemRow
                          item={item}
                          onToggleChecked={() => handlers.toggleChecked(category.id, item.id)}
                          onToggleSkipped={() => handlers.toggleSkipped(category.id, item.id)}
                          onAddPhoto={async (file) => handlers.addPhoto(category.id, item.id, file)}
                          onDeletePhoto={async (photoId) => handlers.deletePhoto(category.id, item.id, photoId)}
                          onViewPhotos={(photoIds, startIndex) =>
                            handlers.viewPhotos(photoIds, startIndex, category.id, item.id, startIndex >= guideCount)
                          }
                        />
                      </div>
                    </div>
                  );
                })
              )}
              {addingItemCategoryId === category.id ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => handlers.newItemTextChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlers.confirmAddItem(category.id);
                      if (e.key === 'Escape') handlers.cancelAddItem();
                    }}
                    className="input text-sm flex-1"
                    placeholder={t.editor.itemPlaceholder}
                    autoFocus
                  />
                  <button onClick={() => handlers.confirmAddItem(category.id)}
                    className="btn-icon text-accent" disabled={!newItemText.trim()}>
                    <Check size={14} />
                  </button>
                  <button onClick={handlers.cancelAddItem} className="btn-icon text-tertiary">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handlers.startAddItem(category.id)}
                  className="flex items-center gap-1.5 text-xs text-tertiary hover:text-accent transition-colors py-0.5"
                >
                  <Plus size={12} />
                  {t.editor.addItem}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {addingCategory ? (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => handlers.newCategoryNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlers.confirmAddCategory();
              if (e.key === 'Escape') handlers.cancelAddCategory();
            }}
            className="input text-sm flex-1"
            placeholder={t.editor.catPlaceholder}
            autoFocus
          />
          <button onClick={handlers.confirmAddCategory}
            className="btn-icon text-accent" disabled={!newCategoryName.trim()}>
            <Check size={14} />
          </button>
          <button onClick={handlers.cancelAddCategory} className="btn-icon text-tertiary">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={handlers.startAddCategory}
          className="card border-dashed border-2 border-default hover:border-accent cursor-pointer flex items-center justify-center gap-2 text-tertiary hover:text-accent transition-colors h-10"
        >
          <Plus size={16} />
          <span className="text-sm font-medium">{t.editor.addCat}</span>
        </button>
      )}
    </div>
  );
};

export default ReadContent;
