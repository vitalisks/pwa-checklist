import { GripVertical } from 'lucide-react';
import { CategoryEditCard } from '@/features/category-editor';
import type { Category } from '@/shared/config';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from '@/shared/i18n';
import { SortableItem } from './SortableItem';

export interface SortableCategoryHandlers {
  updateName: (id: string, name: string) => void;
  remove: (id: string) => void;
  addItem: (categoryId: string) => void;
  updateItem: (categoryId: string, itemId: string, text: string) => void;
  updateItemDescription: (categoryId: string, itemId: string, desc: string) => void;
  removeItem: (categoryId: string, itemId: string) => void;
  addPhoto: (categoryId: string, itemId: string, file: File) => void;
  deletePhoto: (categoryId: string, itemId: string, photoId: string) => void;
}

interface SortableCategoryProps {
  category: Category;
  showValidation: boolean;
  handlers: SortableCategoryHandlers;
}

export function SortableCategory({
  category,
  showValidation,
  handlers: {
    updateName: onUpdateName,
    remove: onRemove,
    addItem: onAddItem,
    updateItem: onUpdateItem,
    updateItemDescription: onUpdateItemDescription,
    removeItem: onRemoveItem,
    addPhoto: onAddPhoto,
    deletePhoto: onDeletePhoto,
  },
}: SortableCategoryProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'z-50' : ''}
    >
      <SortableContext
        items={category.items.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <CategoryEditCard
          categoryId={category.id}
          name={category.name}
          items={category.items}
          showValidation={showValidation}
          categoryPlaceholder={t.editor.catPlaceholder}
          addItemLabel={t.editor.addItem}
          emptyItemsMessage=""
          onUpdateName={(name) => onUpdateName(category.id, name)}
          onRemove={() => {
            if (category.items.length === 0 || window.confirm(t.common.delete.confirm)) {
              onRemove(category.id);
            }
          }}
          onAddItem={() => onAddItem(category.id)}
          renderItem={(item) => (
            <SortableItem
              item={item}
              categoryId={category.id}
              showValidation={showValidation}
              handlers={{
                updateText: onUpdateItem,
                updateDescription: onUpdateItemDescription,
                remove: onRemoveItem,
                addPhoto: onAddPhoto,
                deletePhoto: onDeletePhoto,
              }}
            />
          )}
          dragHandle={
            <button
              {...attributes}
              {...listeners}
              style={{ touchAction: 'none' }}
              className="btn-icon w-6 h-6 cursor-grab active:cursor-grabbing text-tertiary hover:text-primary shrink-0"
            >
              <GripVertical size={14} />
            </button>
          }
        />
      </SortableContext>
    </div>
  );
}
