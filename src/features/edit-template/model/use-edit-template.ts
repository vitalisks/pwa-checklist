import { useState, useCallback } from 'react';
import type { Template } from '@/shared/config';

export type EditingState = {
  mode: 'idle' | 'creating' | 'editing';
  template: Template | null;
};

export function useEditTemplate() {
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

  return {
    editingState,
    editingTemplate: editingState.mode === 'idle' ? undefined : editingState.template,
    isEditing: editingState.mode !== 'idle',
    startEditing,
    cancelEditing,
    finishEditing,
  };
}
