import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Play, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import { ConfirmDialog } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';
import { useTemplate } from '@/app/model/template-context';
import { useEditingState } from '@/features/edit-template';
import { useNavigation } from '@/app/model/navigation-context';
import { QuickShareButton } from '@/features/share';

interface TemplateListProps {
  searchQuery?: string;
  hideHeader?: boolean;
}

const TemplateList: React.FC<TemplateListProps> = ({
  searchQuery: searchQueryProp,
  hideHeader = false,
}) => {
  const { t } = useTranslation();
  const { templates, deleteTemplate } = useTemplate();
  const { startEditing } = useEditingState();
  const { searchQuery: navSearchQuery, createAndOpenChecklist, openIdeaFlow } = useNavigation();

  const searchQuery = searchQueryProp ?? navSearchQuery;

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
      deleteTemplate(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{t.templates.title}</h2>
          <div className="flex items-center gap-2">
            <button onClick={openIdeaFlow} className="btn btn-ghost py-1.5 px-3 text-accent border border-subtle">
              <Lightbulb size={16} /> {t.idea.button}
            </button>
            <button onClick={() => startEditing(null)} className="btn btn-primary py-1.5 px-3">

              <Plus size={16} /> {t.templates.new}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full card text-center py-8">
            <p className="text-secondary text-sm mb-3">
              {searchQuery ? `${t.home.noMatches} "${searchQuery}"` : t.home.noTemplates}
            </p>
            <button onClick={() => startEditing(null)} className="btn btn-ghost text-accent py-1">
              <Plus size={16} /> {t.home.addTemplate}
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
                  {template.description || t.templates.noDesc}
                </p>
                <div className="section-label">
                  {template.categories.reduce((acc, cat) => acc + cat.items.length, 0)} {t.templates.items} &middot; {template.categories.length} {t.templates.categories}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-subtle">
                <button
                  onClick={() => createAndOpenChecklist(template)}
                  className="btn btn-primary h-8 px-3 text-xs"
                >
                  <Play size={12} /> {t.templates.use}
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <QuickShareButton item={template} itemType="template" />
                  <button
                    onClick={() => startEditing(template)}
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

export default TemplateList;
