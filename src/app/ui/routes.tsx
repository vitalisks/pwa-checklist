import React, { useState, useCallback, useMemo } from 'react';
import type { Template, Checklist } from '@/shared/config';
import { useAppData } from '../model/use-app-data';
import { useEditTemplate } from '@/features/edit-template';
import { Layout } from '@/widgets/layout';
import { HomeView } from '@/widgets/home-view';
import { TemplateList } from '@/widgets/template-list';
import { TemplateEditor } from '@/widgets/template-editor';
import { ChecklistView } from '@/widgets/checklist-view';
import { SettingsView } from '@/widgets/settings-view';
import { IdeaFlowView } from '@/features/idea-flow';
import { motion, AnimatePresence } from 'framer-motion';

const AppRoutes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingChecklist, setViewingChecklist] = useState<Checklist | null>(null);
  const [showIdeaFlow, setShowIdeaFlow] = useState(false);

  const {
    templates,
    checklists,
    saveTemplate,
    deleteTemplate,
    addTemplatePhoto,
    deleteTemplatePhoto,
    createChecklist,
    updateChecklistTitle,
    deleteChecklist,
    toggleItem,
    addChecklistPhoto,
    deleteChecklistPhoto,
    handleExport,
    handleImport,
    handleClearData,
  } = useAppData();

  const { editingState, startEditing, cancelEditing, finishEditing } = useEditTemplate();

  const startIdeaFlow = useCallback(() => setShowIdeaFlow(true), []);
  const closeIdeaFlow = useCallback(() => setShowIdeaFlow(false), []);

  const handleIdeaFlowSave = useCallback(async (template: Template) => {
    await saveTemplate(template);
    setShowIdeaFlow(false);
  }, [saveTemplate]);

  const handleIdeaFlowEdit = useCallback((template: Template) => {
    setShowIdeaFlow(false);
    startEditing(template);
  }, [startEditing]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    cancelEditing();
    setViewingChecklist(null);
    setShowIdeaFlow(false);
    setSearchQuery('');
  }, [cancelEditing]);

  const handleCreateChecklist = useCallback(async (template: Template) => {
    const newChecklist = await createChecklist(template);
    if (newChecklist) setViewingChecklist(newChecklist);
  }, [createChecklist]);

  const handleOpenChecklist = useCallback((checklist: Checklist) => {
    setViewingChecklist(checklist);
  }, []);

  const handleCloseChecklist = useCallback(() => {
    setViewingChecklist(null);
  }, []);

  const handleDeleteChecklist = useCallback(async (id: string) => {
    await deleteChecklist(id);
    if (viewingChecklist?.id === id) {
      setViewingChecklist(null);
    }
  }, [deleteChecklist, viewingChecklist]);

  const handleSaveTemplate = useCallback(async (template: Template) => {
    await saveTemplate(template);
    finishEditing();
  }, [saveTemplate, finishEditing]);

  const editingTemplate = editingState.mode !== 'idle' ? editingState.template : undefined;

  const memoizedContent = useMemo(() => {
    if (viewingChecklist) {
      return (
        <ChecklistView
          checklist={viewingChecklist}
          onUpdateTitle={updateChecklistTitle}
          onToggleItem={toggleItem}
          onAddPhoto={addChecklistPhoto}
          onDeletePhoto={deleteChecklistPhoto}
          onDelete={handleDeleteChecklist}
          onBack={handleCloseChecklist}
        />
      );
    }

    if (showIdeaFlow) {
      return (
        <IdeaFlowView
          onSave={handleIdeaFlowSave}
          onEdit={handleIdeaFlowEdit}
          onClose={closeIdeaFlow}
        />
      );
    }

    if (editingTemplate !== undefined) {
      return (
        <TemplateEditor
          template={editingTemplate || undefined}
          onSave={handleSaveTemplate}
          onCancel={cancelEditing}
          onAddPhoto={addTemplatePhoto}
          onDeletePhoto={deleteTemplatePhoto}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            templates={templates}
            checklists={checklists}
            searchQuery={searchQuery}
            onAddTemplate={() => startEditing(null)}
            onEditTemplate={startEditing}
            onDeleteTemplate={deleteTemplate}
            onCreateChecklist={handleCreateChecklist}
            onOpenChecklist={handleOpenChecklist}
            onDeleteChecklist={deleteChecklist}
          />
        );
      case 'templates':
        return (
          <TemplateList
            templates={templates}
            onAdd={() => startEditing(null)}
            onEdit={startEditing}
            onDelete={deleteTemplate}
            onCreateChecklist={handleCreateChecklist}
            searchQuery={searchQuery}
            onStartFromIdea={startIdeaFlow}
          />
        );
      case 'settings':
        return (
          <SettingsView
            onClearData={handleClearData}
            onExport={handleExport}
            onImport={handleImport}
          />
        );
      default:
        return null;
    }
  }, [
    viewingChecklist, editingTemplate, showIdeaFlow, activeTab,
    templates, checklists, searchQuery,
    updateChecklistTitle, toggleItem, addChecklistPhoto, deleteChecklistPhoto,
    handleDeleteChecklist, handleCloseChecklist,
    handleSaveTemplate, cancelEditing, addTemplatePhoto, deleteTemplatePhoto,
    startEditing, deleteTemplate, handleCreateChecklist, handleOpenChecklist,
    handleClearData, handleExport, handleImport,
    handleIdeaFlowSave, handleIdeaFlowEdit, closeIdeaFlow, startIdeaFlow,
  ]);

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onSearch={setSearchQuery}
      searchQuery={searchQuery}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (editingTemplate !== undefined ? '-editing' : '') + (viewingChecklist ? '-viewing' : '') + (showIdeaFlow ? '-idea' : '')}
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
