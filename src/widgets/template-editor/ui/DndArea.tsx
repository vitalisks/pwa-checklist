import { Plus } from 'lucide-react';
import type { Category, TemplateItem } from '@/shared/config';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslation } from '@/shared/i18n';
import { SortableCategory } from './SortableCategory';

export interface DndHandlers {
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragEndEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  addCategory: () => void;
  removeCategory: (id: string) => void;
  updateCategoryName: (id: string, name: string) => void;
  addItemToCategory: (categoryId: string) => void;
  updateItemText: (categoryId: string, itemId: string, text: string) => void;
  updateItemDescription: (categoryId: string, itemId: string, desc: string) => void;
  removeItemFromCategory: (categoryId: string, itemId: string) => void;
  addPhoto: (categoryId: string, itemId: string, file: File) => void;
  deletePhoto: (categoryId: string, itemId: string, photoId: string) => void;
}

interface DndAreaProps {
  categories: Category[];
  showValidation: boolean;
  sensors: ReturnType<typeof useSensors>;
  activeItem: TemplateItem | null;
  activeCategory: Category | null;
  handlers: DndHandlers;
}

export function DndArea({
  categories,
  showValidation,
  sensors,
  activeItem,
  activeCategory,
  handlers: {
    onDragStart,
    onDragOver,
    onDragEnd,
    addCategory,
    removeCategory,
    updateCategoryName,
    addItemToCategory,
    updateItemText,
    updateItemDescription,
    removeItemFromCategory,
    addPhoto,
    deletePhoto,
  },
}: DndAreaProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4">
      <h3 className="section-label mb-2">{t.editor.catsItemsLabel}</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={categories.map(c => c.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((category) => (
              <SortableCategory
                key={category.id}
                category={category}
                showValidation={showValidation}
                handlers={{
                  updateName: updateCategoryName,
                  remove: removeCategory,
                  addItem: addItemToCategory,
                  updateItem: updateItemText,
                  updateItemDescription: updateItemDescription,
                  removeItem: removeItemFromCategory,
                  addPhoto,
                  deletePhoto,
                }}
              />
            ))}
            <button
              onClick={addCategory}
              className="card border-dashed border-2 border-default hover:border-accent cursor-pointer flex items-center justify-center gap-2 text-tertiary hover:text-accent transition-colors h-10"
            >
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
    </div>
  );
}
