import { useState } from "react";
import { useTranslation } from "@/shared/i18n";
import { generateUUID } from "@/shared/lib";
import { ConfirmDialog } from "@/shared/ui";
import type { Template } from "@/shared/config";
import { useEditorState, Toolbar, DndEditor } from "@/features/item-editor";

interface TemplateEditorProps {
  template?: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [title, setTitle] = useState(template?.title || "");
  const [description, setDescription] = useState(template?.description || "");
  const [showRequiredDialog, setShowRequiredDialog] = useState(false);

  const initialCategories = template?.categories?.length
    ? template.categories.map(c => ({
        id: c.id,
        name: c.name,
        items: c.items.map(i => ({
          id: i.id,
          text: i.text,
          description: i.description,
          photoIds: i.photoIds || [],
          guidePhotoIds: [],
          imageLinks: i.imageLinks || [],
        })),
        unwrapped: c.unwrapped,
      }))
    : [];

  const editorState = useEditorState({
    initialCategories,
    photoIdPrefix: 'tpl',
  });

  const handleSave = () => {
    if (editorState.emptyTitle(title) || editorState.emptyCatNames() || editorState.emptyItemTexts()) {
      editorState.setShowValidation(true);
      setShowRequiredDialog(true);
      return;
    }

    const newTemplate: Template = {
      id: template?.id || generateUUID(),
      title: title.trim(),
      description,
      categories: editorState.getMergedCategories(),
      updatedAt: Date.now(),
    };
    onSave(newTemplate);
  };

  return (
    <div className="space-y-4" style={{ paddingTop: '48px' }}>
      <Toolbar
        isDraft={!template}
        onBack={onCancel}
        onCancel={onCancel}
        onSave={handleSave}
      />

      <div className="card">
        <div className="space-y-3">
          <div>
            <input
              type="text"
              className={`input font-semibold text-base${editorState.showValidation && editorState.emptyTitle(title) ? ' input-invalid' : ''}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.editor.titlePlaceholderRequired}
            />
          </div>
          <div>
            <textarea
              className="input min-h-[50px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.editor.descPlaceholder}
            />
          </div>
        </div>
      </div>

      <DndEditor
        categories={editorState.categories}
        showValidation={editorState.showValidation}
        catValues={editorState.catValues}
        itemValues={editorState.itemValues}
        descValues={editorState.descValues}
        handlers={editorState.handlers}
      />

      {showRequiredDialog && (
        <ConfirmDialog
          title={t.validation.requiredTitle}
          message={[
            editorState.emptyTitle(title) && t.validation.titleRequired,
            editorState.emptyCatNames() && t.validation.categoryNameRequired,
            editorState.emptyItemTexts() && t.validation.itemNameRequired,
          ].filter(Boolean).join('\n')}
          confirmLabel={t.common.ok}
          variant="warning"
          onConfirm={() => setShowRequiredDialog(false)}
          onCancel={() => setShowRequiredDialog(false)}
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
    </div>
  );
};

export default TemplateEditor;
