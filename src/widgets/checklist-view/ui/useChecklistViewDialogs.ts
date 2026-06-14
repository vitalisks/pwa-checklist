import { useState, useCallback } from 'react';
import type { Checklist, Contact } from '@/shared/config';

export interface LightboxState {
  photoIds: string[];
  startIndex: number;
  categoryId: string;
  itemId: string;
  canDelete: boolean;
}

interface UseChecklistViewDialogsProps {
  currentChecklist: Checklist;
  deleteChecklist: (id: string) => Promise<void>;
  closeChecklist: () => void;
  stopCollaboration?: (id: string) => Promise<void>;
}

export function useChecklistViewDialogs({
  currentChecklist,
  deleteChecklist,
  closeChecklist,
  stopCollaboration,
}: UseChecklistViewDialogsProps) {
  const [showCollaboratorPicker, setShowCollaboratorPicker] = useState(false);
  const [showSharePicker, setShowSharePicker] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [shareContact, setShareContact] = useState<Contact | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [showSaveAsTemplateConfirm, setShowSaveAsTemplateConfirm] = useState(false);

  const handleViewPhotos = useCallback((photoIds: string[], startIndex: number, categoryId: string, itemId: string, canDelete: boolean) => {
    setLightbox({ photoIds, startIndex, categoryId, itemId, canDelete });
  }, []);

  const handleDeleteChecklist = useCallback(async () => {
    if (stopCollaboration) await stopCollaboration(currentChecklist.id);
    await deleteChecklist(currentChecklist.id);
    setShowDeleteConfirm(false);
    closeChecklist();
  }, [currentChecklist.id, deleteChecklist, closeChecklist, stopCollaboration]);

  return {
    showCollaboratorPicker, setShowCollaboratorPicker,
    showSharePicker, setShowSharePicker,
    showAddContact, setShowAddContact,
    shareContact, setShareContact,
    lightbox, setLightbox,
    showDeleteConfirm, setShowDeleteConfirm,
    showExport, setShowExport,
    showValidation, setShowValidation,
    showSaveAsTemplateConfirm, setShowSaveAsTemplateConfirm,
    handleViewPhotos,
    handleDeleteChecklist,
  };
}
