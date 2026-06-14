import { GripVertical, UnfoldHorizontal } from 'lucide-react';
import type { EditCategoryData } from '../model/types';
import type { EditorHandlers } from '../model/types';
import { CategoryEditCard } from '@/features/category-editor';
import { CSS } from '@dnd-kit/utilities';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItemRow } from './SortableItemRow';

interface SortableCategoryCardProps {
  category: EditCategoryData;
  catValues: Record<string, string>;
  itemValues: Record<string, string>;
  descValues: Record<string, string>;
  showValidation: boolean;
  categoryPlaceholder: string;
  addItemLabel: string;
  emptyItemsMessage: string;
  itemPlaceholder: string;
  itemDescPlaceholder: string;
  handlers: EditorHandlers;
  onToggleUnwrap: (categoryId: string) => void;
}

export function SortableCategoryCard({
  category, catValues, itemValues, descValues, showValidation, categoryPlaceholder, addItemLabel, emptyItemsMessage, itemPlaceholder, itemDescPlaceholder, handlers, onToggleUnwrap,
}: SortableCategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : undefined };

  const items = category.items.map(i => ({
    id: i.id,
    text: itemValues[i.id] ?? i.text,
    description: descValues[i.id] ?? i.description ?? '',
  }));

  return (
    <div ref={setNodeRef} style={style}>
      <SortableContext items={category.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <CategoryEditCard
          categoryId={category.id}
          name={catValues[category.id] ?? category.name}
          items={items}
          showValidation={showValidation}
          categoryPlaceholder={categoryPlaceholder}
          addItemLabel={addItemLabel}
          emptyItemsMessage={emptyItemsMessage}
          onUpdateName={(name) => handlers.updateCategoryName(category.id, name)}
          onRemove={() => handlers.removeCategory(category.id)}
          onAddItem={() => handlers.addItem(category.id)}
          unwrapped={category.unwrapped}
          headerExtras={category.items.length > 0 ? (
            <button onClick={() => onToggleUnwrap(category.id)}
              className="btn-icon w-6 h-6 text-tertiary hover:text-accent shrink-0"
              title={category.unwrapped ? 'Wrap' : 'Unwrap'}>
              <UnfoldHorizontal size={14} />
            </button>
          ) : undefined}
          dragHandle={
            <button {...attributes} {...listeners} style={{ touchAction: 'none' }}
              className="btn-icon w-6 h-6 cursor-grab active:cursor-grabbing text-tertiary hover:text-primary shrink-0">
              <GripVertical size={14} />
            </button>
          }
          renderItem={(item) => {
            const original = category.items.find(i => i.id === item.id);
            const guideCount = (original?.guidePhotoIds?.length || 0) + (original?.imageLinks?.length || 0);
            return (
              <SortableItemRow
                key={item.id}
                item={item}
                photoIds={original?.photoIds || []}
                guidePhotoIds={original?.guidePhotoIds || []}
                imageLinks={original?.imageLinks || []}
                showValidation={showValidation}
                placeholder={itemPlaceholder}
                descPlaceholder={itemDescPlaceholder}
                handlers={{
                  updateText: (text) => handlers.updateItemText(item.id, text),
                  updateDesc: (desc) => handlers.updateItemDesc(item.id, desc),
                  remove: () => handlers.removeItem(category.id, item.id),
                  addPhoto: (file) => handlers.addPhoto(category.id, item.id, file),
                  deletePhoto: (photoId) => handlers.deletePhoto(category.id, item.id, photoId),
                  viewPhotos: (photoIds, startIndex) =>
                    handlers.viewPhotos(photoIds, startIndex, category.id, item.id, startIndex >= guideCount),
                }}
              />
            );
          }}
        />
      </SortableContext>
    </div>
  );
}
