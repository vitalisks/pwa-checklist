import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { EditCategoryData } from './types';

export function useDndState(
  categories: EditCategoryData[],
  setCategories: Dispatch<SetStateAction<EditCategoryData[]>>,
) {
  const handleDragStart = useCallback(() => {
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeCategory = categories.find(cat => cat.id === activeId);
    if (activeCategory) {
      if (activeId !== overId) {
        setCategories(prev => {
          const oldIndex = prev.findIndex(c => c.id === activeId);
          const newIndex = prev.findIndex(c => c.id === overId);
          if (oldIndex !== -1 && newIndex !== -1) return arrayMove(prev, oldIndex, newIndex);
          return prev;
        });
      }
      return;
    }

    const activeItemCategory = categories.find(cat => cat.items.some(item => item.id === activeId));
    if (!activeItemCategory) return;
    const activeItem = activeItemCategory.items.find(i => i.id === activeId);
    if (!activeItem) return;

    const sourceCategoryId = activeItemCategory.id;
    let targetCategoryId = sourceCategoryId;
    let targetIndex = -1;

    if (categories.some(cat => cat.id === overId)) {
      targetCategoryId = overId as string;
      targetIndex = -1;
    } else {
      const targetItemCategory = categories.find(cat => cat.items.some(item => item.id === overId));
      if (targetItemCategory) {
        targetCategoryId = targetItemCategory.id;
        targetIndex = targetItemCategory.items.findIndex(i => i.id === overId);
      }
    }

    if (sourceCategoryId === targetCategoryId) {
      if (targetIndex === -1) return;
      setCategories(prev => prev.map(cat => {
        if (cat.id === sourceCategoryId) {
          const oldIndex = cat.items.findIndex(i => i.id === activeId);
          if (oldIndex !== -1 && targetIndex !== -1 && oldIndex !== targetIndex) {
            return { ...cat, items: arrayMove(cat.items, oldIndex, targetIndex) };
          }
        }
        return cat;
      }));
    } else {
      setCategories(prev => prev.map(cat => {
        if (cat.id === sourceCategoryId) {
          return { ...cat, items: cat.items.filter(i => i.id !== activeId) };
        }
        if (cat.id === targetCategoryId) {
          const newItems = [...cat.items];
          if (targetIndex !== -1) newItems.splice(targetIndex, 0, activeItem);
          else newItems.push(activeItem);
          return { ...cat, items: newItems };
        }
        return cat;
      }));
    }
  }, [categories, setCategories]);

  return { handleDragStart, handleDragEnd };
}
