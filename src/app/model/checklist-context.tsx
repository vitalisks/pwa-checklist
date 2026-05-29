import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Template, Checklist, ChecklistPhoto } from '@/shared/config';
import { useStorage } from '@/shared/api';
import { compressImage, generateUUID } from '@/shared/lib';
import { ChecklistRepository } from '@/entities/checklist';
import { PhotoRepository, buildChecklistPhotoId } from '@/entities/photo';
import { createChecklistFromTemplate, createBlankChecklist, checklistToTemplate } from '@/features/create-checklist';
import { toggleChecklistItem } from '@/features/toggle-checklist-item';
import { migrateChecklistsFromLocalStorage } from '@/entities/checklist';

interface ChecklistContextType {
  checklists: Checklist[];
  createChecklist: (template: Template) => Promise<Checklist | null>;
  createBlankChecklist: (title?: string) => Promise<Checklist | null>;
  persistChecklist: (checklist: Checklist) => Promise<void>;
  updateChecklist: (checklist: Checklist) => Promise<void>;
  updateChecklistTitle: (checklist: Checklist, newTitle: string) => Promise<void>;
  deleteChecklist: (id: string) => Promise<void>;
  toggleItem: (checklist: Checklist, categoryId: string, itemId: string, field: 'checked' | 'skipped') => void;
  addChecklistPhoto: (checklist: Checklist, categoryId: string, itemId: string, file: File) => Promise<Checklist>;
  deleteChecklistPhoto: (checklist: Checklist, categoryId: string, itemId: string, photoId: string) => Promise<Checklist>;
  convertChecklistToTemplate: (checklist: Checklist) => Template;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storage = useStorage();
  const checklistRepo = useMemo(() => new ChecklistRepository(storage), [storage]);
  const photoRepo = useMemo(() => new PhotoRepository(storage), [storage]);

  const [checklists, setChecklists] = useState<Checklist[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        await migrateChecklistsFromLocalStorage(storage);
        const data = await checklistRepo.getAll();
        setChecklists(data);
      } catch (error) {
        console.error('Failed to load checklists:', error);
      }
    };
    load();
  }, []);

  const persistChecklist = useCallback(async (checklist: Checklist) => {
    try {
      await checklistRepo.add(checklist);
      setChecklists((prev) => [...prev, checklist]);
    } catch (error) {
      console.error('Failed to persist checklist:', error);
    }
  }, [checklistRepo]);

  const updateChecklist = useCallback(async (checklist: Checklist) => {
    try {
      await checklistRepo.update(checklist);
      setChecklists((prev) => prev.map((c) => (c.id === checklist.id ? checklist : c)));
    } catch (error) {
      console.error('Failed to update checklist:', error);
    }
  }, [checklistRepo]);

  const createChecklist = useCallback(async (template: Template): Promise<Checklist | null> => {
    try {
      const newChecklist = createChecklistFromTemplate(template);
      await checklistRepo.add(newChecklist);
      setChecklists((prev) => [...prev, newChecklist]);
      return newChecklist;
    } catch (error) {
      console.error('Failed to create checklist:', error);
      return null;
    }
  }, [checklistRepo]);

  const createBlankChecklistFn = useCallback(async (title?: string): Promise<Checklist | null> => {
    try {
      const newChecklist = createBlankChecklist(title);
      await checklistRepo.add(newChecklist);
      setChecklists((prev) => [...prev, newChecklist]);
      return newChecklist;
    } catch (error) {
      console.error('Failed to create blank checklist:', error);
      return null;
    }
  }, [checklistRepo]);

  const convertChecklistToTemplateFn = useCallback((checklist: Checklist): Template => {
    return checklistToTemplate(checklist);
  }, []);

  const updateChecklistTitle = useCallback(async (checklist: Checklist, newTitle: string) => {
    const updated = { ...checklist, title: newTitle };
    try {
      await checklistRepo.update(updated);
      setChecklists((prev) => prev.map((c) => (c.id === checklist.id ? updated : c)));
    } catch (error) {
      console.error('Failed to update checklist title:', error);
    }
  }, [checklistRepo]);

  const deleteChecklist = useCallback(async (id: string) => {
    try {
      const checklist = checklists.find((c) => c.id === id);
      if (checklist) {
        for (const cat of checklist.categories) {
          for (const item of cat.items) {
            for (const photoId of item.photoIds || []) {
              await photoRepo.delete(photoId);
            }
          }
        }
      }
      await checklistRepo.delete(id);
      setChecklists((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete checklist:', error);
    }
  }, [checklists, checklistRepo, photoRepo]);

  const toggleItem = useCallback((checklist: Checklist, categoryId: string, itemId: string, field: 'checked' | 'skipped') => {
    const updated = toggleChecklistItem(checklist, categoryId, itemId, field);
    updateChecklist(updated);
  }, [updateChecklist]);

  const addChecklistPhoto = useCallback(async (checklist: Checklist, categoryId: string, itemId: string, file: File): Promise<Checklist> => {
    const uuid = generateUUID();
    const photoId = buildChecklistPhotoId(itemId, uuid);
    const dataUrl = await compressImage(file);
    const photo: ChecklistPhoto = { itemId: photoId, dataUrl, updatedAt: Date.now() };
    await photoRepo.save(photo);

    const newCategories = checklist.categories.map((cat) => {
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

    const updatedChecklist = { ...checklist, categories: newCategories };
    await updateChecklist(updatedChecklist);
    return updatedChecklist;
  }, [photoRepo, updateChecklist]);

  const deleteChecklistPhoto = useCallback(async (checklist: Checklist, categoryId: string, itemId: string, photoId: string): Promise<Checklist> => {
    await photoRepo.delete(photoId);

    const newCategories = checklist.categories.map((cat) => {
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

    const updatedChecklist = { ...checklist, categories: newCategories };
    await updateChecklist(updatedChecklist);
    return updatedChecklist;
  }, [photoRepo, updateChecklist]);

  const value = useMemo(() => ({
    checklists, createChecklist, createBlankChecklist: createBlankChecklistFn, persistChecklist, updateChecklist, updateChecklistTitle,
    deleteChecklist, toggleItem, addChecklistPhoto, deleteChecklistPhoto, convertChecklistToTemplate: convertChecklistToTemplateFn,
  }), [checklists, createChecklist, createBlankChecklistFn, persistChecklist, updateChecklist, updateChecklistTitle,
    deleteChecklist, toggleItem, addChecklistPhoto, deleteChecklistPhoto, convertChecklistToTemplateFn]);

  return (
    <ChecklistContext.Provider value={value}>
      {children}
    </ChecklistContext.Provider>
  );
};

export function useChecklist(): ChecklistContextType {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error('useChecklist must be used within a ChecklistProvider');
  return ctx;
}
