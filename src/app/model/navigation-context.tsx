/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Template, Checklist } from '@/shared/config';
import { useChecklist } from './checklist-context';
import { useEditingState } from '@/features/edit-template';
import { createChecklistFromTemplate, createBlankChecklist } from '@/features/create-checklist';

interface NavigationContextType {
  activeTab: string;
  switchTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewingChecklistId: string | null;
  draftChecklist: Checklist | null;
  openChecklist: (id: string) => void;
  closeChecklist: () => void;
  createAndOpenChecklist: (template: Template) => Promise<void>;
  createAndOpenBlankChecklist: () => Promise<void>;
  saveDraftChecklist: (checklist: Checklist) => Promise<void>;
  isIdeaFlowOpen: boolean;
  openIdeaFlow: () => void;
  closeIdeaFlow: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { persistChecklist } = useChecklist();
  const { cancelEditing } = useEditingState();

  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingChecklistId, setViewingChecklistId] = useState<string | null>(null);
  const [draftChecklist, setDraftChecklist] = useState<Checklist | null>(null);
  const [isIdeaFlowOpen, setIsIdeaFlowOpen] = useState(false);

  const switchTab = useCallback((tab: string) => {
    setActiveTab(tab);
    cancelEditing();
    setViewingChecklistId(null);
    setDraftChecklist(null);
    setIsIdeaFlowOpen(false);
    setSearchQuery('');
  }, [cancelEditing]);

  const openChecklist = useCallback((id: string) => {
    setViewingChecklistId(id);
    setDraftChecklist(null);
  }, []);

  const closeChecklist = useCallback(() => {
    setViewingChecklistId(null);
    setDraftChecklist(null);
  }, []);

  const createAndOpenChecklist = useCallback(async (template: Template) => {
    const newChecklist = createChecklistFromTemplate(template);
    setDraftChecklist(newChecklist);
    setViewingChecklistId(newChecklist.id);
  }, []);

  const createAndOpenBlankChecklist = useCallback(async () => {
    const newChecklist = createBlankChecklist();
    setDraftChecklist(newChecklist);
    setViewingChecklistId(newChecklist.id);
  }, []);

  const saveDraftChecklist = useCallback(async (checklist: Checklist) => {
    await persistChecklist(checklist);
    setDraftChecklist(null);
  }, [persistChecklist]);

  const openIdeaFlow = useCallback(() => {
    setIsIdeaFlowOpen(true);
  }, []);

  const closeIdeaFlow = useCallback(() => {
    setIsIdeaFlowOpen(false);
  }, []);

  const value = useMemo(() => ({
    activeTab, switchTab,
    searchQuery, setSearchQuery,
    viewingChecklistId, draftChecklist, openChecklist, closeChecklist,
    createAndOpenChecklist, createAndOpenBlankChecklist, saveDraftChecklist,
    isIdeaFlowOpen, openIdeaFlow, closeIdeaFlow,
  }), [activeTab, searchQuery, viewingChecklistId, draftChecklist, isIdeaFlowOpen,
    switchTab, openChecklist, closeChecklist, createAndOpenChecklist, createAndOpenBlankChecklist, saveDraftChecklist, openIdeaFlow, closeIdeaFlow]);

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
