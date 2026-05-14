import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Template } from '@/shared/config';

export interface EditingState {
  mode: 'idle' | 'creating' | 'editing';
  template: Template | null;
}

interface EditingStateContextType {
  editingState: EditingState;
  editingTemplate: Template | undefined;
  isEditing: boolean;
  startEditing: (template: Template | null) => void;
  cancelEditing: () => void;
  finishEditing: () => void;
}

const EditingStateContext = createContext<EditingStateContextType | undefined>(undefined);

export const EditingStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [editingState, setEditingState] = useState<EditingState>({
    mode: 'idle',
    template: null,
  });

  const startEditing = useCallback((template: Template | null) => {
    setEditingState({
      mode: template ? 'editing' : 'creating',
      template,
    });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingState({ mode: 'idle', template: null });
  }, []);

  const finishEditing = useCallback(() => {
    setEditingState({ mode: 'idle', template: null });
  }, []);

  const editingTemplate = editingState.mode !== 'idle' ? editingState.template : undefined;
  const isEditing = editingState.mode !== 'idle';

  const value = useMemo(() => ({
    editingState,
    editingTemplate,
    isEditing,
    startEditing,
    cancelEditing,
    finishEditing,
  }), [editingState, editingTemplate, isEditing, startEditing, cancelEditing, finishEditing]);

  return (
    <EditingStateContext.Provider value={value}>
      {children}
    </EditingStateContext.Provider>
  );
};

export function useEditingState(): EditingStateContextType {
  const ctx = useContext(EditingStateContext);
  if (!ctx) throw new Error('useEditingState must be used within an EditingStateProvider');
  return ctx;
}
