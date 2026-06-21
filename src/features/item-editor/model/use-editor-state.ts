import { useState, useCallback, useMemo } from 'react';
import { generateUUID, compressImage } from '@/shared/lib';
import { useStorage } from '@/shared/api';
import type { EditCategoryData, EditItemData, EditorHandlers } from './types';
import { useDndState } from './use-dnd-state';

export interface UseEditorStateOptions {
  initialCategories: EditCategoryData[];
  photoIdPrefix?: string;
  onViewPhotos?: (photoIds: string[], startIndex: number, categoryId: string, itemId: string, canDelete: boolean) => void;
  requireUnwrapConfirm?: boolean;
}

export function useEditorState({
  initialCategories,
  photoIdPrefix,
  onViewPhotos,
  requireUnwrapConfirm = true,
}: UseEditorStateOptions) {
  const storage = useStorage();

  const [categories, setCategories] = useState<EditCategoryData[]>(() =>
    initialCategories.length > 0
      ? initialCategories
      : [{ id: generateUUID(), name: '', items: [], unwrapped: true }]
  );
  const [catValues, setCatValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const c of initialCategories) m[c.id] = c.name;
    return m;
  });
  const [itemValues, setItemValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const c of initialCategories)
      for (const i of c.items) m[i.id] = i.text;
    return m;
  });
  const [descValues, setDescValues] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const c of initialCategories)
      for (const i of c.items)
        if (i.description !== undefined) m[i.id] = i.description;
    return m;
  });
  const [showValidation, setShowValidation] = useState(false);
  const [unwrapPendingId, setUnwrapPendingId] = useState<string | null>(null);
  const [showUnwrapConfirm, setShowUnwrapConfirm] = useState(false);

  const addCategory = useCallback(() => {
    const newCat: EditCategoryData = { id: generateUUID(), name: '', items: [] };
    setCategories(prev => [...prev, newCat]);
    setCatValues(prev => ({ ...prev, [newCat.id]: '' }));
  }, []);

  const removeCategory = useCallback((categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  }, []);

  const addItem = useCallback((categoryId: string) => {
    const newItem: EditItemData = { id: generateUUID(), text: '', description: '' };
    setCategories(prev => prev.map(c =>
      c.id === categoryId ? { ...c, items: [...c.items, newItem] } : c
    ));
    setItemValues(prev => ({ ...prev, [newItem.id]: '' }));
  }, []);

  const removeItem = useCallback((categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(c =>
      c.id === categoryId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c
    ));
  }, []);

  const toggleUnwrap = useCallback((categoryId: string) => {
    setCategories(prev => prev.map(c =>
      c.id === categoryId ? { ...c, unwrapped: !c.unwrapped } : c
    ));
  }, []);

  const handleToggleCategoryUnwrap = useCallback((categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!requireUnwrapConfirm || cat?.unwrapped) {
      toggleUnwrap(categoryId);
    } else {
      setUnwrapPendingId(categoryId);
      setShowUnwrapConfirm(true);
    }
  }, [categories, requireUnwrapConfirm, toggleUnwrap]);

  const confirmUnwrap = useCallback(() => {
    if (unwrapPendingId) toggleUnwrap(unwrapPendingId);
    setShowUnwrapConfirm(false);
    setUnwrapPendingId(null);
  }, [unwrapPendingId, toggleUnwrap]);

  const cancelUnwrap = useCallback(() => {
    setShowUnwrapConfirm(false);
    setUnwrapPendingId(null);
  }, []);

  const addPhoto = useCallback(async (categoryId: string, itemId: string, file: File) => {
    const uuid = generateUUID();
    const photoId = photoIdPrefix ? `${photoIdPrefix}_${itemId}_${uuid}` : `_${itemId}_${uuid}`;
    const dataUrl = await compressImage(file);
    await storage.setPhoto({ itemId: photoId, dataUrl, updatedAt: Date.now() });
    setCategories(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, photoIds: [...(i.photoIds || []), photoId] } : i) }
        : c
    ));
  }, [storage, photoIdPrefix]);

  const deletePhoto = useCallback(async (categoryId: string, itemId: string, photoId: string) => {
    await storage.deletePhoto(photoId);
    setCategories(prev => prev.map(c =>
      c.id === categoryId
        ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, photoIds: (i.photoIds || []).filter(p => p !== photoId) } : i) }
        : c
    ));
  }, [storage]);

  const { handleDragStart, handleDragEnd } = useDndState(categories, setCategories);

  const commit = useCallback((newCategories: EditCategoryData[]) => {
    setCategories(newCategories);
  }, []);

  const handlers = useMemo((): EditorHandlers => ({
    commit,
    addCategory,
    removeCategory,
    addItem,
    updateCategoryName: (id, name) => setCatValues(prev => ({ ...prev, [id]: name })),
    updateItemText: (itemId, text) => setItemValues(prev => ({ ...prev, [itemId]: text })),
    updateItemDesc: (itemId, desc) => setDescValues(prev => ({ ...prev, [itemId]: desc })),
    removeItem,
    addPhoto,
    deletePhoto,
    viewPhotos: onViewPhotos ?? (() => {}),
    toggleCategoryUnwrap: handleToggleCategoryUnwrap,
  }), [commit, addCategory, removeCategory, addItem, removeItem, handleToggleCategoryUnwrap, addPhoto, deletePhoto, onViewPhotos]);

  const emptyTitle = (title: string) => !title.trim();
  const emptyCatNames = () => categories.some(c => !c.unwrapped && !(catValues[c.id] ?? c.name).trim());
  const emptyItemTexts = () => categories.some(c => c.items.some(i => !(itemValues[i.id] ?? i.text).trim()));

  const validate = (title: string) => {
    const hasEmpty = emptyTitle(title) || emptyCatNames() || emptyItemTexts();
    if (hasEmpty) setShowValidation(true);
    return !hasEmpty;
  };

  const getMergedCategories = useCallback((): EditCategoryData[] => {
    return categories.map(cat => ({
      ...cat,
      name: catValues[cat.id] ?? cat.name,
      items: cat.items.map(item => ({
        ...item,
        text: itemValues[item.id] ?? item.text,
        description: descValues[item.id] ?? item.description,
      })),
    }));
  }, [categories, catValues, itemValues, descValues]);

  const resetState = useCallback(() => {
    setCatValues({});
    setItemValues({});
    setDescValues({});
  }, []);

  const initState = useCallback((cats: EditCategoryData[]) => {
    setCategories(cats);
    const cv: Record<string, string> = {};
    const iv: Record<string, string> = {};
    const dv: Record<string, string> = {};
    for (const c of cats) {
      cv[c.id] = c.name;
      for (const i of c.items) {
        iv[i.id] = i.text;
        if (i.description !== undefined) dv[i.id] = i.description;
      }
    }
    setCatValues(cv);
    setItemValues(iv);
    setDescValues(dv);
  }, []);

  return {
    categories,
    catValues,
    itemValues,
    descValues,
    showValidation,
    setShowValidation,
    showUnwrapConfirm,
    confirmUnwrap,
    cancelUnwrap,
    handlers,
    commit,
    handleDragStart,
    handleDragEnd,
    validate,
    getMergedCategories,
    resetState,
    initState,
    emptyTitle,
    emptyCatNames,
    emptyItemTexts,
  };
}
