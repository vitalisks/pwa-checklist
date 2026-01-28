import React, { useState } from 'react';
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
    startEditing,
    cancelEditing,
  } = useTemplates();

  const {
    checklists,
    viewingChecklist,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    toggleItem,
    openChecklist,
    closeChecklist,
  } = useChecklists();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    cancelEditing();
    closeChecklist();
    setSearchQuery('');
  };

  const handleClearData = async () => {
    await storageService.clearAll();
    window.location.reload();
  };

  const renderContent = () => {
    if (viewingChecklist) {
      return (
        <ChecklistView
          checklist={viewingChecklist}
          onToggleItem={toggleItem}
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
        return <div>Select a tab</div>;
    }
  };

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
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
};

export default App;
