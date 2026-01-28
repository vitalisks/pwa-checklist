import React from 'react';
import { CheckCircle, Circle, CircleSlash } from 'lucide-react';
import { ChecklistItem } from '../types';
import { motion } from 'framer-motion';

import { useLanguage } from '../hooks/useLanguage';

interface ChecklistItemRowProps {
    item: ChecklistItem;
    onToggleChecked: () => void;
    onToggleSkipped: () => void;
}

const ChecklistItemRow: React.FC<ChecklistItemRowProps> = ({
    item,
    onToggleChecked,
    onToggleSkipped,
}) => {
    const { t } = useLanguage();
    const isProcessed = item.checked || !!item.skipped;

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            className={`glass-card !p-2.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${isProcessed ? 'opacity-50' : ''
                } ${item.skipped ? 'bg-white/[0.02] border-white/20' : ''}`}
            onClick={onToggleChecked}
        >
            <div className="flex items-center gap-3 flex-1">
                {item.checked ? (
                    <CheckCircle className="w-5 h-5 text-success-color shrink-0" />
                ) : item.skipped ? (
                    <CircleSlash className="w-5 h-5 text-accent-color shrink-0" />
                ) : (
                    <Circle className="w-5 h-5 text-white/10 shrink-0" />
                )}
                <div className="flex flex-col">
                    <span className={`text-sm ${item.checked ? 'line-through text-white/30' : item.skipped ? 'text-white/40 italic' : 'text-white/90'}`}>
                        {item.text}
                    </span>
                    {item.skipped && (
                        <span className="text-[9px] text-accent-color font-black uppercase tracking-widest mt-0.5">
                            {t('checklist_item_skipped')}
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleSkipped();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all border ${item.skipped
                    ? 'bg-accent-color text-white border-accent-color'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                    }`}
                title={t('checklist_skip')}
            >
                <CircleSlash className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">{t('checklist_skip')}</span>
            </button>
        </motion.div>
    );
};

export default ChecklistItemRow;
