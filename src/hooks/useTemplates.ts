import { useState, useEffect } from 'react';
import { Template } from '../types';
import { storageService } from '../services/storage';
import { migrateFromLocalStorage } from '../services/migration';

export const useTemplates = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<Template | null | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                // Run migration if needed
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
            const exists = templates.find((t) => t.id === template.id);

            if (exists) {
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
            await storageService.deleteTemplate(id);
            setTemplates(templates.filter((t) => t.id !== id));
        } catch (error) {
            console.error('Failed to delete template:', error);
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
        startEditing,
        cancelEditing,
    };
};
