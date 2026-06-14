import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { EditCategoryData, EditorHandlers } from '../model/types';
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
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableCategoryCard } from './SortableCategoryCard';

interface DndEditorProps {
  categories: EditCategoryData[];
  catValues: Record<string, string>;
  itemValues: Record<string, string>;
  descValues: Record<string, string>;
  showValidation: boolean;
  handlers: EditorHandlers;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
}

export function DndEditor({
  categories, catValues, itemValues, descValues, showValidation, handlers, onDragStart, onDragEnd,
}: DndEditorProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    onDragStart?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (onDragEnd) {
      onDragEnd(event);
      return;
    }
    if (!over || active.id === over.id) return;

    const isCategory = categories.some(c => c.id === active.id);
    if (isCategory) {
      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const moved = [...categories];
        const [removed] = moved.splice(oldIndex, 1);
        moved.splice(newIndex, 0, removed);
        handlers.commit(moved);
      }
      return;
    }

    const catWithItem = categories.find(c => c.items.some(i => i.id === active.id));
    if (!catWithItem) return;
    const activeItem = catWithItem.items.find(i => i.id === active.id);
    if (!activeItem) return;

    const sourceCatId = catWithItem.id;
    let targetCatId = sourceCatId;
    let targetIndex = -1;

    if (categories.some(c => c.id === over.id)) {
      targetCatId = over.id as string;
      targetIndex = -1;
    } else {
      const targetItemCat = categories.find(c => c.items.some(i => i.id === over.id));
      if (targetItemCat) {
        targetCatId = targetItemCat.id;
        targetIndex = targetItemCat.items.findIndex(i => i.id === over.id);
      }
    }

    if (sourceCatId === targetCatId) {
      if (targetIndex === -1) return;
      const items = catWithItem.items;
      const oldIndex = items.findIndex(i => i.id === active.id);
      if (oldIndex !== targetIndex) {
        const moved = [...items];
        const [removed] = moved.splice(oldIndex, 1);
        moved.splice(targetIndex, 0, removed);
        handlers.commit(categories.map(c =>
          c.id === sourceCatId ? { ...c, items: moved } : c
        ));
      }
    } else {
      handlers.commit(categories.map(c => {
        if (c.id === sourceCatId) return { ...c, items: c.items.filter(i => i.id !== active.id) };
        if (c.id === targetCatId) {
          const newItems = [...c.items];
          if (targetIndex !== -1) newItems.splice(targetIndex, 0, activeItem);
          else newItems.push(activeItem);
          return { ...c, items: newItems };
        }
        return c;
      }));
    }
  };

  const handleDragCancel = () => setActiveId(null);

  const activeItem = activeId ? categories.flatMap(c => c.items).find(i => i.id === activeId) : null;
  const activeCategory = activeId ? categories.find(c => c.id === activeId) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
      <SortableContext items={categories.map(c => c.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categories.map((category) => (
            <SortableCategoryCard
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
              onToggleUnwrap={handlers.toggleCategoryUnwrap}
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
}
