import React, { useMemo, useState, useCallback, useEffect } from 'react';
import type { Checklist, ChecklistCategory, ChecklistItem, ChecklistStatus } from '@/shared/config';
import { useTranslation } from '@/shared/i18n';
import { useChecklist } from '@/app/model/checklist-context';
import { useNavigation } from '@/app/model/navigation-context';
import { useStorage } from '@/shared/api';
import { ConfirmDialog } from '@/shared/ui';
import { useShare, SendShareDialog, AddContactDialog } from '@/features/share';
import { ExportChecklistDialog } from '@/features/export-checklist';
import { PhotoLightbox } from '@/features/manage-photos';
import { useCollaboration, CollaboratorPicker } from '@/features/collaboration';
import { AnimatePresence } from 'framer-motion';
import { generateUUID, compressImage } from '@/shared/lib';
import { buildChecklistPhotoId } from '@/entities/photo';
import { useChecklistViewDialogs } from './useChecklistViewDialogs';
import EditToolbar from './EditToolbar';
import ReadToolbar from './ReadToolbar';
import CheckListTitleCard from './ChecklistTitleCard';
import EditContent from './EditContent';
import ReadContent from './ReadContent';
import CompletedBanner from './CompletedBanner';
import ShareSheet from './ShareSheet';

interface ChecklistViewProps {
  checklist: Checklist;
  onSaveAsTemplate?: (checklist: Checklist) => void;
  defaultEdit?: boolean;
  onSaveChecklist?: (checklist: Checklist) => void;
}

const ChecklistView: React.FC<ChecklistViewProps> = ({ checklist, onSaveAsTemplate, defaultEdit = false, onSaveChecklist }) => {
  const { t, language } = useTranslation();
  const storage = useStorage();
  const { updateChecklist, toggleItem, addChecklistPhoto, deleteChecklistPhoto, deleteChecklist } = useChecklist();
  const { closeChecklist } = useNavigation();
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
  const [catValues, setCatValues] = useState<Record<string, string>>({});
  const [itemValues, setItemValues] = useState<Record<string, string>>({});
  const [descValues, setDescValues] = useState<Record<string, string>>({});
  const [localChecklist, setLocalChecklist] = useState<Checklist | null>(defaultEdit ? { ...checklist } : null);

  const isDraft = defaultEdit && onSaveChecklist !== undefined;
  const currentChecklist = localChecklist ?? checklist;

  const {
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
  } = useChecklistViewDialogs({
    currentChecklist,
    deleteChecklist,
    closeChecklist,
    stopCollaboration: isCollaborative ? collaboration.stopCollaboration : undefined,
  });

  const { progress } = useMemo(() => {
    const total = currentChecklist.categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const processed = currentChecklist.categories.reduce(
      (acc, cat) => acc + cat.items.filter((i) => i.checked || i.skipped).length, 0
    );
    return { progress: total > 0 ? (processed / total) * 100 : 0 };
  }, [currentChecklist]);

  const isCompleted = progress === 100 && currentChecklist.status !== 'completed';

  useEffect(() => {
    if (isDraft) {
      const cats: Record<string, string> = {};
      const items: Record<string, string> = {};
      const descs: Record<string, string> = {};
      for (const cat of currentChecklist.categories) {
        cats[cat.id] = cat.name;
        for (const item of cat.items) {
          items[item.id] = item.text;
          if (item.description !== undefined) descs[item.id] = item.description;
        }
      }
      setCatValues(cats); // eslint-disable-line react-hooks/set-state-in-effect
      setItemValues(items);
      setDescValues(descs);
    }
  }, [currentChecklist.categories, isDraft]);

  const commit = useCallback((updated: Checklist) => setLocalChecklist(updated), []);

  const handleEditPhotoAdd = useCallback(async (categoryId: string, itemId: string, file: File) => {
    const uuid = generateUUID();
    const photoId = buildChecklistPhotoId(itemId, uuid);
    const dataUrl = await compressImage(file);
    await storage.setPhoto({ itemId: photoId, dataUrl, updatedAt: Date.now() });
    const newCategories = currentChecklist.categories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, items: cat.items.map((item) => item.id === itemId ? { ...item, photoIds: [...(item.photoIds || []), photoId] } : item) }
        : cat
    );
    const updated = { ...currentChecklist, categories: newCategories };
    commit(updated);
    if (collaboration.isCollaborative(updated.id)) collaboration.syncChecklist(updated);
  }, [currentChecklist, commit, storage, collaboration]);

  const handleEditPhotoDelete = useCallback(async (categoryId: string, itemId: string, photoId: string) => {
    await storage.deletePhoto(photoId);
    const newCategories = currentChecklist.categories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, items: cat.items.map((item) => item.id === itemId ? { ...item, photoIds: (item.photoIds || []).filter((id) => id !== photoId) } : item) }
        : cat
    );
    const updated = { ...currentChecklist, categories: newCategories };
    commit(updated);
    if (collaboration.isCollaborative(updated.id)) collaboration.syncChecklist(updated);
  }, [currentChecklist, commit, storage, collaboration]);

  const handleDeletePhoto = (photoId: string) => {
    if (lightbox) {
      if (editingMode) handleEditPhotoDelete(lightbox.categoryId, lightbox.itemId, photoId);
      else deleteChecklistPhoto(currentChecklist, lightbox.categoryId, lightbox.itemId, photoId);
      if (lightbox.photoIds.length <= 1) setLightbox(null);
    }
  };

  const enterEditMode = useCallback(() => {
    const cats: Record<string, string> = {};
    const items: Record<string, string> = {};
    const descs: Record<string, string> = {};
    for (const cat of currentChecklist.categories) {
      cats[cat.id] = cat.name;
      for (const item of cat.items) {
        items[item.id] = item.text;
        if (item.description !== undefined) descs[item.id] = item.description;
      }
    }
    setCatValues(cats);
    setItemValues(items);
    setDescValues(descs);
    setEditingMode(true);
    if (!isDraft) setLocalChecklist({ ...currentChecklist });
  }, [currentChecklist, isDraft]);

  const handleSave = useCallback(() => {
    const newCategories = currentChecklist.categories.map(cat => ({
      ...cat,
      name: catValues[cat.id] ?? cat.name,
      items: cat.items.map(item => ({
        ...item,
        text: itemValues[item.id] ?? item.text,
        description: descValues[item.id] ?? item.description,
      })),
    }));

    const emptyTitle = !titleValue.trim();
    const emptyCatNames = newCategories.some(c => !c.name.trim());
    const emptyItemTexts = newCategories.some(c => c.items.some(i => !i.text.trim()));

    if (emptyTitle || emptyCatNames || emptyItemTexts) { setShowValidation(true); return; }

    const total = newCategories.reduce((acc, cat) => acc + cat.items.length, 0);
    const processed = newCategories.reduce((acc, cat) => acc + cat.items.filter(i => i.checked || i.skipped).length, 0);
    const updated = { ...currentChecklist, title: titleValue.trim(), categories: newCategories, status: (total > 0 && processed === total ? 'completed' : 'active') as ChecklistStatus };

    if (isDraft && onSaveChecklist) {
      onSaveChecklist(updated);
      closeChecklist();
      return;
    }
    updateChecklist(updated);
    if (collaboration.isCollaborative(updated.id)) collaboration.syncChecklist(updated);
    setEditingMode(false);
    setCatValues({});
    setItemValues({});
    setDescValues({});
    setLocalChecklist(null);
  }, [currentChecklist, catValues, itemValues, descValues, titleValue, updateChecklist, isDraft, onSaveChecklist, collaboration, closeChecklist, setShowValidation]);

  const cancelEditMode = useCallback(() => {
    setCatValues({});
    setItemValues({});
    setDescValues({});
    setEditingMode(false);
    setLocalChecklist(null);
  }, []);

  const addCategory = useCallback(() => {
    const newCategory: ChecklistCategory = { id: generateUUID(), name: '', items: [] };
    const updated = { ...currentChecklist, categories: [...currentChecklist.categories, newCategory] };
    commit(updated);
    setCatValues(prev => ({ ...prev, [newCategory.id]: '' }));
  }, [currentChecklist, commit]);

  const removeCategory = useCallback((categoryId: string) => {
    if (collaboration.isCollaborative(currentChecklist.id)) {
      collaboration.deleteCategory(currentChecklist, categoryId);
      commit({ ...currentChecklist, categories: currentChecklist.categories.filter((c) => c.id !== categoryId) });
      return;
    }
    const category = currentChecklist.categories.find(c => c.id === categoryId);
    if (category) for (const item of category.items) for (const photoId of item.photoIds || []) storage.deletePhoto(photoId);
    commit({ ...currentChecklist, categories: currentChecklist.categories.filter((c) => c.id !== categoryId) });
  }, [currentChecklist, commit, storage, collaboration]);

  const addItem = useCallback((categoryId: string) => {
    if (collaboration.isCollaborative(currentChecklist.id)) {
      const collabItem = collaboration.addItem(currentChecklist, categoryId);
      if (!collabItem) return;
      const localItem: ChecklistItem = { id: collabItem.id, text: collabItem.text, description: collabItem.description, checked: collabItem.checked };
      const updated = { ...currentChecklist, categories: currentChecklist.categories.map((c) => c.id === categoryId ? { ...c, items: [...c.items, localItem] } : c) };
      commit(updated);
      setItemValues(prev => ({ ...prev, [localItem.id]: '' }));
      return;
    }
    const newItem: ChecklistItem = { id: generateUUID(), text: '', description: '', checked: false };
    commit({ ...currentChecklist, categories: currentChecklist.categories.map((c) => c.id === categoryId ? { ...c, items: [...c.items, newItem] } : c) });
    setItemValues(prev => ({ ...prev, [newItem.id]: '' }));
  }, [currentChecklist, commit, collaboration]);

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

  const removeItem = useCallback((categoryId: string, itemId: string) => {
    if (collaboration.isCollaborative(currentChecklist.id)) {
      collaboration.deleteItem(currentChecklist, categoryId, itemId);
      commit({ ...currentChecklist, categories: currentChecklist.categories.map((c) => c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c) });
      return;
    }
    const item = currentChecklist.categories.find(c => c.id === categoryId)?.items.find(i => i.id === itemId);
    if (item) for (const photoId of item.photoIds || []) storage.deletePhoto(photoId);
    commit({ ...currentChecklist, categories: currentChecklist.categories.map((c) => c.id === categoryId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c) });
  }, [currentChecklist, commit, storage, collaboration]);

  const handleSaveAsTemplateConfirm = useCallback(() => {
    if (onSaveAsTemplate) onSaveAsTemplate(currentChecklist);
    setShowSaveAsTemplateConfirm(false);
  }, [onSaveAsTemplate, currentChecklist, setShowSaveAsTemplateConfirm]);

  const handleCancelDraft = useCallback(() => closeChecklist(), [closeChecklist]);

  return (
    <>
      {editingMode && (
        <EditToolbar isDraft={isDraft} onBack={closeChecklist} onCancel={cancelEditMode} onSave={handleSave} />
      )}
      <div className="space-y-4" style={editingMode ? { paddingTop: '48px' } : undefined}>
        {!editingMode && (
          <ReadToolbar
            isDraft={isDraft}
            showSaveAsTemplate={!!onSaveAsTemplate}
            shareEnabled={share.enabled}
            isCollaborative={isCollaborative}
            collaboratorAvatars={collaboratorAvatars}
            onBack={closeChecklist}
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
          <EditContent
            currentChecklist={currentChecklist}
            showValidation={showValidation}
            catValues={catValues}
            itemValues={itemValues}
            descValues={descValues}
            handlers={{
              commit,
              addCategory,
              removeCategory,
              addItem,
              updateCategoryName: (id, name) => setCatValues(prev => ({ ...prev, [id]: name })),
              updateItemText: (itemId, text) => setItemValues(prev => ({ ...prev, [itemId]: text })),
              updateItemDesc: (itemId, desc) => setDescValues(prev => ({ ...prev, [itemId]: desc })),
              removeItem,
              addPhoto: handleEditPhotoAdd,
              deletePhoto: handleEditPhotoDelete,
              viewPhotos: handleViewPhotos,
            }}
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

        {isCompleted && <CompletedBanner onBack={closeChecklist} />}

        <AnimatePresence>
          {lightbox && (
            <PhotoLightbox
              photoIds={lightbox.photoIds}
              startIndex={lightbox.startIndex}
              onClose={() => setLightbox(null)}
              onDelete={lightbox.canDelete ? handleDeletePhoto : undefined}
            />
          )}
        </AnimatePresence>

        {showValidation && (
          <ConfirmDialog
            title={t.validation.requiredTitle}
            message={[
              !titleValue.trim() && t.validation.titleRequired,
              currentChecklist.categories.some(c => !(catValues[c.id] ?? c.name).trim()) && t.validation.categoryNameRequired,
              currentChecklist.categories.some(c => c.items.some(i => !(itemValues[i.id] ?? i.text).trim())) && t.validation.itemNameRequired,
            ].filter(Boolean).join('\n')}
            confirmLabel={t.common.ok}
            variant="warning"
            onConfirm={() => setShowValidation(false)}
            onCancel={() => setShowValidation(false)}
          />
        )}

        {showSaveAsTemplateConfirm && (
          <ConfirmDialog
            title={t.checklist.saveAsTemplate}
            message={t.common.delete.confirm}
            confirmLabel={t.checklist.saveAsTemplate}
            onConfirm={handleSaveAsTemplateConfirm}
            onCancel={() => setShowSaveAsTemplateConfirm(false)}
          />
        )}

        {showDeleteConfirm && (
          <ConfirmDialog
            title={t.common.delete.confirmTitle}
            message={t.common.delete.confirmMsg}
            confirmLabel={t.common.delete.confirmAction}
            onConfirm={handleDeleteChecklist}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}

        {showCollaboratorPicker && (
          <CollaboratorPicker checklist={currentChecklist} onClose={() => setShowCollaboratorPicker(false)} />
        )}

        <ShareSheet
          isOpen={showSharePicker}
          contacts={share.contacts}
          onSend={(c) => { setShowSharePicker(false); setShareContact(c); }}
          onAddContact={() => { setShowSharePicker(false); setShowAddContact(true); }}
          onClose={() => setShowSharePicker(false)}
        />

        {shareContact && (
          <SendShareDialog
            contact={shareContact}
            item={currentChecklist}
            itemType="checklist"
            onClose={() => setShareContact(null)}
          />
        )}

        {showAddContact && (
          <AddContactDialog onClose={() => setShowAddContact(false)} />
        )}

        <ExportChecklistDialog
          checklist={currentChecklist}
          isOpen={showExport}
          onClose={() => setShowExport(false)}
        />
      </div>
    </>
  );
};

export default ChecklistView;
