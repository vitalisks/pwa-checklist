import React, { useState, useEffect, useRef } from 'react';
import { Plus, Save, GripVertical, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { storageService } from '../services/storage';
import PhotoLightbox from './PhotoLightbox';
import { Template, Category, TemplateItem } from '../types';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ConfirmDialog from './ConfirmDialog';

import { useLanguage } from '../hooks/useLanguage';
import { generateUUID } from '../utils/uuid';
import photoStyles from '../styles/photo-zone.module.css';

interface TemplateEditorProps {
  template?: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
  onAddPhoto: (itemId: string, file: File) => void;
  onDeletePhoto: (itemId: string, photoId: string) => void;
}

interface SortableCategoryProps {
  category: Category;
  showValidation: boolean;
  onUpdateName: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onAddItem: (categoryId: string) => void;
  onUpdateItem: (categoryId: string, itemId: string, text: string) => void;
  onUpdateItemDescription: (categoryId: string, itemId: string, desc: string) => void;
  onRemoveItem: (categoryId: string, itemId: string) => void;
  onAddPhoto: (categoryId: string, itemId: string, file: File) => void;
  onDeletePhoto: (categoryId: string, itemId: string, photoId: string) => void;
  onItemDragEnd: (itemId: string, fromCategoryId: string, toCategoryId: string, newIndex: number) => void;
}

function SortableCategory({
  category,
  showValidation,
  onUpdateName,
  onRemove,
  onAddItem,
  onUpdateItem,
  onUpdateItemDescription,
  onRemoveItem,
  onAddPhoto,
  onDeletePhoto,
  onItemDragEnd,
}: SortableCategoryProps) {
  const { t } = useLanguage();
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
      className={`card ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <button
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
          className="btn-icon w-6 h-6 cursor-grab active:cursor-grabbing text-tertiary hover:text-primary shrink-0"
        >
          <GripVertical size={14} />
        </button>
        <input
          type="text"
          className={`input font-semibold bg-surface-1 border-transparent focus:border-accent h-8 flex-1${showValidation && !category.name.trim() ? ' input-invalid' : ''}`}
          value={category.name}
          onChange={(e) => onUpdateName(category.id, e.target.value)}
          placeholder={t('editor_cat_placeholder')}
        />
        <button
          onClick={() => {
            if (category.items.length === 0 || window.confirm(t('delete_confirm'))) {
              onRemove(category.id);
            }
          }}
          className="btn-icon w-6 h-6 btn-icon-danger shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-1.5 pl-2.5 border-l border-subtle">
        <SortableContext
          items={category.items.map(i => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {category.items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              categoryId={category.id}
              showValidation={showValidation}
              onUpdateText={onUpdateItem}
              onUpdateDescription={onUpdateItemDescription}
              onRemove={onRemoveItem}
              onAddPhoto={onAddPhoto}
              onDeletePhoto={onDeletePhoto}
            />
          ))}
        </SortableContext>
        <button
          onClick={() => onAddItem(category.id)}
          className="flex items-center gap-1.5 text-xs text-tertiary hover:text-primary transition-colors py-1 mt-1"
        >
          <Plus size={12} /> {t('editor_add_item')}
        </button>
      </div>
    </div>
  );
}

interface SortableItemProps {
  item: TemplateItem;
  categoryId: string;
  showValidation: boolean;
  onUpdateText: (categoryId: string, itemId: string, text: string) => void;
  onUpdateDescription: (categoryId: string, itemId: string, desc: string) => void;
  onRemove: (categoryId: string, itemId: string) => void;
  onAddPhoto: (categoryId: string, itemId: string, file: File) => void;
  onDeletePhoto: (categoryId: string, itemId: string, photoId: string) => void;
}

function SortableItem({
  item,
  categoryId,
  showValidation,
  onUpdateText,
  onUpdateDescription,
  onRemove,
  onAddPhoto,
  onDeletePhoto,
}: SortableItemProps) {
  const { t } = useLanguage();
  const descRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const ids = item.photoIds || [];
    if (ids.length === 0) { setThumbs({}); return; }
    let cancelled = false;
    const load = async () => {
      const map: Record<string, string> = {};
      for (const pid of ids) {
        try {
          const photo = await storageService.getPhoto(pid);
          if (photo && !cancelled) map[pid] = photo.dataUrl;
        } catch { /* ignore */ }
      }
      if (!cancelled) setThumbs(map);
    };
    load();
    return () => { cancelled = true; };
  }, [(item.photoIds || []).join(',')]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { onAddPhoto(categoryId, item.id, file); e.target.value = ''; }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  useEffect(() => {
    if (descRef.current) {
      descRef.current.style.height = 'auto';
      descRef.current.style.height = `${descRef.current.scrollHeight}px`;
    }
  }, [item.description]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const photoIds = item.photoIds || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface-1 border border-subtle rounded px-1.5 py-1 transition-colors ${isDragging ? 'border-accent' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex items-center gap-1.5">
        <button
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
          className="btn-icon w-5 h-5 cursor-grab active:cursor-grabbing text-tertiary hover:text-primary shrink-0"
        >
          <GripVertical size={12} />
        </button>
        <input
          type="text"
          className={`input h-7 flex-1 font-medium bg-transparent${showValidation && !item.text.trim() ? ' input-invalid' : ''}`}
          value={item.text}
          onChange={(e) => onUpdateText(categoryId, item.id, e.target.value)}
          placeholder={t('editor_item_placeholder')}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-icon w-5 h-5 text-tertiary hover:text-accent shrink-0"
          title={t('item_add_photo')}
        >
          <ImageIcon size={12} />
        </button>
        <button
          onClick={() => onRemove(categoryId, item.id)}
          className="btn-icon w-5 h-5 btn-icon-danger shrink-0"
        >
          <X size={12} />
        </button>
      </div>
      {item.description !== undefined && (
        <textarea
          ref={descRef}
          className="input bg-transparent border-subtle mt-1 ml-5"
          style={{ resize: 'none', overflow: 'hidden' }}
          value={item.description}
          onChange={(e) => onUpdateDescription(categoryId, item.id, e.target.value)}
          placeholder={t('editor_item_desc_placeholder')}
        />
      )}
      {photoIds.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px', marginLeft: '26px', paddingTop: '6px' }}>
          {photoIds.map((pid, i) => (
            <div key={pid} className={photoStyles['photo-thumb-wrap']}>
              {thumbs[pid] ? (
                <button onClick={() => setLightboxIndex(i)} className={photoStyles['guide-photo-btn']}>
                  <img src={thumbs[pid]} alt="guide" className={photoStyles['photo-thumb']} />
                </button>
              ) : (
                <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']}`}>
                  <ImageIcon size={12} />
                </div>
              )}
              <button
                onClick={() => onDeletePhoto(categoryId, item.id, pid)}
                className={photoStyles['photo-thumb-delete']}
                title={t('item_delete_photo')}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photoIds={photoIds}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={(pid) => {
            onDeletePhoto(categoryId, item.id, pid);
            if (photoIds.length <= 1) setLightboxIndex(null);
            else setLightboxIndex(Math.min(lightboxIndex, photoIds.length - 2));
          }}
        />
      )}
    </div>
  );
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSave, onCancel, onAddPhoto, onDeletePhoto }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.description || '');
  const [categories, setCategories] = useState<Category[]>(template?.categories || []);
  const [showValidation, setShowValidation] = useState(false);
  const [showRequiredDialog, setShowRequiredDialog] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = useState<'category' | 'item' | null>(null);

  useEffect(() => {
    if (template?.categories) {
      setCategories(template.categories);
    }
  }, [template]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findCategoryByItemId = (itemId: UniqueIdentifier): Category | undefined => {
    return categories.find(cat => cat.items.some(item => item.id === itemId));
  };

  const findCategoryById = (categoryId: UniqueIdentifier): Category | undefined => {
    return categories.find(cat => cat.id === categoryId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { id } = event.active;
    setActiveId(id);

    const isCategory = findCategoryById(id) !== undefined;
    setActiveType(isCategory ? 'category' : 'item');
  };

  const handleDragOver = () => {};

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Check if dragging a category
    const activeCategory = findCategoryById(activeId);
    if (activeCategory) {
      // Category reordering
      if (activeId !== overId) {
        setCategories((items) => {
          const oldIndex = items.findIndex(c => c.id === activeId);
          const newIndex = items.findIndex(c => c.id === overId);
          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(items, oldIndex, newIndex);
          }
          return items;
        });
      }
      return;
    }

    // Item dragging - determine target category
    const activeItemCategory = findCategoryByItemId(activeId);
    if (!activeItemCategory) return;

    const activeItem = activeItemCategory.items.find(i => i.id === activeId);
    if (!activeItem) return;

    const sourceCategoryId = activeItemCategory.id;
    let targetCategoryId = sourceCategoryId;
    let targetIndex = -1;

    if (findCategoryById(overId as string)) {
      // Dropped onto a category — append to end
      targetCategoryId = overId as string;
      targetIndex = -1;
    } else {
      // Dropping on another item - find which category that item belongs to
      const targetItemCategory = findCategoryByItemId(overId);
      if (targetItemCategory) {
        targetCategoryId = targetItemCategory.id;
        targetIndex = targetItemCategory.items.findIndex(i => i.id === overId);
      }
    }

    // If same category, do reorder
    if (sourceCategoryId === targetCategoryId) {
      if (targetIndex === -1) return; // No reorder needed if dropped on category itself
      setCategories(cats => {
        return cats.map(cat => {
          if (cat.id === sourceCategoryId) {
            const oldIndex = cat.items.findIndex(i => i.id === activeId);
            if (oldIndex !== -1 && targetIndex !== -1 && oldIndex !== targetIndex) {
              return { ...cat, items: arrayMove(cat.items, oldIndex, targetIndex) };
            }
          }
          return cat;
        });
      });
    } else {
      // Cross-category move
      setCategories(cats => {
        const newCats = cats.map(cat => {
          if (cat.id === sourceCategoryId) {
            return { ...cat, items: cat.items.filter(i => i.id !== activeId) };
          }
          if (cat.id === targetCategoryId) {
            const newItems = [...cat.items];
            if (targetIndex !== -1) {
              newItems.splice(targetIndex, 0, activeItem);
            } else {
              newItems.push(activeItem);
            }
            return { ...cat, items: newItems };
          }
          return cat;
        });
        return newCats;
      });
    }
  };

  const addCategory = () => {
    const newCategory: Category = {
      id: generateUUID(),
      name: '',
      items: [],
    };
    setCategories([...categories, newCategory]);
  };

  const updateCategoryName = (id: string, name: string) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const addItemToCategory = (categoryId: string) => {
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          const newItem: TemplateItem = { id: generateUUID(), text: '', description: '', photoIds: [] };
          return { ...c, items: [...c.items, newItem] };
        }
        return c;
      })
    );
  };

  const updateItemText = (categoryId: string, itemId: string, text: string) => {
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, text } : i)) };
        }
        return c;
      })
    );
  };

  const updateItemDescription = (categoryId: string, itemId: string, desc: string) => {
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, description: desc } : i)) };
        }
        return c;
      })
    );
  };

  const removeItemFromCategory = (categoryId: string, itemId: string) => {
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.filter((i) => i.id !== itemId) };
        }
        return c;
      })
    );
  };

  const handleAddPhoto = async (categoryId: string, itemId: string, file: File) => {
    const photoId = await onAddPhoto(itemId, file);
    if (photoId) {
      setCategories(categories.map(c => {
        if (c.id === categoryId) {
          return {
            ...c,
            items: c.items.map(i => {
              if (i.id === itemId) {
                return { ...i, photoIds: [...(i.photoIds || []), photoId] };
              }
              return i;
            })
          };
        }
        return c;
      }));
    }
  };

  const handleDeletePhoto = async (categoryId: string, itemId: string, photoId: string) => {
    await onDeletePhoto(itemId, photoId);
    setCategories(categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          items: c.items.map(i => {
            if (i.id === itemId) {
              return { ...i, photoIds: (i.photoIds || []).filter(id => id !== photoId) };
            }
            return i;
          })
        };
      }
      return c;
    }));
  };

  const hasEmptyTitle = () => !title.trim();
  const hasEmptyCategoryNames = () => categories.some(c => !c.name.trim());
  const hasEmptyItemTexts = () => categories.some(c => c.items.some(i => !i.text.trim()));

  const buildValidationMessage = () => {
    const parts: string[] = [];
    if (hasEmptyTitle()) parts.push(t('validation_title_required'));
    if (hasEmptyCategoryNames()) parts.push(t('validation_category_name_required'));
    if (hasEmptyItemTexts()) parts.push(t('validation_item_name_required'));
    return parts.join('\n');
  };

  const handleSave = () => {
    if (hasEmptyTitle() || hasEmptyCategoryNames() || hasEmptyItemTexts()) {
      setShowValidation(true);
      setShowRequiredDialog(true);
      return;
    }

    const newTemplate: Template = {
      id: template?.id || generateUUID(),
      title,
      description,
      categories,
      updatedAt: Date.now(),
    };
    onSave(newTemplate);
  };

  const activeItem = activeId && activeType === 'item' ? (() => {
    for (const cat of categories) {
      const item = cat.items.find(i => i.id === activeId);
      if (item) return item;
    }
    return null;
  })() : null;

  const activeCategory = activeId && activeType === 'category' ? findCategoryById(activeId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{template ? t('editor_edit') : t('editor_new')}</h2>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn btn-ghost">
            {t('editor_cancel')}
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            <Save size={16} /> {t('editor_save')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="space-y-3">
          <div>
            <input
              type="text"
              className={`input font-semibold text-base${showValidation && hasEmptyTitle() ? ' input-invalid' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('editor_title_placeholder_required')}
            />
          </div>
          <div>
            <textarea
              className="input min-h-[50px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('editor_desc_placeholder')}
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="section-label mb-2">{t('editor_cats_items_label')}</h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
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
                  onUpdateName={updateCategoryName}
                  onRemove={removeCategory}
                  onAddItem={addItemToCategory}
                  onUpdateItem={updateItemText}
                  onUpdateItemDescription={updateItemDescription}
                  onRemoveItem={removeItemFromCategory}
                  onAddPhoto={handleAddPhoto}
                  onDeletePhoto={handleDeletePhoto}
                  onItemDragEnd={() => {}}
                />
              ))}
              <button
                onClick={addCategory}
                className="card border-dashed border-2 border-default hover:border-accent cursor-pointer flex items-center justify-center gap-2 text-tertiary hover:text-accent transition-colors h-10"
              >
                <Plus size={16} />
                <span className="text-sm font-medium">{t('editor_add_cat')}</span>
              </button>
            </div>
          </SortableContext>
          <DragOverlay>
            {activeItem ? (
              <div className="bg-surface-2 border border-accent rounded px-2 py-1.5 shadow-lg opacity-90">
                <span className="text-sm font-medium">{activeItem.text || t('editor_item_placeholder')}</span>
              </div>
            ) : activeCategory ? (
              <div className="bg-surface-2 border border-accent rounded px-3 py-2 shadow-lg opacity-90">
                <span className="text-sm font-semibold">{activeCategory.name || t('editor_cat_placeholder')}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showRequiredDialog && (
        <ConfirmDialog
          title={t('validation_required_title')}
          message={buildValidationMessage()}
          confirmLabel={t('action_ok')}
          variant="warning"
          onConfirm={() => setShowRequiredDialog(false)}
          onCancel={() => setShowRequiredDialog(false)}
        />
      )}
    </div>
  );
};

export default TemplateEditor;