import { useState, useEffect, useCallback } from 'react';
import type { Template, Checklist, ChecklistPhoto } from '@/shared/config';
import { useStorage } from '@/shared/api';
import { compressImage, generateUUID } from '@/shared/lib';
import { TemplateRepository } from '@/entities/template';
import { ChecklistRepository } from '@/entities/checklist';
import { PhotoRepository } from '@/entities/photo';
import { PHOTO_ID_PREFIXES, buildTemplatePhotoId, buildChecklistPhotoId } from '@/entities/photo';
import { createChecklistFromTemplate } from '@/features/create-checklist';
import { toggleChecklistItem } from '@/features/toggle-checklist-item';
import { exportData, importData, clearAllData } from '@/features/import-export';
import { migrateTemplatesFromLocalStorage } from '@/entities/template';
import { migrateChecklistsFromLocalStorage } from '@/entities/checklist';

export function useAppData() {
  const storage = useStorage();
  const templateRepo = new TemplateRepository(storage);
  const checklistRepo = new ChecklistRepository(storage);
  const photoRepo = new PhotoRepository(storage);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        await migrateTemplatesFromLocalStorage(storage);
        await migrateChecklistsFromLocalStorage(storage);
        const [tData, cData] = await Promise.all([
          templateRepo.getAll(),
          checklistRepo.getAll(),
        ]);
        setTemplates(tData.sort((a, b) => b.updatedAt - a.updatedAt));
        setChecklists(cData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveTemplate = useCallback(async (template: Template) => {
    try {
      const existing = templates.find((t) => t.id === template.id);
      if (existing) {
        const oldPhotoIds = new Set(
          existing.categories.flatMap((c) => c.items.flatMap((i) => i.photoIds || [])),
        );
        const newPhotoIds = new Set(
          template.categories.flatMap((c) => c.items.flatMap((i) => i.photoIds || [])),
        );
        for (const oldId of oldPhotoIds) {
          if (!newPhotoIds.has(oldId)) {
            await photoRepo.delete(oldId);
          }
        }
        await templateRepo.save(template);
        setTemplates((prev) => prev.map((t) => (t.id === template.id ? template : t)));
      } else {
        await templateRepo.save(template);
        setTemplates((prev) => [template, ...prev]);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  }, [templates, templateRepo, photoRepo]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const template = templates.find((t) => t.id === id);
      if (template) {
        for (const cat of template.categories) {
          for (const item of cat.items) {
            for (const photoId of item.photoIds || []) {
              await photoRepo.delete(photoId);
            }
          }
        }
      }
      await templateRepo.delete(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  }, [templates, templateRepo, photoRepo]);

  const addTemplatePhoto = useCallback(async (itemId: string, file: File): Promise<string | null> => {
    try {
      const uuid = generateUUID();
      const photoId = buildTemplatePhotoId(itemId, uuid);
      const dataUrl = await compressImage(file);
      const photo: ChecklistPhoto = { itemId: photoId, dataUrl, updatedAt: Date.now() };
      await photoRepo.save(photo);
      return photoId;
    } catch (error) {
      console.error('Failed to save template photo:', error);
      return null;
    }
  }, [photoRepo]);

  const deleteTemplatePhoto = useCallback(async (photoId: string): Promise<void> => {
    try {
      await photoRepo.delete(photoId);
    } catch (error) {
      console.error('Failed to delete template photo:', error);
    }
  }, [photoRepo]);

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

  const updateChecklist = useCallback(async (checklist: Checklist) => {
    try {
      await checklistRepo.update(checklist);
      setChecklists((prev) => prev.map((c) => (c.id === checklist.id ? checklist : c)));
    } catch (error) {
      console.error('Failed to update checklist:', error);
    }
  }, [checklistRepo]);

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

  const addChecklistPhoto = useCallback(async (checklist: Checklist, categoryId: string, itemId: string, file: File) => {
    try {
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
    } catch (error) {
      console.error('Failed to save photo:', error);
    }
  }, [photoRepo, updateChecklist]);

  const deleteChecklistPhoto = useCallback(async (checklist: Checklist, categoryId: string, itemId: string, photoId: string) => {
    try {
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
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  }, [photoRepo, updateChecklist]);

  const handleExport = useCallback(async () => {
    await exportData(storage);
  }, [storage]);

  const handleImport = useCallback(async (file: File) => {
    return importData(storage, file);
  }, [storage]);

  const handleClearData = useCallback(async () => {
    await clearAllData(storage);
    window.location.reload();
  }, [storage]);

  return {
    loading,
    templates,
    checklists,
    saveTemplate,
    deleteTemplate,
    addTemplatePhoto,
    deleteTemplatePhoto,
    createChecklist,
    updateChecklist,
    updateChecklistTitle,
    deleteChecklist,
    toggleItem,
    addChecklistPhoto,
    deleteChecklistPhoto,
    handleExport,
    handleImport,
    handleClearData,
  };
}
