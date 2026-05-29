import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, CheckCircle, Check, Trash2, Pencil, X, Plus, FileText, Save, GripVertical, Camera, Image as ImageIcon } from 'lucide-react';
import type { Checklist, ChecklistCategory, ChecklistItem, ChecklistPhoto } from '@/shared/config';
import { useTranslation } from '@/shared/i18n';
import { useChecklist } from '@/app/model/checklist-context';
import { useNavigation } from '@/app/model/navigation-context';
import { useStorage } from '@/shared/api';
import { ConfirmDialog } from '@/shared/ui';
import { ChecklistItemRow } from '@/features/toggle-checklist-item';
import { PhotoLightbox } from '@/features/manage-photos';
import { ChecklistProgressBar } from '@/widgets/progress-bar';
import { motion, AnimatePresence } from 'framer-motion';
import { generateUUID, compressImage } from '@/shared/lib';
import { buildChecklistPhotoId } from '@/entities/photo';
import { CategoryEditCard, ItemEditRow } from '@/features/category-editor';
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
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import photoStyles from '@/shared/styles/photo-zone.module.css';

interface ChecklistViewProps {
  checklist: Checklist;
  onSaveAsTemplate?: (checklist: Checklist) => void;
  defaultEdit?: boolean;
  onSaveChecklist?: (checklist: Checklist) => void;
}

interface LightboxState {
  photoIds: string[];
  startIndex: number;
  categoryId: string;
  itemId: string;
  canDelete: boolean;
}

interface SortableChecklistCategoryProps {
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
  onUpdateCategoryName: (categoryId: string, name: string) => void;
  onRemoveCategory: (categoryId: string) => void;
  onAddItem: (categoryId: string) => void;
  onUpdateItemText: (itemId: string, text: string) => void;
  onUpdateItemDesc: (itemId: string, desc: string) => void;
  onRemoveItem: (categoryId: string, itemId: string) => void;
  onAddPhoto: (categoryId: string, itemId: string, file: File) => void;
  onDeletePhoto: (categoryId: string, itemId: string, photoId: string) => void;
  onViewPhotos: (photoIds: string[], startIndex: number, categoryId: string, itemId: string, canDelete: boolean) => void;
}

interface SortableChecklistItemProps {
  item: { id: string; text: string; description?: string };
  categoryId?: string;
  photoIds: string[];
  guidePhotoIds: string[];
  imageLinks: string[];
  showValidation: boolean;
  onUpdateText: (text: string) => void;
  onUpdateDescription: (desc: string) => void;
  onRemove: () => void;
  onAddPhoto?: (file: File) => void;
  onDeletePhoto?: (photoId: string) => void;
  onViewPhotos?: (photoIds: string[], startIndex: number) => void;
  placeholder: string;
  descriptionPlaceholder: string;
}

function SortableChecklistCategory({
  category,
  catValues,
  itemValues,
  descValues,
  showValidation,
  categoryPlaceholder,
  addItemLabel,
  emptyItemsMessage,
  itemPlaceholder,
  itemDescPlaceholder,
  onUpdateCategoryName,
  onRemoveCategory,
  onAddItem,
  onUpdateItemText,
  onUpdateItemDesc,
  onRemoveItem,
  onAddPhoto,
  onDeletePhoto,
  onViewPhotos,
}: SortableChecklistCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  const items = category.items.map(i => ({
    id: i.id,
    text: itemValues[i.id] ?? i.text,
    description: descValues[i.id] ?? i.description ?? '',
  }));

  return (
    <div ref={setNodeRef} style={style}>
      <SortableContext
        items={category.items.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <CategoryEditCard
          categoryId={category.id}
          name={catValues[category.id] ?? category.name}
          items={items}
          showValidation={showValidation}
          categoryPlaceholder={categoryPlaceholder}
          addItemLabel={addItemLabel}
          emptyItemsMessage={emptyItemsMessage}
          onUpdateName={(name) => onUpdateCategoryName(category.id, name)}
          onRemove={() => onRemoveCategory(category.id)}
          onAddItem={() => onAddItem(category.id)}
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
          renderItem={(item) => {
            const original = category.items.find(i => i.id === item.id);
            const guideCount = (original?.guidePhotoIds?.length || 0) + (original?.imageLinks?.length || 0);
            return (
              <SortableChecklistItem
                key={item.id}
                item={item}
                categoryId={category.id}
                photoIds={original?.photoIds || []}
                guidePhotoIds={original?.guidePhotoIds || []}
                imageLinks={original?.imageLinks || []}
                showValidation={showValidation}
                onUpdateText={(text) => onUpdateItemText(item.id, text)}
                onUpdateDescription={(desc) => onUpdateItemDesc(item.id, desc)}
                onRemove={() => onRemoveItem(category.id, item.id)}
                onAddPhoto={(file) => onAddPhoto(category.id, item.id, file)}
                onDeletePhoto={(photoId) => onDeletePhoto(category.id, item.id, photoId)}
                onViewPhotos={(photoIds, startIndex) =>
                  onViewPhotos(photoIds, startIndex, category.id, item.id, startIndex >= guideCount)
                }
                placeholder={itemPlaceholder}
                descriptionPlaceholder={itemDescPlaceholder}
              />
            );
          }}
        />
      </SortableContext>
    </div>
  );
}

function SortableChecklistItem({
  item,
  photoIds,
  guidePhotoIds,
  imageLinks,
  showValidation,
  onUpdateText,
  onUpdateDescription,
  onRemove,
  onAddPhoto,
  onDeletePhoto,
  onViewPhotos,
  placeholder,
  descriptionPlaceholder,
}: SortableChecklistItemProps) {
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [guideThumbs, setGuideThumbs] = useState<Record<string, string>>({});
  const [captureThumbs, setCaptureThumbs] = useState<Record<string, string>>({});
  const [brokenLinks, setBrokenLinks] = useState<Set<string>>(new Set());
  const hasGuides = guidePhotoIds.length > 0;
  const hasCaptures = photoIds.length > 0;
  const hasImageLinks = imageLinks.length > 0;
  const allPhotoIds = [...guidePhotoIds, ...imageLinks, ...photoIds];

  useEffect(() => {
    if (guidePhotoIds.length === 0) { setGuideThumbs({}); return; }
    let cancelled = false;
    const load = async () => {
      const map: Record<string, string> = {};
      for (const pid of guidePhotoIds) {
        try {
          const photo = await storage.getPhoto(pid);
          if (photo && !cancelled) map[pid] = photo.dataUrl;
        } catch { }
      }
      if (!cancelled) setGuideThumbs(map);
    };
    load();
    return () => { cancelled = true; };
  }, [guidePhotoIds.join(',')]);

  useEffect(() => {
    if (photoIds.length === 0) { setCaptureThumbs({}); return; }
    let cancelled = false;
    const load = async () => {
      const map: Record<string, string> = {};
      for (const pid of photoIds) {
        try {
          const photo = await storage.getPhoto(pid);
          if (photo && !cancelled) map[pid] = photo.dataUrl;
        } catch { }
      }
      if (!cancelled) setCaptureThumbs(map);
    };
    load();
    return () => { cancelled = true; };
  }, [photoIds.join(',')]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddPhoto) {
      onAddPhoto(file);
      e.target.value = '';
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ItemEditRow
        itemId={item.id}
        text={item.text}
        description={item.description}
        placeholder={placeholder}
        descriptionPlaceholder={descriptionPlaceholder}
        showValidation={showValidation}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            style={{ touchAction: 'none' }}
            className="btn-icon w-5 h-5 cursor-grab active:cursor-grabbing text-tertiary hover:text-primary shrink-0"
          >
            <GripVertical size={12} />
          </button>
        }
        extras={
          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="btn-icon w-5 h-5 text-tertiary hover:text-accent shrink-0"
            title="Add photo"
          >
            <Camera size={12} />
          </button>
        }
        onUpdateText={onUpdateText}
        onUpdateDescription={onUpdateDescription}
        onRemove={onRemove}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      {(hasGuides || hasImageLinks || hasCaptures) && (
        <div className={photoStyles['photo-zone']} onClick={(e) => e.stopPropagation()}>
          <div className={photoStyles['photo-strip']}>
            {guidePhotoIds.map((pid, i) => (
              <div key={pid} className={photoStyles['photo-thumb-wrap']}>
                {guideThumbs[pid] ? (
                  <button onClick={() => onViewPhotos?.(allPhotoIds, i)} className={photoStyles['guide-photo-btn']}>
                    <img src={guideThumbs[pid]} alt="guide" className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-guide']}`} />
                    <span className={photoStyles['guide-badge']}>G</span>
                  </button>
                ) : (
                  <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']} ${photoStyles['photo-thumb-guide']}`}>
                    <ImageIcon size={12} />
                  </div>
                )}
              </div>
            ))}
            {imageLinks.map((url, i) => {
              const idx = guidePhotoIds.length + i;
              return (
                <div key={`${url}-${i}`} className={photoStyles['photo-thumb-wrap']}>
                  {brokenLinks.has(url) ? (
                    <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']} ${photoStyles['photo-thumb-guide']}`}>
                      <ImageIcon size={12} />
                    </div>
                  ) : (
                    <button
                      onClick={() => onViewPhotos?.(allPhotoIds, idx)}
                      className={photoStyles['guide-photo-btn']}
                    >
                      <img
                        src={url}
                        alt="ai reference"
                        className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-guide']}`}
                        onError={() => setBrokenLinks((prev) => new Set(prev).add(url))}
                      />
                      <span className={photoStyles['ai-badge']}>AI</span>
                    </button>
                  )}
                </div>
              );
            })}
            {photoIds.map((pid, i) => {
              const idx = guidePhotoIds.length + imageLinks.length + i;
              return (
                <div key={pid} className={photoStyles['photo-thumb-wrap']}>
                  {captureThumbs[pid] ? (
                    <button onClick={() => onViewPhotos?.(allPhotoIds, idx)}>
                      <img src={captureThumbs[pid]} alt="capture" className={photoStyles['photo-thumb']} />
                    </button>
                  ) : (
                    <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']}`}>
                      <ImageIcon size={12} />
                    </div>
                  )}
                  <button
                    onClick={() => onDeletePhoto?.(pid)}
                    className={photoStyles['photo-thumb-delete']}
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const ChecklistView: React.FC<ChecklistViewProps> = ({ checklist, onSaveAsTemplate, defaultEdit = false, onSaveChecklist }) => {
  const { t, language } = useTranslation();
  const storage = useStorage();
  const { updateChecklist, updateChecklistTitle, toggleItem, addChecklistPhoto, deleteChecklistPhoto, deleteChecklist } = useChecklist();
  const { closeChecklist } = useNavigation();
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showSaveAsTemplateConfirm, setShowSaveAsTemplateConfirm] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(checklist.title);
  const [editingMode, setEditingMode] = useState(() => defaultEdit);
  const [catValues, setCatValues] = useState<Record<string, string>>({});
  const [itemValues, setItemValues] = useState<Record<string, string>>({});
  const [descValues, setDescValues] = useState<Record<string, string>>({});
  const [localChecklist, setLocalChecklist] = useState<Checklist | null>(defaultEdit ? { ...checklist } : null);

  const isDraft = defaultEdit && onSaveChecklist !== undefined;
  const currentChecklist = localChecklist ?? checklist;

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    const categories = currentChecklist.categories;

    const isCategory = categories.some(c => c.id === activeIdStr);
    if (isCategory) {
      const oldIndex = categories.findIndex(c => c.id === activeIdStr);
      const newIndex = categories.findIndex(c => c.id === overIdStr);
      if (oldIndex !== -1 && newIndex !== -1) {
        commit({ ...currentChecklist, categories: arrayMove(categories, oldIndex, newIndex) });
      }
      return;
    }

    const catWithItem = categories.find(c => c.items.some(i => i.id === activeIdStr));
    if (!catWithItem) return;
    const items = catWithItem.items;
    const oldIndex = items.findIndex(i => i.id === activeIdStr);
    const newIndex = items.findIndex(i => i.id === overIdStr);
    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(items, oldIndex, newIndex);
      commit({
        ...currentChecklist,
        categories: categories.map(c => c.id === catWithItem.id ? { ...c, items: newItems } : c),
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeItemForOverlay = activeId
    ? currentChecklist.categories.flatMap(c => c.items).find(i => i.id === activeId)
    : null;

  const activeCategoryForOverlay = activeId
    ? currentChecklist.categories.find(c => c.id === activeId)
    : null;

  useEffect(() => {
    if (isDraft) {
      const cats: Record<string, string> = {};
      const items: Record<string, string> = {};
      const descs: Record<string, string> = {};
      for (const cat of currentChecklist.categories) {
        cats[cat.id] = cat.name;
        for (const item of cat.items) {
          items[item.id] = item.text;
          if (item.description !== undefined) descs[item.id] = item.description;
        }
      }
      setCatValues(cats);
      setItemValues(items);
      setDescValues(descs);
    }
  }, []);
  const commit = useCallback((updated: Checklist) => {
    setLocalChecklist(updated);
  }, []);

  const handleSaveTitle = () => {
    if (titleValue.trim() && titleValue !== currentChecklist.title) {
      const updated = { ...currentChecklist, title: titleValue.trim() };
      if (editingMode) {
        commit(updated);
      } else {
        updateChecklist(updated);
      }
      setTitleValue(updated.title);
    } else {
      setTitleValue(currentChecklist.title);
    }
    setEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setTitleValue(currentChecklist.title);
    setEditingTitle(false);
  };

  const { totalItems, processedItems, progress } = useMemo(() => {
    const total = currentChecklist.categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const processed = currentChecklist.categories.reduce(
      (acc, cat) => acc + cat.items.filter((i) => i.checked || i.skipped).length,
      0
    );
    return {
      totalItems: total,
      processedItems: processed,
      progress: total > 0 ? (processed / total) * 100 : 0,
    };
  }, [currentChecklist]);

  const isCompleted = progress === 100 && currentChecklist.status !== 'completed';

  const handleViewPhotos = (photoIds: string[], startIndex: number, categoryId: string, itemId: string, canDelete: boolean) => {
    setLightbox({ photoIds, startIndex, categoryId, itemId, canDelete });
  };

  const handleEditPhotoAdd = useCallback(async (categoryId: string, itemId: string, file: File) => {
    const uuid = generateUUID();
    const photoId = buildChecklistPhotoId(itemId, uuid);
    const dataUrl = await compressImage(file);
    await storage.setPhoto({ itemId: photoId, dataUrl, updatedAt: Date.now() });

    const newCategories = currentChecklist.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId
              ? { ...item, photoIds: [...(item.photoIds || []), photoId] }
              : item
          ),
        };
      }
      return cat;
    });

    commit({ ...currentChecklist, categories: newCategories });
  }, [currentChecklist, commit, storage]);

  const handleEditPhotoDelete = useCallback(async (categoryId: string, itemId: string, photoId: string) => {
    await storage.deletePhoto(photoId);

    const newCategories = currentChecklist.categories.map((cat) => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map((item) =>
            item.id === itemId
              ? { ...item, photoIds: (item.photoIds || []).filter((id) => id !== photoId) }
              : item
          ),
        };
      }
      return cat;
    });

    commit({ ...currentChecklist, categories: newCategories });
  }, [currentChecklist, commit, storage]);

  const handleDeletePhoto = (photoId: string) => {
    if (lightbox) {
      if (editingMode) {
        handleEditPhotoDelete(lightbox.categoryId, lightbox.itemId, photoId);
      } else {
        deleteChecklistPhoto(currentChecklist, lightbox.categoryId, lightbox.itemId, photoId);
      }
      if (lightbox.photoIds.length <= 1) {
        setLightbox(null);
      }
    }
  };

  const handleDeleteChecklist = () => {
    deleteChecklist(currentChecklist.id);
    setShowDeleteConfirm(false);
    closeChecklist();
  };

  const enterEditMode = useCallback(() => {
    const cats: Record<string, string> = {};
    const items: Record<string, string> = {};
    const descs: Record<string, string> = {};
    for (const cat of currentChecklist.categories) {
      cats[cat.id] = cat.name;
      for (const item of cat.items) {
        items[item.id] = item.text;
        if (item.description !== undefined) descs[item.id] = item.description;
      }
    }
    setCatValues(cats);
    setItemValues(items);
    setDescValues(descs);
    setEditingMode(true);
    if (!isDraft) {
      setLocalChecklist({ ...currentChecklist });
    }
  }, [currentChecklist, isDraft]);

  const exitEditMode = useCallback(() => {
    const newCategories = currentChecklist.categories.map(cat => ({
      ...cat,
      name: catValues[cat.id] ?? cat.name,
      items: cat.items.map(item => ({
        ...item,
        text: itemValues[item.id] ?? item.text,
        description: descValues[item.id] ?? item.description,
      })),
    }));

    const emptyCatNames = newCategories.some(c => !c.name.trim());
    const emptyItemTexts = newCategories.some(c => c.items.some(i => !i.text.trim()));

    if (emptyCatNames || emptyItemTexts) {
      setShowValidation(true);
      return;
    }

    const total = newCategories.reduce((acc, cat) => acc + cat.items.length, 0);
    const processed = newCategories.reduce((acc, cat) => acc + cat.items.filter(i => i.checked || i.skipped).length, 0);

    const updated = { ...currentChecklist, categories: newCategories, status: total > 0 && processed === total ? 'completed' : 'active' };
    if (isDraft && onSaveChecklist) {
      onSaveChecklist(updated);
    } else {
      updateChecklist(updated);
    }
    setEditingMode(false);
    setCatValues({});
    setItemValues({});
    setDescValues({});
    setLocalChecklist(null);
  }, [currentChecklist, catValues, itemValues, descValues, updateChecklist, isDraft, onSaveChecklist]);

  const cancelEditMode = useCallback(() => {
    setCatValues({});
    setItemValues({});
    setDescValues({});
    setEditingMode(false);
    setLocalChecklist(null);
  }, []);

  const addCategory = useCallback(() => {
    const newCategory: ChecklistCategory = {
      id: generateUUID(),
      name: '',
      items: [],
    };
    const updated = { ...currentChecklist, categories: [...currentChecklist.categories, newCategory] };
    commit(updated);
    setCatValues(prev => ({ ...prev, [newCategory.id]: '' }));
  }, [currentChecklist, commit]);

  const removeCategory = useCallback((categoryId: string) => {
    const category = currentChecklist.categories.find(c => c.id === categoryId);
    if (category) {
      for (const item of category.items) {
        for (const photoId of item.photoIds || []) {
          storage.deletePhoto(photoId);
        }
      }
    }
    const updated = { ...currentChecklist, categories: currentChecklist.categories.filter((c) => c.id !== categoryId) };
    commit(updated);
  }, [currentChecklist, commit, storage]);

  const addItem = useCallback((categoryId: string) => {
    const newItem: ChecklistItem = {
      id: generateUUID(),
      text: '',
      description: '',
      checked: false,
    };
    const updated = {
      ...currentChecklist,
      categories: currentChecklist.categories.map((c) =>
        c.id === categoryId ? { ...c, items: [...c.items, newItem] } : c
      ),
    };
    commit(updated);
    setItemValues(prev => ({ ...prev, [newItem.id]: '' }));
  }, [currentChecklist, commit]);

  const removeItem = useCallback((categoryId: string, itemId: string) => {
    const item = currentChecklist.categories.find(c => c.id === categoryId)?.items.find(i => i.id === itemId);
    if (item) {
      for (const photoId of item.photoIds || []) {
        storage.deletePhoto(photoId);
      }
    }
    const updated = {
      ...currentChecklist,
      categories: currentChecklist.categories.map((c) =>
        c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
      ),
    };
    commit(updated);
  }, [currentChecklist, commit, storage]);

  const handleSaveDraft = useCallback(() => {
    const newTitle = titleValue.trim();
    const newCategories = currentChecklist.categories.map(cat => ({
      ...cat,
      name: catValues[cat.id] ?? cat.name,
      items: cat.items.map(item => ({
        ...item,
        text: itemValues[item.id] ?? item.text,
        description: descValues[item.id] ?? item.description,
      })),
    }));

    const emptyTitle = !newTitle;
    const emptyCatNames = newCategories.some(c => !c.name.trim());
    const emptyItemTexts = newCategories.some(c => c.items.some(i => !i.text.trim()));

    if (emptyTitle || emptyCatNames || emptyItemTexts) {
      setShowValidation(true);
      return;
    }

    const total = newCategories.reduce((acc, cat) => acc + cat.items.length, 0);
    const processed = newCategories.reduce((acc, cat) => acc + cat.items.filter(i => i.checked || i.skipped).length, 0);

    const updated = { ...currentChecklist, title: newTitle, categories: newCategories, status: total > 0 && processed === total ? 'completed' : 'active' };
    if (onSaveChecklist) {
      onSaveChecklist(updated);
    }
  }, [currentChecklist, catValues, itemValues, descValues, titleValue, onSaveChecklist]);

  const handleCancelDraft = useCallback(() => {
    closeChecklist();
  }, [closeChecklist]);

  const handleSaveAsTemplateConfirm = useCallback(() => {
    if (onSaveAsTemplate) {
      onSaveAsTemplate(currentChecklist);
    }
    setShowSaveAsTemplateConfirm(false);
  }, [onSaveAsTemplate, currentChecklist]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={closeChecklist} className="btn-icon hover:text-accent">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {isDraft ? (
            <>
              <button onClick={handleCancelDraft} className="btn btn-ghost">
                {t.editor.cancel}
              </button>
              <button onClick={handleSaveDraft} className="btn btn-primary">
                <Save size={16} /> {t.editor.save}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              {editingMode ? (
                <>
                  <button onClick={cancelEditMode} className="btn btn-ghost">
                    {t.editor.cancel}
                  </button>
                  <button onClick={exitEditMode} className="btn btn-primary">
                    <Save size={16} /> {t.editor.save}
                  </button>
                </>
              ) : (
                <button onClick={enterEditMode} className="btn btn-soft">
                  <Pencil size={14} /> {t.checklist.editMode}
                </button>
              )}
              {onSaveAsTemplate && (
                <button
                  onClick={() => setShowSaveAsTemplateConfirm(true)}
                  className="btn-icon hover:text-accent"
                  title={t.checklist.saveAsTemplate}
                >
                  <FileText size={16} />
                </button>
              )}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-icon btn-icon-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {currentChecklist.templateTitle && (
                <p className="text-xs font-semibold text-accent tracking-wider uppercase mb-1">
                  {currentChecklist.templateTitle}
                </p>
              )}
              {isDraft ? (
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  className={`input font-semibold text-base${showValidation && !titleValue.trim() ? ' input-invalid' : ''}`}
                  placeholder={t.checklist.titlePlaceholder}
                  autoFocus
                />
              ) : editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    className="input font-semibold text-base flex-1"
                    placeholder={t.checklist.titlePlaceholder}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelTitle();
                    }}
                  />
                  <button onClick={handleSaveTitle} className="btn-icon text-accent">
                    <Check size={16} />
                  </button>
                  <button onClick={handleCancelTitle} className="btn-icon text-tertiary">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <h2 className="text-base font-semibold flex-1">
                    {currentChecklist.title || t.checklist.titlePlaceholder}
                  </h2>
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="btn-icon"
                    title={t.checklist.editTitle}
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
              <p className="text-tertiary text-xs mt-1">
                {new Date(currentChecklist.createdAt).toLocaleDateString(
                  language === 'lv' ? 'lv-LV' :
                  language === 'ru' ? 'ru-RU' :
                  language === 'es' ? 'es-ES' : 'en-US'
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold text-accent">{Math.round(progress)}%</div>
            </div>
          </div>
          <ChecklistProgressBar progress={progress} />
        </div>
      </div>

      {editingMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={currentChecklist.categories.map(c => c.id)}
            strategy={rectSortingStrategy}
          >
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
                  onUpdateCategoryName={(id, name) => setCatValues(prev => ({ ...prev, [id]: name }))}
                  onRemoveCategory={removeCategory}
                  onAddItem={addItem}
                  onUpdateItemText={(itemId, text) => setItemValues(prev => ({ ...prev, [itemId]: text }))}
                  onUpdateItemDesc={(itemId, desc) => setDescValues(prev => ({ ...prev, [itemId]: desc }))}
                  onRemoveItem={removeItem}
                  onAddPhoto={handleEditPhotoAdd}
                  onDeletePhoto={handleEditPhotoDelete}
                  onViewPhotos={(photoIds, startIndex, categoryId, itemId, canDelete) =>
                    handleViewPhotos(photoIds, startIndex, categoryId, itemId, canDelete)
                  }
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
            {activeItemForOverlay ? (
              <div className="bg-surface-2 border border-accent rounded px-2 py-1.5 shadow-lg opacity-90">
                <span className="text-sm font-medium">{activeItemForOverlay.text || t.editor.itemPlaceholder}</span>
              </div>
            ) : activeCategoryForOverlay ? (
              <div className="bg-surface-2 border border-accent rounded px-3 py-2 shadow-lg opacity-90">
                <span className="text-sm font-semibold">{activeCategoryForOverlay.name || t.editor.catPlaceholder}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
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
                              onToggleChecked={() => toggleItem(currentChecklist, category.id, item.id, 'checked')}
                              onToggleSkipped={() => toggleItem(currentChecklist, category.id, item.id, 'skipped')}
                              onAddPhoto={(file) => addChecklistPhoto(currentChecklist, category.id, item.id, file)}
                              onDeletePhoto={(photoId) => deleteChecklistPhoto(currentChecklist, category.id, item.id, photoId)}
                              onViewPhotos={(photoIds, startIndex) =>
                                handleViewPhotos(photoIds, startIndex, category.id, item.id, startIndex >= guideCount)
                              }
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-success-subtle border-success-subtle text-center py-8"
        >
          <CheckCircle size={40} className="text-success mx-auto mb-4" />
          <h3 className="text-base font-bold mb-2">{t.checklist.complete}</h3>
          <p className="text-secondary text-sm mb-6">{t.checklist.doneMsg}</p>
          <button onClick={closeChecklist} className="btn btn-primary">
            {t.checklist.back}
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {lightbox && (
          <PhotoLightbox
            photoIds={lightbox.photoIds}
            startIndex={lightbox.startIndex}
            onClose={() => setLightbox(null)}
            onDelete={lightbox.canDelete ? handleDeletePhoto : undefined}
          />
        )}
      </AnimatePresence>

      {showValidation && (
        <ConfirmDialog
          title={t.validation.requiredTitle}
          message={
            [
              !titleValue.trim() && t.validation.titleRequired,
              currentChecklist.categories.some(c => !(catValues[c.id] ?? c.name).trim()) && t.validation.categoryNameRequired,
              currentChecklist.categories.some(c => c.items.some(i => !(itemValues[i.id] ?? i.text).trim())) && t.validation.itemNameRequired,
            ].filter(Boolean).join('\n')
          }
          confirmLabel={t.common.ok}
          variant="warning"
          onConfirm={() => setShowValidation(false)}
          onCancel={() => setShowValidation(false)}
        />
      )}

      {showSaveAsTemplateConfirm && (
        <ConfirmDialog
          title={t.checklist.saveAsTemplate}
          message={t.common.delete.confirm}
          confirmLabel={t.checklist.saveAsTemplate}
          onConfirm={handleSaveAsTemplateConfirm}
          onCancel={() => setShowSaveAsTemplateConfirm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title={t.common.delete.confirmTitle}
          message={t.common.delete.confirmMsg}
          confirmLabel={t.common.delete.confirmAction}
          onConfirm={handleDeleteChecklist}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default ChecklistView;
