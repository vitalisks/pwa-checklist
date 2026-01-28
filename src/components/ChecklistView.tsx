import React, { useMemo } from 'react';
import { ChevronLeft, CheckCircle, Trash2 } from 'lucide-react';
import { Checklist } from '../types';
import { motion } from 'framer-motion';
import ChecklistProgressBar from './ChecklistProgressBar';
import ChecklistItemRow from './ChecklistItemRow';

import { useLanguage } from '../hooks/useLanguage';

interface ChecklistViewProps {
    checklist: Checklist;
    onToggleItem: (checklist: Checklist, categoryId: string, itemId: string, field: 'checked' | 'skipped') => void;
    onDelete: (id: string) => void;
    onBack: () => void;
}

const ChecklistView: React.FC<ChecklistViewProps> = ({
    checklist,
    onToggleItem,
    onDelete,
    onBack,
}) => {
    const { t, language } = useLanguage();
    const { totalItems, processedItems, progress } = useMemo(() => {
        const total = checklist.categories.reduce((acc, cat) => acc + cat.items.length, 0);
        const processed = checklist.categories.reduce(
            (acc, cat) => acc + cat.items.filter((i) => i.checked || i.skipped).length,
            0
        );
        return {
            totalItems: total,
            processedItems: processed,
            progress: total > 0 ? (processed / total) * 100 : 0,
        };
    }, [checklist]);

    const isCompleted = progress === 100 && checklist.status !== 'completed';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="btn btn-ghost !p-1 hover:text-accent-color transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={() => {
                        if (window.confirm(t('delete_confirm'))) {
                            onDelete(checklist.id);
                        }
                    }}
                    className="p-1.5 text-white/20 hover:text-danger-color transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="glass-card !p-3">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h2 className="text-xl font-bold">{checklist.title}</h2>
                        <p className="text-white/40 text-[10px] uppercase tracking-wider">
                            {new Date(checklist.createdAt).toLocaleDateString(
                                language === 'lv' ? 'lv-LV' :
                                    language === 'ru' ? 'ru-RU' : 'en-US'
                            )}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-accent-color">{Math.round(progress)}%</div>
                    </div>
                </div>
                <ChecklistProgressBar progress={progress} />
            </div>

            <div className="space-y-4">
                {checklist.categories.map((category) => (
                    <div key={category.id} className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 px-1">
                            {category.name}
                        </h3>
                        <div className="space-y-1.5">
                            {category.items.map((item) => (
                                <ChecklistItemRow
                                    key={item.id}
                                    item={item}
                                    onToggleChecked={() => onToggleItem(checklist, category.id, item.id, 'checked')}
                                    onToggleSkipped={() => onToggleItem(checklist, category.id, item.id, 'skipped')}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {isCompleted && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card bg-success-color/10 border-success-color/20 text-center py-8"
                >
                    <CheckCircle className="w-12 h-12 text-success-color mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">{t('checklist_complete')}</h3>
                    <p className="text-white/60 mb-6">{t('checklist_done_msg')}</p>
                    <button onClick={onBack} className="btn btn-primary bg-success-color hover:bg-success-color/80">
                        {t('checklist_back')}
                    </button>
                </motion.div>
            )}
        </div>
    );
};

export default ChecklistView;
