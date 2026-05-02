import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Play } from 'lucide-react';
import { Template } from '../types';
import { motion } from 'framer-motion';
import ConfirmDialog from './ConfirmDialog';

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
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('templates_title')}</h2>
          <button onClick={onAdd} className="btn btn-primary py-1.5 px-3">
            <Plus size={16} /> {t('templates_new')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full card text-center py-8">
            <p className="text-secondary text-sm mb-3">
              {searchQuery ? `${t('home_no_matches')} "${searchQuery}"` : t('home_no_templates')}
            </p>
            <button onClick={onAdd} className="btn btn-ghost text-accent py-1">
              <Plus size={16} /> {t('home_add_template')}
            </button>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card card-hover flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-semibold mb-1">{template.title}</h3>
                <p className="text-sm text-secondary mb-3 line-clamp-1">
                  {template.description || t('templates_no_desc')}
                </p>
                <div className="section-label">
                  {template.categories.reduce((acc, cat) => acc + cat.items.length, 0)} {t('templates_items')} &middot; {template.categories.length} {t('templates_categories')}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-subtle">
                <button
                  onClick={() => onCreateChecklist(template)}
                  className="btn btn-primary h-8 px-3 text-xs"
                >
                  <Play size={12} /> {t('templates_use')}
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => onEdit(template)}
                    className="btn-icon"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(template.id)}
                    className="btn-icon btn-icon-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

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

export default TemplateList;