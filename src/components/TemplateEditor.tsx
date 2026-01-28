import React, { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { Template, Category } from '../types';
import { AnimatePresence } from 'framer-motion';
import CategoryRow from './CategoryRow';

import { useLanguage } from '../hooks/useLanguage';
import { generateUUID } from '../utils/uuid';

interface TemplateEditorProps {
    template?: Template;
    onSave: (template: Template) => void;
    onCancel: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSave, onCancel }) => {
    const { t } = useLanguage();
    const [title, setTitle] = useState(template?.title || '');
    const [description, setDescription] = useState(template?.description || '');
    const [categories, setCategories] = useState<Category[]>(template?.categories || []);

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
                    return {
                        ...c,
                        items: [...c.items, { id: generateUUID(), text: '' }],
                    };
                }
                return c;
            })
        );
    };

    const updateItemText = (categoryId: string, itemId: string, text: string) => {
        setCategories(
            categories.map((c) => {
                if (c.id === categoryId) {
                    return {
                        ...c,
                        items: c.items.map((i) => (i.id === itemId ? { ...i, text } : i)),
                    };
                }
                return c;
            })
        );
    };

    const removeItemFromCategory = (categoryId: string, itemId: string) => {
        setCategories(
            categories.map((c) => {
                if (c.id === categoryId) {
                    return {
                        ...c,
                        items: c.items.filter((i) => i.id !== itemId),
                    };
                }
                return c;
            })
        );
    };

    const handleSave = () => {
        if (!title) return;
        const newTemplate: Template = {
            id: template?.id || generateUUID(),
            title,
            description,
            categories,
            updatedAt: Date.now(),
        };
        onSave(newTemplate);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{template ? t('editor_edit') : t('editor_new')}</h2>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="btn btn-ghost">
                        {t('editor_cancel')}
                    </button>
                    <button onClick={handleSave} className="btn btn-primary">
                        <Save className="w-4 h-4" /> {t('editor_save')}
                    </button>
                </div>
            </div>

            <div className="glass-card">
                <div className="space-y-3">
                    <div>
                        <input
                            type="text"
                            className="input font-bold text-lg"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('editor_title_placeholder')}
                        />
                    </div>
                    <div>
                        <textarea
                            className="input min-h-[60px] text-sm"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('editor_desc_placeholder')}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
                        {t('editor_cats_items_label')}
                    </h3>
                    <button onClick={addCategory} className="btn btn-ghost text-accent-color py-1">
                        <Plus className="w-4 h-4" /> {t('editor_add_cat')}
                    </button>
                </div>

                <AnimatePresence>
                    {categories.map((category) => (
                        <CategoryRow
                            key={category.id}
                            category={category}
                            onUpdateName={updateCategoryName}
                            onRemove={removeCategory}
                            onAddItem={addItemToCategory}
                            onUpdateItem={updateItemText}
                            onRemoveItem={removeItemFromCategory}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TemplateEditor;
