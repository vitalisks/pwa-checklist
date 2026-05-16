import React, { useState } from 'react';
import type { Checklist } from '@/shared/config';
import { motion } from 'framer-motion';
import { ChevronRight, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';
import { useChecklist } from '@/app/model/checklist-context';
import { useNavigation } from '@/app/model/navigation-context';

type Filter = 'all' | 'active' | 'completed';

interface ChecklistListProps {
  searchQuery?: string;
}

const ChecklistList: React.FC<ChecklistListProps> = ({
  searchQuery: searchQueryProp,
}) => {
  const { t, language } = useTranslation();
  const { checklists, deleteChecklist } = useChecklist();
  const { openChecklist, searchQuery: navSearchQuery } = useNavigation();

  const searchQuery = searchQueryProp ?? navSearchQuery;
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const filteredChecklists = checklists
    .filter(c => {
      const query = searchQuery.toLowerCase();
      if (query) {
        const matchesTitle = c.title.toLowerCase().includes(query);
        const matchesTemplate = c.templateTitle?.toLowerCase().includes(query);
        const matchesMetadata = c.metadata?.toLowerCase().includes(query);
        const matchesItems = c.categories.some(cat =>
          cat.name.toLowerCase().includes(query) ||
          cat.items.some(item => item.text.toLowerCase().includes(query))
        );
        if (!matchesTitle && !matchesTemplate && !matchesMetadata && !matchesItems) return false;
      }
      if (filter === 'active') return c.status !== 'completed';
      if (filter === 'completed') return c.status === 'completed';
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

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
      deleteChecklist(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: t.filter.all },
    { key: 'active', label: t.filter.unfinished },
    { key: 'completed', label: t.filter.done },
  ];

  const locale =
    language === 'lv' ? 'lv-LV' :
    language === 'ru' ? 'ru-RU' :
    language === 'es' ? 'es-ES' : 'en-US';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t.home.activeChecklists}</h2>
        <div className="flex gap-1.5">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2 py-1 rounded-full text-2xs font-semibold border transition-colors ${
                filter === key
                  ? 'bg-accent-subtle text-accent border-accent'
                  : 'bg-surface-1 text-tertiary border-subtle hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredChecklists.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-secondary text-sm">
            {searchQuery ? `${t.home.noMatches} "${searchQuery}"` : t.home.noChecklists}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredChecklists.map((checklist) => {
            const progress = getProgress(checklist);
            return (
              <motion.div
                key={checklist.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openChecklist(checklist.id)}
                className="card card-hover cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {checklist.templateTitle && (
                      <p className="text-2xs font-semibold text-accent tracking-wider uppercase mb-0.5">
                        {checklist.templateTitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold flex-1 min-w-0 truncate">
                        {checklist.title}
                      </h3>
                      {checklist.status === 'completed' && (
                        <span className="badge badge-success shrink-0">
                          {t.common.done}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xs text-tertiary">
                        {new Date(checklist.createdAt).toLocaleDateString(locale)}
                      </span>
                      <span className="text-2xs font-semibold text-accent">
                        {progress}%
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${checklist.status === 'completed' ? 'progress-fill-done' : 'progress-fill-active'}`}
                        style={{ width: `${progress}%` }}
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
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t.common.delete.confirmTitle}
          message={t.common.delete.confirmMsg}
          confirmLabel={t.common.delete.confirmAction}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

export default ChecklistList;
