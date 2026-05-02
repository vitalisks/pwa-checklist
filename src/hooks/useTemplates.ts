import { useState, useEffect } from 'react';
import { Template, ChecklistPhoto } from '../types';
import { storageService } from '../services/storage';
import { migrateFromLocalStorage } from '../services/migration';
import { compressImage } from '../utils/image';
import { generateUUID } from '../utils/uuid';

export const useTemplates = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<Template | null | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                await migrateFromLocalStorage();
                const data = await storageService.getTemplates();
                setTemplates(data);
            } catch (error) {
                console.error('Failed to load templates:', error);
            } finally {
                setLoading(false);
            }
        };
        loadTemplates();
    }, []);

    const saveTemplate = async (template: Template) => {
        try {
            const existing = templates.find((t) => t.id === template.id);

            if (existing) {
                const oldPhotoIds = new Set(
                    existing.categories.flatMap(c => c.items.flatMap(i => i.photoIds || []))
                );
                const newPhotoIds = new Set(
                    template.categories.flatMap(c => c.items.flatMap(i => i.photoIds || []))
                );
                for (const oldId of oldPhotoIds) {
                    if (!newPhotoIds.has(oldId)) {
                        await storageService.deletePhoto(oldId);
                    }
                }

                await storageService.updateTemplate(template);
                setTemplates(templates.map((t) => (t.id === template.id ? template : t)));
            } else {
                await storageService.addTemplate(template);
                setTemplates([...templates, template]);
            }

            setEditingTemplate(undefined);
        } catch (error) {
            console.error('Failed to save template:', error);
        }
    };

    const deleteTemplate = async (id: string) => {
        try {
            const template = templates.find((t) => t.id === id);
            if (template) {
                for (const cat of template.categories) {
                    for (const item of cat.items) {
                        for (const photoId of item.photoIds || []) {
                            await storageService.deletePhoto(photoId);
                        }
                    }
                }
            }
            await storageService.deleteTemplate(id);
            setTemplates(templates.filter((t) => t.id !== id));
        } catch (error) {
            console.error('Failed to delete template:', error);
        }
    };

    const addTemplatePhoto = async (itemId: string, file: File): Promise<string | null> => {
        try {
            const photoId = `tpl_${itemId}_${generateUUID()}`;
            const dataUrl = await compressImage(file);
            const photo: ChecklistPhoto = { itemId: photoId, dataUrl, updatedAt: Date.now() };
            await storageService.setPhoto(photo);

            setTemplates(prev => prev.map(t => ({
                ...t,
                categories: t.categories.map(c => ({
                    ...c,
                    items: c.items.map(i => {
                        if (i.id === itemId) {
                            return { ...i, photoIds: [...(i.photoIds || []), photoId] };
                        }
                        return i;
                    })
                }))
            })));

            if (editingTemplate && editingTemplate !== null) {
                setEditingTemplate(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        categories: prev.categories.map(c => ({
                            ...c,
                            items: c.items.map(i => {
                                if (i.id === itemId) {
                                    return { ...i, photoIds: [...(i.photoIds || []), photoId] };
                                }
                                return i;
                            })
                        }))
                    };
                });
            }

            return photoId;
        } catch (error) {
            console.error('Failed to save template photo:', error);
            return null;
        }
    };

    const deleteTemplatePhoto = async (itemId: string, photoId: string): Promise<void> => {
        try {
            await storageService.deletePhoto(photoId);

            setTemplates(prev => prev.map(t => ({
                ...t,
                categories: t.categories.map(c => ({
                    ...c,
                    items: c.items.map(i => {
                        if (i.id === itemId) {
                            return { ...i, photoIds: (i.photoIds || []).filter(id => id !== photoId) };
                        }
                        return i;
                    })
                }))
            })));

            if (editingTemplate && editingTemplate !== null) {
                setEditingTemplate(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        categories: prev.categories.map(c => ({
                            ...c,
                            items: c.items.map(i => {
                                if (i.id === itemId) {
                                    return { ...i, photoIds: (i.photoIds || []).filter(id => id !== photoId) };
                                }
                                return i;
                            })
                        }))
                    };
                });
            }
        } catch (error) {
            console.error('Failed to delete template photo:', error);
        }
    };

    const startEditing = (template: Template | null) => setEditingTemplate(template);
    const cancelEditing = () => setEditingTemplate(undefined);

    return {
        templates,
        editingTemplate,
        loading,
        saveTemplate,
        deleteTemplate,
        addTemplatePhoto,
        deleteTemplatePhoto,
        startEditing,
        cancelEditing,
    };
};