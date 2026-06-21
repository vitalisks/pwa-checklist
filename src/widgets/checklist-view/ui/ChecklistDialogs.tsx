import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/shared/i18n';
import { ConfirmDialog } from '@/shared/ui';
import { PhotoLightbox } from '@/features/manage-photos';
import { SendShareDialog, AddContactDialog } from '@/features/share';
import { ExportChecklistDialog } from '@/features/export-checklist';
import { CollaboratorPicker } from '@/features/collaboration';
import ShareSheet from './ShareSheet';
import type { Checklist, Contact } from '@/shared/config';
import type { DialogState } from './useChecklistViewDialogs';

interface ChecklistDialogsProps {
  currentChecklist: Checklist;
  dialogs: DialogState;
  editorState: {
    emptyTitle: (t: string) => boolean;
    emptyCatNames: () => boolean;
    emptyItemTexts: () => boolean;
    showUnwrapConfirm: boolean;
    confirmUnwrap: () => void;
    cancelUnwrap: () => void;
  };
  titleValue: string;
  contacts: Contact[];
  handleSaveAsTemplateConfirm: () => void;
  handleDeletePhoto: (photoId: string) => void;
}

export const ChecklistDialogs: React.FC<ChecklistDialogsProps> = ({
  currentChecklist, dialogs, editorState, titleValue,
  contacts, handleSaveAsTemplateConfirm, handleDeletePhoto,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <AnimatePresence>
        {dialogs.lightbox && (
          <PhotoLightbox
            photoIds={dialogs.lightbox.photoIds}
            startIndex={dialogs.lightbox.startIndex}
            onClose={() => dialogs.setLightbox(null)}
            onDelete={dialogs.lightbox.canDelete ? handleDeletePhoto : undefined}
          />
        )}
      </AnimatePresence>

      {dialogs.showValidation && (
        <ConfirmDialog
          title={t.validation.requiredTitle}
          message={[
            editorState.emptyTitle(titleValue) && t.validation.titleRequired,
            editorState.emptyCatNames() && t.validation.categoryNameRequired,
            editorState.emptyItemTexts() && t.validation.itemNameRequired,
          ].filter(Boolean).join('\n')}
          confirmLabel={t.common.ok}
          variant="warning"
          onConfirm={() => dialogs.setShowValidation(false)}
          onCancel={() => dialogs.setShowValidation(false)}
        />
      )}

      {editorState.showUnwrapConfirm && (
        <ConfirmDialog
          title={t.common.delete.confirmTitle}
          message={t.checklist.unwrappedConfirm}
          confirmLabel={t.common.ok}
          variant="warning"
          onConfirm={editorState.confirmUnwrap}
          onCancel={editorState.cancelUnwrap}
        />
      )}

      {dialogs.showSaveAsTemplateConfirm && (
        <ConfirmDialog
          title={t.checklist.saveAsTemplate}
          message={t.common.delete.confirm}
          confirmLabel={t.checklist.saveAsTemplate}
          onConfirm={handleSaveAsTemplateConfirm}
          onCancel={() => dialogs.setShowSaveAsTemplateConfirm(false)}
        />
      )}

      {dialogs.showDeleteConfirm && (
        <ConfirmDialog
          title={t.common.delete.confirmTitle}
          message={t.common.delete.confirmMsg}
          confirmLabel={t.common.delete.confirmAction}
          onConfirm={dialogs.handleDeleteChecklist}
          onCancel={() => dialogs.setShowDeleteConfirm(false)}
        />
      )}

      {dialogs.showCollaboratorPicker && (
        <CollaboratorPicker checklist={currentChecklist} onClose={() => dialogs.setShowCollaboratorPicker(false)} />
      )}

      <ShareSheet
        isOpen={dialogs.showSharePicker}
        contacts={contacts}
        onSend={(c) => { dialogs.setShowSharePicker(false); dialogs.setShareContact(c); }}
        onAddContact={() => { dialogs.setShowSharePicker(false); dialogs.setShowAddContact(true); }}
        onClose={() => dialogs.setShowSharePicker(false)}
      />

      {dialogs.shareContact && (
        <SendShareDialog
          contact={dialogs.shareContact}
          item={currentChecklist}
          itemType="checklist"
          onClose={() => dialogs.setShareContact(null)}
        />
      )}

      {dialogs.showAddContact && (
        <AddContactDialog onClose={() => dialogs.setShowAddContact(false)} />
      )}

      <ExportChecklistDialog
        checklist={currentChecklist}
        isOpen={dialogs.showExport}
        onClose={() => dialogs.setShowExport(false)}
      />
    </>
  );
};
