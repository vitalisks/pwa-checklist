import { GripVertical } from 'lucide-react';
import type { ChecklistCategory } from '@/shared/config';
import { CategoryEditCard } from '@/features/category-editor';
import { CSS } from '@dnd-kit/utilities';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EditItem, type EditItemHandlers } from './EditItem';
import type { EditHandlers } from './EditContent';

export interface SortableChecklistCategoryProps {
  category: ChecklistCategory;
  catValues: Record<string, string>;
  itemValues: Record<string, string>;
  descValues: Record<string, string>;
  showValidation: boolean;
  categoryPlaceholder: string;
  addItemLabel: string;
  emptyItemsMessage: string;
  itemPlaceholder: string;
  itemDescPlaceholder: string;
  handlers: EditHandlers;
}

export function SortableChecklistCategory({
  category, catValues, itemValues, descValues, showValidation, categoryPlaceholder, addItemLabel, emptyItemsMessage, itemPlaceholder, itemDescPlaceholder, handlers,
}: SortableChecklistCategoryProps) {
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
          dragHandle={
            <button {...attributes} {...listeners} style={{ touchAction: 'none' }}
              className="btn-icon w-6 h-6 cursor-grab active:cursor-grabbing text-tertiary hover:text-primary shrink-0">
              <GripVertical size={14} />
            </button>
          }
          renderItem={(item) => {
            const original = category.items.find(i => i.id === item.id);
            const guideCount = (original?.guidePhotoIds?.length || 0) + (original?.imageLinks?.length || 0);
            const itemHandlers: EditItemHandlers = {
              updateText: (text) => handlers.updateItemText(item.id, text),
              updateDesc: (desc) => handlers.updateItemDesc(item.id, desc),
              remove: () => handlers.removeItem(category.id, item.id),
              addPhoto: (file) => handlers.addPhoto(category.id, item.id, file),
              deletePhoto: (photoId) => handlers.deletePhoto(category.id, item.id, photoId),
              viewPhotos: (photoIds, startIndex) =>
                handlers.viewPhotos(photoIds, startIndex, category.id, item.id, startIndex >= guideCount),
            };
            return (
              <EditItem
                key={item.id}
                item={item}
                photoIds={original?.photoIds || []}
                guidePhotoIds={original?.guidePhotoIds || []}
                imageLinks={original?.imageLinks || []}
                showValidation={showValidation}
                placeholder={itemPlaceholder}
                descPlaceholder={itemDescPlaceholder}
                handlers={itemHandlers}
              />
            );
          }}
        />
      </SortableContext>
    </div>
  );
}
