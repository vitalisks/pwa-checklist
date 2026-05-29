import React, { useCallback } from 'react';
import type { Template, Checklist } from '@/shared/config';
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
  const { editingTemplate, cancelEditing, finishEditing, startEditing } = useEditingState();
  const { saveTemplate } = useTemplate();
  const { checklists, convertChecklistToTemplate } = useChecklist();
  const { activeTab, viewingChecklistId, draftChecklist, isIdeaFlowOpen, closeIdeaFlow, closeChecklist, saveDraftChecklist } = useNavigation();

  const viewingChecklist = draftChecklist ?? checklists.find(c => c.id === viewingChecklistId) ?? null;

  const handleSaveTemplate = useCallback(async (template: Template) => {
    await saveTemplate(template);
    finishEditing();
  }, [saveTemplate, finishEditing]);

  const handleIdeaFlowSave = useCallback(async (template: Template) => {
    await saveTemplate(template);
    closeIdeaFlow();
  }, [saveTemplate, closeIdeaFlow]);

  const handleSaveAsTemplate = useCallback(async (checklist: Checklist) => {
    const template = convertChecklistToTemplate(checklist);
    closeChecklist();
    startEditing(template);
  }, [convertChecklistToTemplate, closeChecklist, startEditing]);

  const handleSaveChecklist = useCallback(async (checklist: Checklist) => {
    await saveDraftChecklist(checklist);
  }, [saveDraftChecklist]);

  const key = activeTab + (editingTemplate !== undefined ? '-editing' : '') + (viewingChecklistId !== null ? '-viewing-' + viewingChecklistId : '') + (isIdeaFlowOpen ? '-idea' : '');

  return (
    <Layout>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          {viewingChecklist ? (
            <ChecklistView checklist={viewingChecklist} onSaveAsTemplate={handleSaveAsTemplate} defaultEdit={!!draftChecklist} onSaveChecklist={draftChecklist ? handleSaveChecklist : undefined} />
          ) : isIdeaFlowOpen ? (
            <IdeaFlowView onSave={handleIdeaFlowSave} />
          ) : editingTemplate !== undefined ? (
            <TemplateEditor
              template={editingTemplate || undefined}
              onSave={handleSaveTemplate}
              onCancel={cancelEditing}
            />
          ) : activeTab === 'home' ? (
            <HomeView />
          ) : activeTab === 'templates' ? (
            <TemplateList />
          ) : activeTab === 'settings' ? (
            <SettingsView />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
};

export default AppRoutes;
