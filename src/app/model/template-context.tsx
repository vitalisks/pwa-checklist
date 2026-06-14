/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Template, ChecklistPhoto } from '@/shared/config';
import { useStorage } from '@/shared/api';
import { compressImage, generateUUID } from '@/shared/lib';
import { TemplateRepository } from '@/entities/template';
import { PhotoRepository, buildTemplatePhotoId } from '@/entities/photo';
import { migrateTemplatesFromLocalStorage } from '@/entities/template';

interface TemplateContextType {
  templates: Template[];
  loading: boolean;
  saveTemplate: (template: Template) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  addTemplatePhoto: (itemId: string, file: File) => Promise<string | null>;
  deleteTemplatePhoto: (photoId: string) => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storage = useStorage();
  const templateRepo = useMemo(() => new TemplateRepository(storage), [storage]);
  const photoRepo = useMemo(() => new PhotoRepository(storage), [storage]);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        await migrateTemplatesFromLocalStorage(storage);
        const data = await templateRepo.getAll();
        setTemplates(data.sort((a, b) => b.updatedAt - a.updatedAt));
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [storage, templateRepo]);

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

  const value = useMemo(() => ({
    templates, loading, saveTemplate, deleteTemplate,
    addTemplatePhoto, deleteTemplatePhoto,
  }), [templates, loading, saveTemplate, deleteTemplate, addTemplatePhoto, deleteTemplatePhoto]);

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};

export function useTemplate(): TemplateContextType {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error('useTemplate must be used within a TemplateProvider');
  return ctx;
}
