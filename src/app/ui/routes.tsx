import React, { useCallback, useMemo } from 'react';
import type { Template } from '@/shared/config';
import { useTemplate } from '@/app/model/template-context';
import { useChecklist } from '@/app/model/checklist-context';
import { useEditingState } from '@/features/edit-template';
import { useNavigation } from '@/app/model/navigation-context';
import { Layout } from '@/widgets/layout';
import { HomeView } from '@/widgets/home-view';
import { TemplateList } from '@/widgets/template-list';
import { TemplateEditor } from '@/widgets/template-editor';
import { ChecklistView } from '@/widgets/checklist-view';
import { SettingsView } from '@/widgets/settings-view';
import { IdeaFlowView } from '@/features/idea-flow';
import { motion, AnimatePresence } from 'framer-motion';

const AppRoutes: React.FC = () => {
  const { editingTemplate, cancelEditing, finishEditing } = useEditingState();
  const { saveTemplate } = useTemplate();
  const { checklists } = useChecklist();
  const { activeTab, viewingChecklistId, isIdeaFlowOpen, closeIdeaFlow } = useNavigation();

  const viewingChecklist = checklists.find(c => c.id === viewingChecklistId) ?? null;

  const handleSaveTemplate = useCallback(async (template: Template) => {
    await saveTemplate(template);
    finishEditing();
  }, [saveTemplate, finishEditing]);

  const handleIdeaFlowSave = useCallback(async (template: Template) => {
    await saveTemplate(template);
    closeIdeaFlow();
  }, [saveTemplate, closeIdeaFlow]);

  const memoizedContent = useMemo(() => {
    if (viewingChecklist) {
      return <ChecklistView checklist={viewingChecklist} />;
    }

    if (isIdeaFlowOpen) {
      return <IdeaFlowView onSave={handleIdeaFlowSave} />;
    }

    if (editingTemplate !== undefined) {
      return (
        <TemplateEditor
          template={editingTemplate || undefined}
          onSave={handleSaveTemplate}
          onCancel={cancelEditing}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'templates':
        return <TemplateList />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  }, [
    viewingChecklist, isIdeaFlowOpen, editingTemplate, activeTab,
    handleSaveTemplate, handleIdeaFlowSave, cancelEditing,
  ]);

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (editingTemplate !== undefined ? '-editing' : '') + (viewingChecklist ? '-viewing' : '') + (isIdeaFlowOpen ? '-idea' : '')}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {memoizedContent}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
};

export default AppRoutes;
