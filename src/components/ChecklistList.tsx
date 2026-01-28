import React from 'react';
import { Checklist } from '../types';
import { motion } from 'framer-motion';
import { ListChecks, Clock, Calendar, ChevronRight, Trash2 } from 'lucide-react';

import { useLanguage } from '../hooks/useLanguage';

interface ChecklistListProps {
    checklists: Checklist[];
    onOpen: (checklist: Checklist) => void;
    onDelete: (id: string) => void;
    searchQuery: string;
}

const ChecklistList: React.FC<ChecklistListProps> = ({
    checklists,
    onOpen,
    onDelete,
    searchQuery
}) => {
    const { t, language } = useLanguage();
    const filteredChecklists = checklists.filter(c => {
        const query = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(query);
        const matchesMetadata = c.metadata?.toLowerCase().includes(query);
        const matchesItems = c.categories.some(cat =>
            cat.name.toLowerCase().includes(query) ||
            cat.items.some(item => item.text.toLowerCase().includes(query))
        );
        return matchesTitle || matchesMetadata || matchesItems;
    }).sort((a, b) => b.createdAt - a.createdAt);

    const getProgress = (checklist: Checklist) => {
        const total = checklist.categories.reduce((acc, cat) => acc + cat.items.length, 0);
        const processed = checklist.categories.reduce(
            (acc, cat) => acc + cat.items.filter(i => i.checked || i.skipped).length,
            0
        );
        return total > 0 ? Math.round((processed / total) * 100) : 0;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{t('home_active_checklists')}</h2>
            </div>

            {filteredChecklists.length === 0 ? (
                <div className="glass-card text-center py-8">
                    <p className="text-white/40 text-sm">
                        {searchQuery ? `${t('home_no_matches')} "${searchQuery}"` : t('home_active_checklists')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-2.5">
                    {filteredChecklists.map((checklist) => (
                        <motion.div
                            key={checklist.id}
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => onOpen(checklist)}
                            className="glass-card !p-3 group cursor-pointer flex items-center justify-between gap-4"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-base font-semibold group-hover:text-accent-color transition-colors line-clamp-1">
                                        {checklist.title}
                                    </h3>
                                    {checklist.status === 'completed' && (
                                        <span className="text-[9px] bg-success-color/20 text-success-color px-1.5 py-0.5 rounded uppercase font-bold">
                                            {t('done')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-white/30 uppercase tracking-wider">
                                    <span className="flex items-center gap-1">
                                        {new Date(checklist.createdAt).toLocaleDateString(
                                            language === 'es' ? 'es-ES' :
                                                language === 'lv' ? 'lv-LV' :
                                                    language === 'ru' ? 'ru-RU' : 'en-US'
                                        )}
                                    </span>
                                    <span className="flex items-center gap-1 font-bold text-white/40">
                                        {getProgress(checklist)}%
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="hidden sm:block w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${checklist.status === 'completed' ? 'bg-success-color' : 'bg-accent-color'
                                            }`}
                                        style={{ width: `${getProgress(checklist)}%` }}
                                    />
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-accent-color transition-all" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(t('delete_confirm'))) {
                                            onDelete(checklist.id);
                                        }
                                    }}
                                    className="p-1.5 text-white/0 group-hover:text-white/20 hover:text-danger-color transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChecklistList;
