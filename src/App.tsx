import React, { useState, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import TemplateList from './components/TemplateList';
import TemplateEditor from './components/TemplateEditor';
import ChecklistView from './components/ChecklistView';
import HomeView from './components/HomeView';
import SettingsView from './components/SettingsView';
import { useTemplates } from './hooks/useTemplates';
import { useChecklists } from './hooks/useChecklists';
import { storageService } from './services/storage';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    templates,
    editingTemplate,
    saveTemplate,
    deleteTemplate,
    addTemplatePhoto,
    deleteTemplatePhoto,
    startEditing,
    cancelEditing,
  } = useTemplates();

  const {
    checklists,
    viewingChecklist,
    createChecklist,
    updateChecklist,
    updateChecklistTitle,
    deleteChecklist,
    toggleItem,
    addChecklistPhoto,
    deleteChecklistPhoto,
    openChecklist,
    closeChecklist,
  } = useChecklists();

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    cancelEditing();
    closeChecklist();
    setSearchQuery('');
  }, [cancelEditing, closeChecklist]);

  const handleClearData = useCallback(async () => {
    await storageService.clearAll();
    window.location.reload();
  }, []);

  const memoizedContent = useMemo(() => {
    if (viewingChecklist) {
      return (
        <ChecklistView
          checklist={viewingChecklist}
          onUpdateTitle={updateChecklistTitle}
          onToggleItem={toggleItem}
          onAddPhoto={addChecklistPhoto}
          onDeletePhoto={deleteChecklistPhoto}
          onDelete={deleteChecklist}
          onBack={closeChecklist}
        />
      );
    }

    if (editingTemplate !== undefined) {
      return (
        <TemplateEditor
          template={editingTemplate || undefined}
          onSave={saveTemplate}
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
            onCreateChecklist={createChecklist}
            onOpenChecklist={openChecklist}
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
            onCreateChecklist={createChecklist}
            searchQuery={searchQuery}
          />
        );
      case 'settings':
        return <SettingsView onClearData={handleClearData} />;
      default:
        return null;
    }
  }, [viewingChecklist, editingTemplate, activeTab, templates, checklists, searchQuery, updateChecklistTitle, toggleItem, addChecklistPhoto, deleteChecklistPhoto, deleteChecklist, closeChecklist, saveTemplate, cancelEditing, addTemplatePhoto, deleteTemplatePhoto, startEditing, handleClearData]);

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onSearch={setSearchQuery}
      searchQuery={searchQuery}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (editingTemplate !== undefined ? '-editing' : '') + (viewingChecklist ? '-viewing' : '')}
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

export default App;