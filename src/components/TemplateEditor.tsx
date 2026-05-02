import React, { useState, useEffect } from 'react';
import { Plus, Save } from 'lucide-react';
import { Template, Category, TemplateItem } from '../types';
import { AnimatePresence } from 'framer-motion';
import CategoryRow from './CategoryRow';
import ConfirmDialog from './ConfirmDialog';

import { useLanguage } from '../hooks/useLanguage';
import { generateUUID } from '../utils/uuid';
import editorStyles from './TemplateEditor.module.css';

interface TemplateEditorProps {
  template?: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
  onAddPhoto: (itemId: string, file: File) => void;
  onDeletePhoto: (itemId: string, photoId: string) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSave, onCancel, onAddPhoto, onDeletePhoto }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.description || '');
  const [categories, setCategories] = useState<Category[]>(template?.categories || []);
  const [showValidation, setShowValidation] = useState(false);
  const [showRequiredDialog, setShowRequiredDialog] = useState(false);

  useEffect(() => {
    if (template?.categories) {
      setCategories(template.categories);
    }
  }, [template]);

  const addCategory = () => {
    const newCategory: Category = {
      id: generateUUID(),
      name: '',
      items: [],
    };
    setCategories([...categories, newCategory]);
  };

  const updateCategoryName = (id: string, name: string) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const addItemToCategory = (categoryId: string) => {
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          const newItem: TemplateItem = { id: generateUUID(), text: '', description: '', photoIds: [] };
          return { ...c, items: [...c.items, newItem] };
        }
        return c;
      })
    );
  };

  const updateItemText = (categoryId: string, itemId: string, text: string) => {
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, text } : i)) };
        }
        return c;
      })
    );
  };

  const updateItemDescription = (categoryId: string, itemId: string, desc: string) => {
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, description: desc } : i)) };
        }
        return c;
      })
    );
  };

  const removeItemFromCategory = (categoryId: string, itemId: string) => {
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.filter((i) => i.id !== itemId) };
        }
        return c;
      })
    );
  };

  const handleAddPhoto = async (categoryId: string, itemId: string, file: File) => {
    const photoId = await onAddPhoto(itemId, file);
    if (photoId) {
      setCategories(categories.map(c => {
        if (c.id === categoryId) {
          return {
            ...c,
            items: c.items.map(i => {
              if (i.id === itemId) {
                return { ...i, photoIds: [...(i.photoIds || []), photoId] };
              }
              return i;
            })
          };
        }
        return c;
      }));
    }
  };

  const handleDeletePhoto = async (categoryId: string, itemId: string, photoId: string) => {
    await onDeletePhoto(itemId, photoId);
    setCategories(categories.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          items: c.items.map(i => {
            if (i.id === itemId) {
              return { ...i, photoIds: (i.photoIds || []).filter(id => id !== photoId) };
            }
            return i;
          })
        };
      }
      return c;
    }));
  };

  const hasEmptyTitle = () => !title.trim();
  const hasEmptyCategoryNames = () => categories.some(c => !c.name.trim());
  const hasEmptyItemTexts = () => categories.some(c => c.items.some(i => !i.text.trim()));

  const buildValidationMessage = () => {
    const parts: string[] = [];
    if (hasEmptyTitle()) parts.push(t('validation_title_required'));
    if (hasEmptyCategoryNames()) parts.push(t('validation_category_name_required'));
    if (hasEmptyItemTexts()) parts.push(t('validation_item_name_required'));
    return parts.join('\n');
  };

  const handleSave = () => {
    if (hasEmptyTitle() || hasEmptyCategoryNames() || hasEmptyItemTexts()) {
      setShowValidation(true);
      setShowRequiredDialog(true);
      return;
    }

    const newTemplate: Template = {
      id: template?.id || generateUUID(),
      title,
      description,
      categories,
      updatedAt: Date.now(),
    };
    onSave(newTemplate);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{template ? t('editor_edit') : t('editor_new')}</h2>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn btn-ghost">
            {t('editor_cancel')}
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            <Save size={16} /> {t('editor_save')}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="space-y-3">
          <div>
          <input
            type="text"
            className={`input font-semibold text-base${showValidation && hasEmptyTitle() ? ' input-invalid' : ''}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('editor_title_placeholder_required')}
          />
          </div>
          <div>
            <textarea
              className="input min-h-[50px] text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('editor_desc_placeholder')}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className={`flex items-center justify-between ${editorStyles['section-sticky']}`}>
          <h3 className="section-label">
            {t('editor_cats_items_label')}
          </h3>
          <button onClick={addCategory} className="btn btn-ghost text-accent py-1">
            <Plus size={16} /> {t('editor_add_cat')}
          </button>
        </div>

        <AnimatePresence>
          {categories.map((category) => (
        <CategoryRow
          key={category.id}
          category={category}
          showValidation={showValidation}
          onUpdateName={updateCategoryName}
          onRemove={removeCategory}
          onAddItem={addItemToCategory}
          onUpdateItem={updateItemText}
          onUpdateItemDescription={updateItemDescription}
          onRemoveItem={removeItemFromCategory}
          onAddPhoto={handleAddPhoto}
          onDeletePhoto={handleDeletePhoto}
        />
          ))}
        </AnimatePresence>
      </div>

      {showRequiredDialog && (
        <ConfirmDialog
          title={t('validation_required_title')}
          message={buildValidationMessage()}
          confirmLabel={t('action_ok')}
          variant="warning"
          onConfirm={() => setShowRequiredDialog(false)}
          onCancel={() => setShowRequiredDialog(false)}
        />
      )}
    </div>
  );
};

export default TemplateEditor;