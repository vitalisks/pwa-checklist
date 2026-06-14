import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Checklist } from '@/shared/config';
import { useTranslation } from '@/shared/i18n';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableChecklistCategory } from './SortableChecklistCategory';

export interface EditHandlers {
  commit: (checklist: Checklist) => void;
  addCategory: () => void;
  removeCategory: (categoryId: string) => void;
  addItem: (categoryId: string) => void;
  updateCategoryName: (categoryId: string, name: string) => void;
  updateItemText: (itemId: string, text: string) => void;
  updateItemDesc: (itemId: string, desc: string) => void;
  removeItem: (categoryId: string, itemId: string) => void;
  addPhoto: (categoryId: string, itemId: string, file: File) => void;
  deletePhoto: (categoryId: string, itemId: string, photoId: string) => void;
  viewPhotos: (photoIds: string[], startIndex: number, categoryId: string, itemId: string, canDelete: boolean) => void;
}

interface EditContentProps {
  currentChecklist: Checklist;
  showValidation: boolean;
  catValues: Record<string, string>;
  itemValues: Record<string, string>;
  descValues: Record<string, string>;
  handlers: EditHandlers;
}

const EditContent: React.FC<EditContentProps> = ({ currentChecklist, showValidation, catValues, itemValues, descValues, handlers }) => {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const categories = currentChecklist.categories;
    const isCategory = categories.some(c => c.id === active.id);
    if (isCategory) {
      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        handlers.commit({ ...currentChecklist, categories: arrayMove(categories, oldIndex, newIndex) });
      }
      return;
    }

    const catWithItem = categories.find(c => c.items.some(i => i.id === active.id));
    if (!catWithItem) return;
    const items = catWithItem.items;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      handlers.commit({ ...currentChecklist, categories: categories.map(c => c.id === catWithItem.id ? { ...c, items: arrayMove(items, oldIndex, newIndex) } : c) });
    }
  };

  const handleDragCancel = () => setActiveId(null);

  const activeItem = activeId ? currentChecklist.categories.flatMap(c => c.items).find(i => i.id === activeId) : null;
  const activeCategory = activeId ? currentChecklist.categories.find(c => c.id === activeId) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <SortableContext items={currentChecklist.categories.map(c => c.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentChecklist.categories.map((category) => (
            <SortableChecklistCategory
              key={category.id}
              category={category}
              catValues={catValues}
              itemValues={itemValues}
              descValues={descValues}
              showValidation={showValidation}
              categoryPlaceholder={t.editor.catPlaceholder}
              addItemLabel={t.editor.addItem}
              emptyItemsMessage={t.checklist.noItems}
              itemPlaceholder={t.editor.itemPlaceholder}
              itemDescPlaceholder={t.editor.itemDescPlaceholder}
              handlers={handlers}
            />
          ))}
          <button onClick={handlers.addCategory}
            className="card border-dashed border-2 border-default hover:border-accent cursor-pointer flex items-center justify-center gap-2 text-tertiary hover:text-accent transition-colors h-10">
            <Plus size={16} />
            <span className="text-sm font-medium">{t.editor.addCat}</span>
          </button>
        </div>
      </SortableContext>
      <DragOverlay>
        {activeItem ? (
          <div className="bg-surface-2 border border-accent rounded px-2 py-1.5 shadow-lg opacity-90">
            <span className="text-sm font-medium">{activeItem.text || t.editor.itemPlaceholder}</span>
          </div>
        ) : activeCategory ? (
          <div className="bg-surface-2 border border-accent rounded px-3 py-2 shadow-lg opacity-90">
            <span className="text-sm font-semibold">{activeCategory.name || t.editor.catPlaceholder}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default EditContent;
