import { useState, useEffect } from 'react';
import { Checklist, Template, ChecklistPhoto } from '../types';
import { storageService } from '../services/storage';
import { generateUUID } from '../utils/uuid';
import { compressImage } from '../utils/image';

export const useChecklists = () => {
    const [checklists, setChecklists] = useState<Checklist[]>([]);
    const [viewingChecklist, setViewingChecklist] = useState<Checklist | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadChecklists = async () => {
            try {
                const data = await storageService.getChecklists();
                setChecklists(data);
            } catch (error) {
                console.error('Failed to load checklists:', error);
            } finally {
                setLoading(false);
            }
        };
        loadChecklists();
    }, []);

    const createChecklist = async (template: Template) => {
        try {
            const newChecklist: Checklist = {
                id: generateUUID(),
                templateId: template.id,
                templateTitle: template.title,
                title: '',
                status: 'active',
                createdAt: Date.now(),
                metadata: template.description,
                categories: template.categories.map((cat) => ({
                    id: cat.id,
                    name: cat.name,
                    items: cat.items.map((i) => ({
                        id: i.id,
                        text: i.text,
                        description: i.description || '',
                        checked: false,
                        skipped: false,
                        photoIds: [],
                        guidePhotoIds: i.photoIds || [],
                    })),
                })),
            };

            await storageService.addChecklist(newChecklist);
            setChecklists([...checklists, newChecklist]);
            setViewingChecklist(newChecklist);
            return newChecklist;
        } catch (error) {
            console.error('Failed to create checklist:', error);
            return null;
        }
    };

    const updateChecklist = async (checklist: Checklist) => {
        try {
            await storageService.updateChecklist(checklist);
            setChecklists(checklists.map((c) => (c.id === checklist.id ? checklist : c)));

            if (viewingChecklist?.id === checklist.id) {
                setViewingChecklist(checklist);
            }
        } catch (error) {
            console.error('Failed to update checklist:', error);
        }
    };

    const updateChecklistTitle = async (checklist: Checklist, newTitle: string) => {
        const updated = { ...checklist, title: newTitle };
        try {
            await storageService.updateChecklist(updated);
            setChecklists(checklists.map((c) => (c.id === checklist.id ? updated : c)));

            if (viewingChecklist?.id === checklist.id) {
                setViewingChecklist(updated);
            }
        } catch (error) {
            console.error('Failed to update checklist title:', error);
        }
    };

    const deleteChecklist = async (id: string) => {
        try {
            const checklist = checklists.find(c => c.id === id);
            if (checklist) {
                for (const cat of checklist.categories) {
                    for (const item of cat.items) {
                        for (const photoId of item.photoIds || []) {
                            await storageService.deletePhoto(photoId);
                        }
                    }
                }
            }

            await storageService.deleteChecklist(id);
            setChecklists(checklists.filter((c) => c.id !== id));

            if (viewingChecklist?.id === id) {
                setViewingChecklist(null);
            }
        } catch (error) {
            console.error('Failed to delete checklist:', error);
        }
    };

    const toggleItem = (checklist: Checklist, categoryId: string, itemId: string, field: 'checked' | 'skipped') => {
        const totalItems = checklist.categories.reduce((acc, cat) => acc + cat.items.length, 0);
        const newCategories = checklist.categories.map(cat => {
            if (cat.id === categoryId) {
                return {
                    ...cat,
                    items: cat.items.map(item => {
                        if (item.id === itemId) {
                            const newItem = { ...item };
                            if (field === 'checked') {
                                newItem.checked = !item.checked;
                                if (newItem.checked) newItem.skipped = false;
                            } else {
                                newItem.skipped = !item.skipped;
                                if (newItem.skipped) newItem.checked = false;
                            }
                            return newItem;
                        }
                        return item;
                    })
                };
            }
            return cat;
        });

        const newProcessedCount = newCategories.reduce(
            (acc, cat) => acc + cat.items.filter(i => i.checked || i.skipped).length,
            0
        );

        const updatedChecklist: Checklist = {
            ...checklist,
            categories: newCategories,
            status: newProcessedCount === totalItems ? 'completed' : 'active'
        };

        updateChecklist(updatedChecklist);
    };

    const addChecklistPhoto = async (checklist: Checklist, categoryId: string, itemId: string, file: File) => {
        try {
            const photoId = `cl_${itemId}_${generateUUID()}`;
            const dataUrl = await compressImage(file);
            const photo: ChecklistPhoto = { itemId: photoId, dataUrl, updatedAt: Date.now() };
            await storageService.setPhoto(photo);

            const newCategories = checklist.categories.map(cat => {
                if (cat.id === categoryId) {
                    return {
                        ...cat,
                        items: cat.items.map(item =>
                            item.id === itemId
                                ? { ...item, photoIds: [...(item.photoIds || []), photoId] }
                                : item
                        )
                    };
                }
                return cat;
            });

            const updatedChecklist = { ...checklist, categories: newCategories };
            await updateChecklist(updatedChecklist);
        } catch (error) {
            console.error('Failed to save photo:', error);
        }
    };

    const deleteChecklistPhoto = async (checklist: Checklist, categoryId: string, itemId: string, photoId: string) => {
        try {
            await storageService.deletePhoto(photoId);

            const newCategories = checklist.categories.map(cat => {
                if (cat.id === categoryId) {
                    return {
                        ...cat,
                        items: cat.items.map(item =>
                            item.id === itemId
                                ? { ...item, photoIds: (item.photoIds || []).filter(id => id !== photoId) }
                                : item
                        )
                    };
                }
                return cat;
            });

            const updatedChecklist = { ...checklist, categories: newCategories };
            await updateChecklist(updatedChecklist);
        } catch (error) {
            console.error('Failed to delete photo:', error);
        }
    };

    const openChecklist = (checklist: Checklist) => setViewingChecklist(checklist);
    const closeChecklist = () => setViewingChecklist(null);

    return {
        checklists,
        viewingChecklist,
        loading,
        createChecklist,
        updateChecklist,
        updateChecklistTitle,
        deleteChecklist,
        toggleItem,
        addChecklistPhoto,
        deleteChecklistPhoto,
        openChecklist,
        closeChecklist,
    };
};