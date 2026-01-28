import React from 'react';
import { Plus, Edit2, Trash2, Play } from 'lucide-react';
import { Template } from '../types';
import { motion } from 'framer-motion';

import { useLanguage } from '../hooks/useLanguage';

interface TemplateListProps {
    templates: Template[];
    onAdd: () => void;
    onEdit: (template: Template) => void;
    onDelete: (id: string) => void;
    onCreateChecklist: (template: Template) => void;
    searchQuery: string;
    hideHeader?: boolean;
}

const TemplateList: React.FC<TemplateListProps> = ({
    templates,
    onAdd,
    onEdit,
    onDelete,
    onCreateChecklist,
    searchQuery,
    hideHeader = false
}) => {
    const { t } = useLanguage();
    const filteredTemplates = templates.filter(t => {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description.toLowerCase().includes(query);
        const matchesItems = t.categories.some(cat =>
            cat.name.toLowerCase().includes(query) ||
            cat.items.some(item => item.text.toLowerCase().includes(query))
        );
        return matchesTitle || matchesDesc || matchesItems;
    });

    return (
        <div className="space-y-4">
            {!hideHeader && (
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{t('templates_title')}</h2>
                    <button onClick={onAdd} className="btn btn-primary py-1.5 px-3">
                        <Plus className="w-4 h-4" /> {t('templates_new')}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.length === 0 ? (
                    <div className="col-span-full glass-card text-center py-8">
                        <p className="text-white/40 text-sm mb-3">
                            {searchQuery ? `${t('home_no_matches')} "${searchQuery}"` : t('home_no_templates')}
                        </p>
                        <button onClick={onAdd} className="btn btn-ghost text-accent-color py-1">
                            <Plus className="w-4 h-4" /> {t('home_add_template')}
                        </button>
                    </div>
                ) : (
                    filteredTemplates.map((template) => (
                        <motion.div
                            key={template.id}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card !p-3 flex flex-col justify-between"
                        >
                            <div>
                                <h3 className="text-base font-semibold mb-1">{template.title}</h3>
                                <p className="text-xs text-white/40 mb-3 line-clamp-1">
                                    {template.description || t('templates_no_desc')}
                                </p>
                                <div className="text-[10px] uppercase tracking-wider text-white/20">
                                    {template.categories.reduce((acc, cat) => acc + cat.items.length, 0)} {t('templates_items')} • {template.categories.length} {t('templates_categories')}
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                                <button
                                    onClick={() => onEdit(template)}
                                    className="p-1.5 text-white/20 hover:text-white transition-colors"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onCreateChecklist(template)}
                                        className="btn btn-primary h-8 px-3 text-xs"
                                    >
                                        <Play className="w-3 h-3" /> {t('templates_use')}
                                    </button>
                                    <button
                                        onClick={() => onDelete(template.id)}
                                        className="p-1.5 text-white/20 hover:text-danger-color transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TemplateList;
