import React, { useState } from 'react';
import { Checklist } from '../types';
import { motion } from 'framer-motion';
import { ChevronRight, Trash2 } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

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
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t('home_active_checklists')}</h2>
      </div>

      {filteredChecklists.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-secondary text-sm">
            {searchQuery ? `${t('home_no_matches')} "${searchQuery}"` : t('home_no_checklists')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredChecklists.map((checklist) => (
            <motion.div
              key={checklist.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onOpen(checklist)}
              className="card card-hover cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold truncate">
                      {checklist.title}
                    </h3>
                    {checklist.status === 'completed' && (
                      <span className="badge badge-success">
                        {t('done')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 section-label">
                    <span>
                      {new Date(checklist.createdAt).toLocaleDateString(
                        language === 'es' ? 'es-ES' :
                        language === 'lv' ? 'lv-LV' :
                        language === 'ru' ? 'ru-RU' : 'en-US'
                      )}
                    </span>
                    <span className="font-semibold text-accent">
                      {getProgress(checklist)}%
                    </span>
                  </div>
                  <div className="mt-2 progress-track">
                    <div
                      className={`progress-fill ${checklist.status === 'completed' ? 'progress-fill-done' : 'progress-fill-active'}`}
                      style={{ width: `${getProgress(checklist)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ChevronRight size={16} className="text-tertiary" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(checklist.id);
                    }}
                    className="btn-icon btn-icon-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t('delete_confirm_title')}
          message={t('delete_confirm_msg')}
          confirmLabel={t('delete_confirm_action')}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default ChecklistList;