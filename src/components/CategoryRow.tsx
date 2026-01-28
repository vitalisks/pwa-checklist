import React from 'react';
import { Trash2, Plus, X } from 'lucide-react';
import { Category } from '../types';
import { motion } from 'framer-motion';

import { useLanguage } from '../hooks/useLanguage';

interface CategoryRowProps {
    category: Category;
    onUpdateName: (id: string, name: string) => void;
    onRemove: (id: string) => void;
    onAddItem: (categoryId: string) => void;
    onUpdateItem: (categoryId: string, itemId: string, text: string) => void;
    onRemoveItem: (categoryId: string, itemId: string) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
    category,
    onUpdateName,
    onRemove,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
}) => {
    const { t } = useLanguage();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass-card !p-3"
        >
            <div className="flex items-center gap-2 mb-3 flex-nowrap">
                <input
                    type="text"
                    className="input font-semibold bg-white/5 border-transparent focus:border-accent-color h-8 flex-1"
                    value={category.name}
                    onChange={(e) => onUpdateName(category.id, e.target.value)}
                    placeholder={t('editor_cat_placeholder')}
                />
                <button
                    onClick={() => {
                        if (category.items.length === 0 || window.confirm(t('delete_confirm'))) {
                            onRemove(category.id);
                        }
                    }}
                    className="p-1.5 text-white/20 hover:text-danger-color transition-colors flex-shrink-0"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-1.5 pl-3 border-l border-white/10">
                {category.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                        <input
                            type="text"
                            className="input h-8 text-sm"
                            value={item.text}
                            onChange={(e) => onUpdateItem(category.id, item.id, e.target.value)}
                            placeholder={t('editor_item_placeholder')}
                        />
                        <button
                            onClick={() => onRemoveItem(category.id, item.id)}
                            className="p-1.5 text-white/20 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => onAddItem(category.id)}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors py-1 mt-1"
                >
                    <Plus className="w-3 h-3" /> {t('editor_add_item')}
                </button>
            </div>
        </motion.div>
    );
};

export default CategoryRow;
