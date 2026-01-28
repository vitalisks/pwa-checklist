import { useState, useEffect } from 'react';
import { Checklist, Template } from '../types';
import { storageService } from '../services/storage';
import { generateUUID } from '../utils/uuid';

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
                title: template.title,
                status: 'active',
                createdAt: Date.now(),
                metadata: template.description,
                categories: template.categories.map((cat) => ({
                    id: cat.id,
                    name: cat.name,
                    items: cat.items.map((i) => ({
                        id: i.id,
                        text: i.text,
                        checked: false,
                        skipped: false,
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

    const deleteChecklist = async (id: string) => {
        try {
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

    const openChecklist = (checklist: Checklist) => setViewingChecklist(checklist);
    const closeChecklist = () => setViewingChecklist(null);

    return {
        checklists,
        viewingChecklist,
        loading,
        createChecklist,
        updateChecklist,
        deleteChecklist,
        toggleItem,
        openChecklist,
        closeChecklist,
    };
};
