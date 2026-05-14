import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Template } from '@/shared/config';
import { useChecklist } from './checklist-context';
import { useEditingState } from '@/features/edit-template';

interface NavigationContextType {
  activeTab: string;
  switchTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewingChecklistId: string | null;
  openChecklist: (id: string) => void;
  closeChecklist: () => void;
  createAndOpenChecklist: (template: Template) => Promise<void>;
  isIdeaFlowOpen: boolean;
  openIdeaFlow: () => void;
  closeIdeaFlow: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { createChecklist } = useChecklist();
  const { cancelEditing } = useEditingState();

  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingChecklistId, setViewingChecklistId] = useState<string | null>(null);
  const [isIdeaFlowOpen, setIsIdeaFlowOpen] = useState(false);

  const switchTab = useCallback((tab: string) => {
    setActiveTab(tab);
    cancelEditing();
    setViewingChecklistId(null);
    setIsIdeaFlowOpen(false);
    setSearchQuery('');
  }, [cancelEditing]);

  const openChecklist = useCallback((id: string) => {
    setViewingChecklistId(id);
  }, []);

  const closeChecklist = useCallback(() => {
    setViewingChecklistId(null);
  }, []);

  const createAndOpenChecklist = useCallback(async (template: Template) => {
    const newChecklist = await createChecklist(template);
    if (newChecklist) {
      setViewingChecklistId(newChecklist.id);
    }
  }, [createChecklist]);

  const openIdeaFlow = useCallback(() => {
    setIsIdeaFlowOpen(true);
  }, []);

  const closeIdeaFlow = useCallback(() => {
    setIsIdeaFlowOpen(false);
  }, []);

  const value = useMemo(() => ({
    activeTab, switchTab,
    searchQuery, setSearchQuery,
    viewingChecklistId, openChecklist, closeChecklist,
    createAndOpenChecklist,
    isIdeaFlowOpen, openIdeaFlow, closeIdeaFlow,
  }), [activeTab, searchQuery, viewingChecklistId, isIdeaFlowOpen,
    switchTab, openChecklist, closeChecklist, createAndOpenChecklist, openIdeaFlow, closeIdeaFlow]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export function useNavigation(): NavigationContextType {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within a NavigationProvider');
  return ctx;
}
