import { useMemo, useState, useCallback, useEffect } from 'react';
import type { Checklist, ChecklistCategory, ChecklistItem, ChecklistStatus } from '@/shared/config';
import { useEditorState, Toolbar, DndEditor } from '@/features/item-editor';
import { useTranslation } from '@/shared/i18n';
import { useChecklist } from '@/app/model/checklist-context';
import { useShare } from '@/features/share';
import { useCollaboration } from '@/features/collaboration';
import { generateUUID, computeProgress } from '@/shared/lib';
import { useChecklistViewDialogs } from './useChecklistViewDialogs';
import { ChecklistDialogs } from './ChecklistDialogs';
import ReadToolbar from './ReadToolbar';
import CheckListTitleCard from './ChecklistTitleCard';
import ReadContent from './ReadContent';
import CompletedBanner from './CompletedBanner';

interface ChecklistViewProps {
  checklist: Checklist;
  onSaveAsTemplate?: (checklist: Checklist) => void;
  defaultEdit?: boolean;
  onSaveChecklist?: (checklist: Checklist) => void;
  onClose?: () => void;
}

const ChecklistView: React.FC<ChecklistViewProps> = ({ checklist, onSaveAsTemplate, defaultEdit = false, onSaveChecklist, onClose }) => {
  const { language } = useTranslation();
  const { updateChecklist, toggleItem, addChecklistPhoto, deleteChecklistPhoto, addComment, deleteComment, deleteChecklist } = useChecklist();
  const collaboration = useCollaboration();
  const isCollaborative = collaboration.isCollaborative(checklist.id);
  const share = useShare();
  const { contacts, deviceId } = share;

  const collaboratorAvatars = useMemo(() => {
    if (!isCollaborative) return [];
    const ids = collaboration.getCollaboratorIds(checklist.id);
    return ids.map(id => {
      if (id === deviceId) return { id, name: share.deviceName || 'Me', isYou: true };
      const contact = contacts.find(c => c.deviceId === id);
      if (contact) return { id, name: contact.name, isYou: false };
      return { id, name: id.slice(0, 8), isYou: false };
    });
  }, [isCollaborative, checklist.id, collaboration, deviceId, contacts, share.deviceName]);

  const [titleValue, setTitleValue] = useState(checklist.title);
  const [editingMode, setEditingMode] = useState(() => defaultEdit);
  const [addingItemCategoryId, setAddingItemCategoryId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const isDraft = defaultEdit && onSaveChecklist !== undefined;
  const currentChecklist = checklist;

  const dialogs = useChecklistViewDialogs({
    currentChecklist,
    deleteChecklist,
    closeChecklist: onClose ?? (() => {}),
    stopCollaboration: isCollaborative ? collaboration.stopCollaboration : undefined,
  });

  const {
    showValidation,
    lightbox, setLightbox,
    setShowValidation,
    setShowSaveAsTemplateConfirm,
    setShowDeleteConfirm,
    setShowSharePicker,
    setShowExport,
    setShowCollaboratorPicker,
    handleViewPhotos,
  } = dialogs;

  const editorState = useEditorState({
    initialCategories: currentChecklist.categories,
    photoIdPrefix: 'cl',
    onViewPhotos: handleViewPhotos,
  });

  const progress = useMemo(() => computeProgress(currentChecklist), [currentChecklist]);

  const isCompleted = progress === 100 && currentChecklist.status !== 'completed';

  useEffect(() => {
    if (isDraft) {
      editorState.initState(currentChecklist.categories);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeletePhoto = useCallback((photoId: string) => {
    if (!lightbox) return;
    const { categoryId, itemId, photoIds } = lightbox;
    if (editingMode) {
      editorState.handlers.deletePhoto(categoryId, itemId, photoId);
    } else {
      deleteChecklistPhoto(currentChecklist, categoryId, itemId, photoId);
    }
    if (photoIds.length <= 1) setLightbox(null);
  }, [lightbox, editingMode, editorState.handlers.deletePhoto, deleteChecklistPhoto, currentChecklist]);

  const enterEditMode = useCallback(() => {
    editorState.initState(currentChecklist.categories);
    setEditingMode(true);
  }, [currentChecklist, editorState.initState]);

  const handleSave = useCallback(() => {
    const merged = editorState.getMergedCategories();
    const newCategories = merged as ChecklistCategory[];

    if (editorState.emptyTitle(titleValue) || editorState.emptyCatNames() || editorState.emptyItemTexts()) {
      setShowValidation(true);
      return;
    }

    const total = newCategories.reduce((acc, cat) => acc + cat.items.length, 0);
    const processed = newCategories.reduce((acc, cat) => acc + cat.items.filter(i => i.checked || i.skipped).length, 0);
    const updated = { ...currentChecklist, title: titleValue.trim(), categories: newCategories, status: (total > 0 && processed === total ? 'completed' : 'active') as ChecklistStatus };

    if (isDraft && onSaveChecklist) {
      onSaveChecklist(updated);
      onClose?.();
      return;
    }
    updateChecklist(updated);
    if (collaboration.isCollaborative(updated.id)) collaboration.syncChecklist(updated);
    setEditingMode(false);
    editorState.resetState();
  }, [currentChecklist, titleValue, updateChecklist, isDraft, onSaveChecklist, collaboration, onClose, setShowValidation, editorState]);

  const cancelEditMode = useCallback(() => {
    editorState.resetState();
    setEditingMode(false);
  }, [editorState.resetState]);

  const handleInlineAddItem = useCallback((categoryId: string) => {
    const text = newItemText.trim();
    if (!text) return;
    const newItem: ChecklistItem = { id: generateUUID(), text, description: '', checked: false };
    const updated = { ...currentChecklist, categories: currentChecklist.categories.map((c) => c.id === categoryId ? { ...c, items: [...c.items, newItem] } : c) };
    setNewItemText('');
    setAddingItemCategoryId(null);
    updateChecklist(updated);
    if (collaboration.isCollaborative(updated.id)) collaboration.syncChecklist(updated);
  }, [currentChecklist, newItemText, updateChecklist, collaboration]);

  const handleInlineAddCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (!name) return;
    const newCategory: ChecklistCategory = { id: generateUUID(), name, items: [] };
    const updated = { ...currentChecklist, categories: [...currentChecklist.categories, newCategory] };
    setNewCategoryName('');
    setAddingCategory(false);
    updateChecklist(updated);
    if (collaboration.isCollaborative(updated.id)) collaboration.syncChecklist(updated);
  }, [currentChecklist, newCategoryName, updateChecklist, collaboration]);

  const handleSaveAsTemplateConfirm = useCallback(() => {
    if (onSaveAsTemplate) onSaveAsTemplate(currentChecklist);
    setShowSaveAsTemplateConfirm(false);
  }, [onSaveAsTemplate, currentChecklist, setShowSaveAsTemplateConfirm]);

  const handleCancelDraft = useCallback(() => onClose?.(), [onClose]);

  return (
    <>
      {editingMode && (
        <Toolbar isDraft={isDraft} onBack={onClose ?? (() => {})} onCancel={cancelEditMode} onSave={handleSave} />
      )}
      <div className="space-y-4" style={editingMode ? { paddingTop: '48px' } : undefined}>
        {!editingMode && (
          <ReadToolbar
            isDraft={isDraft}
            showSaveAsTemplate={!!onSaveAsTemplate}
            shareEnabled={share.enabled}
            isCollaborative={isCollaborative}
            collaboratorAvatars={collaboratorAvatars}
            onBack={onClose ?? (() => {})}
            onEdit={enterEditMode}
            onSaveDraft={handleSave}
            onCancelDraft={handleCancelDraft}
            onSaveAsTemplate={() => setShowSaveAsTemplateConfirm(true)}
            onShare={() => setShowSharePicker(true)}
            onExport={() => setShowExport(true)}
            onCollaborate={() => setShowCollaboratorPicker(true)}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        )}

        <CheckListTitleCard
          templateTitle={currentChecklist.templateTitle}
          title={currentChecklist.title}
          isEditing={isDraft || editingMode}
          showValidation={showValidation}
          titleValue={titleValue}
          onTitleChange={setTitleValue}
          date={currentChecklist.createdAt}
          language={language}
          progress={progress}
        />

        {editingMode ? (
          <DndEditor
            categories={editorState.categories}
            showValidation={showValidation}
            catValues={editorState.catValues}
            itemValues={editorState.itemValues}
            descValues={editorState.descValues}
            handlers={editorState.handlers}
            onDragStart={editorState.handleDragStart}
            onDragEnd={editorState.handleDragEnd}
          />
        ) : (
          <ReadContent
            currentChecklist={currentChecklist}
            addingItemCategoryId={addingItemCategoryId}
            newItemText={newItemText}
            addingCategory={addingCategory}
            newCategoryName={newCategoryName}
            handlers={{
              toggleChecked: (categoryId, itemId) => {
                toggleItem(currentChecklist, categoryId, itemId, 'checked');
                if (isCollaborative) collaboration.toggleItem(currentChecklist, categoryId, itemId, 'checked');
              },
              toggleSkipped: (categoryId, itemId) => {
                toggleItem(currentChecklist, categoryId, itemId, 'skipped');
                if (isCollaborative) collaboration.toggleItem(currentChecklist, categoryId, itemId, 'skipped');
              },
              addPhoto: async (categoryId, itemId, file) => {
                const updated = await addChecklistPhoto(currentChecklist, categoryId, itemId, file);
                if (isCollaborative) collaboration.syncChecklist(updated);
              },
              deletePhoto: async (categoryId, itemId, photoId) => {
                const updated = await deleteChecklistPhoto(currentChecklist, categoryId, itemId, photoId);
                if (isCollaborative) collaboration.syncChecklist(updated);
              },
              viewPhotos: handleViewPhotos,
              addComment: async (categoryId, itemId, text) => {
                const updated = await addComment(currentChecklist, categoryId, itemId, text);
                if (isCollaborative) collaboration.syncChecklist(updated);
              },
              deleteComment: async (categoryId, itemId, commentId) => {
                const updated = await deleteComment(currentChecklist, categoryId, itemId, commentId);
                if (isCollaborative) collaboration.syncChecklist(updated);
              },
              startAddItem: (categoryId) => { setAddingItemCategoryId(categoryId); setNewItemText(''); },
              newItemTextChange: setNewItemText,
              confirmAddItem: handleInlineAddItem,
              cancelAddItem: () => { setAddingItemCategoryId(null); setNewItemText(''); },
              startAddCategory: () => { setAddingCategory(true); setNewCategoryName(''); },
              newCategoryNameChange: setNewCategoryName,
              confirmAddCategory: handleInlineAddCategory,
              cancelAddCategory: () => { setAddingCategory(false); setNewCategoryName(''); },
            }}
          />
        )}

        {isCompleted && <CompletedBanner onBack={onClose ?? (() => {})} />}

        <ChecklistDialogs
          currentChecklist={currentChecklist}
          dialogs={dialogs}
          editorState={editorState}
          titleValue={titleValue}
          contacts={share.contacts}
          handleSaveAsTemplateConfirm={handleSaveAsTemplateConfirm}
          handleDeletePhoto={handleDeletePhoto}
        />
      </div>
    </>
  );
};

export default ChecklistView;
