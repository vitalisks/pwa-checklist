import { useState } from "react";
import { useTranslation } from "@/shared/i18n";
import { useTemplate } from "@/app/model/template-context";
import { generateUUID } from "@/shared/lib";
import type { Template, Category, TemplateItem } from "@/shared/config";
import {
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { EditorToolbar } from "./EditorToolbar";
import { EditorMetadata } from "./EditorMetadata";
import { DndArea } from "./DndArea";
import { ValidationDialog } from "./ValidationDialog";

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
  const { addTemplatePhoto, deleteTemplatePhoto } = useTemplate();
  const [title, setTitle] = useState(template?.title || "");
  const [description, setDescription] = useState(template?.description || "");
  const [categories, setCategories] = useState<Category[]>(
    template?.categories || [],
  );
  const [showValidation, setShowValidation] = useState(false);
  const [showRequiredDialog, setShowRequiredDialog] = useState(false);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = useState<"category" | "item" | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const findCategoryByItemId = (
    itemId: UniqueIdentifier,
  ): Category | undefined => {
    return categories.find((cat) =>
      cat.items.some((item) => item.id === itemId),
    );
  };

  const findCategoryById = (
    categoryId: UniqueIdentifier,
  ): Category | undefined => {
    return categories.find((cat) => cat.id === categoryId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { id } = event.active;
    setActiveId(id);

    const isCategory = findCategoryById(id) !== undefined;
    setActiveType(isCategory ? "category" : "item");
  };

  const handleDragOver = () => {};

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeCategory = findCategoryById(activeId);
    if (activeCategory) {
      if (activeId !== overId) {
        setCategories((items) => {
          const oldIndex = items.findIndex((c) => c.id === activeId);
          const newIndex = items.findIndex((c) => c.id === overId);
          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(items, oldIndex, newIndex);
          }
          return items;
        });
      }
      return;
    }

    const activeItemCategory = findCategoryByItemId(activeId);
    if (!activeItemCategory) return;

    const activeItem = activeItemCategory.items.find((i) => i.id === activeId);
    if (!activeItem) return;

    const sourceCategoryId = activeItemCategory.id;
    let targetCategoryId = sourceCategoryId;
    let targetIndex = -1;

    if (findCategoryById(overId as string)) {
      targetCategoryId = overId as string;
      targetIndex = -1;
    } else {
      const targetItemCategory = findCategoryByItemId(overId);
      if (targetItemCategory) {
        targetCategoryId = targetItemCategory.id;
        targetIndex = targetItemCategory.items.findIndex(
          (i) => i.id === overId,
        );
      }
    }

    if (sourceCategoryId === targetCategoryId) {
      if (targetIndex === -1) return;
      setCategories((cats) => {
        return cats.map((cat) => {
          if (cat.id === sourceCategoryId) {
            const oldIndex = cat.items.findIndex((i) => i.id === activeId);
            if (
              oldIndex !== -1 &&
              targetIndex !== -1 &&
              oldIndex !== targetIndex
            ) {
              return {
                ...cat,
                items: arrayMove(cat.items, oldIndex, targetIndex),
              };
            }
          }
          return cat;
        });
      });
    } else {
      setCategories((cats) => {
        const newCats = cats.map((cat) => {
          if (cat.id === sourceCategoryId) {
            return {
              ...cat,
              items: cat.items.filter((i) => i.id !== activeId),
            };
          }
          if (cat.id === targetCategoryId) {
            const newItems = [...cat.items];
            if (targetIndex !== -1) {
              newItems.splice(targetIndex, 0, activeItem);
            } else {
              newItems.push(activeItem);
            }
            return { ...cat, items: newItems };
          }
          return cat;
        });
        return newCats;
      });
    }
  };

  const addCategory = () => {
    const newCategory: Category = {
      id: generateUUID(),
      name: "",
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
          const newItem: TemplateItem = {
            id: generateUUID(),
            text: "",
            description: "",
            photoIds: [],
          };
          return { ...c, items: [...c.items, newItem] };
        }
        return c;
      }),
    );
  };

  const updateItemText = (categoryId: string, itemId: string, text: string) => {
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          return {
            ...c,
            items: c.items.map((i) => (i.id === itemId ? { ...i, text } : i)),
          };
        }
        return c;
      }),
    );
  };

  const updateItemDescription = (
    categoryId: string,
    itemId: string,
    desc: string,
  ) => {
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          return {
            ...c,
            items: c.items.map((i) =>
              i.id === itemId ? { ...i, description: desc } : i,
            ),
          };
        }
        return c;
      }),
    );
  };

  const removeItemFromCategory = (categoryId: string, itemId: string) => {
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          return { ...c, items: c.items.filter((i) => i.id !== itemId) };
        }
        return c;
      }),
    );
  };

  const handleAddPhoto = async (
    categoryId: string,
    itemId: string,
    file: File,
  ) => {
    const photoId = await addTemplatePhoto(itemId, file);
    if (photoId) {
      setCategories(
        categories.map((c) => {
          if (c.id === categoryId) {
            return {
              ...c,
              items: c.items.map((i) => {
                if (i.id === itemId) {
                  return { ...i, photoIds: [...(i.photoIds || []), photoId] };
                }
                return i;
              }),
            };
          }
          return c;
        }),
      );
    }
  };

  const handleDeletePhoto = async (
    categoryId: string,
    itemId: string,
    photoId: string,
  ) => {
    await deleteTemplatePhoto(photoId);
    setCategories(
      categories.map((c) => {
        if (c.id === categoryId) {
          return {
            ...c,
            items: c.items.map((i) => {
              if (i.id === itemId) {
                return {
                  ...i,
                  photoIds: (i.photoIds || []).filter((id) => id !== photoId),
                };
              }
              return i;
            }),
          };
        }
        return c;
      }),
    );
  };

  const hasEmptyTitle = () => !title.trim();
  const hasEmptyCategoryNames = () => categories.some((c) => !c.name.trim());
  const hasEmptyItemTexts = () =>
    categories.some((c) => c.items.some((i) => !i.text.trim()));

  const buildValidationMessage = () => {
    const parts: string[] = [];
    if (hasEmptyTitle()) parts.push(t.validation.titleRequired);
    if (hasEmptyCategoryNames()) parts.push(t.validation.categoryNameRequired);
    if (hasEmptyItemTexts()) parts.push(t.validation.itemNameRequired);
    return parts.join("\n");
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

  const activeItem =
    activeId && activeType === "item"
      ? (() => {
          for (const cat of categories) {
            const item = cat.items.find((i) => i.id === activeId);
            if (item) return item;
          }
          return null;
        })()
      : null;

  const activeCategory =
    (activeId && activeType === "category" ? findCategoryById(activeId) : null) ?? null;

  return (
    <div className="space-y-4">
      <EditorToolbar
        isEditing={!!template}
        onSave={handleSave}
        onCancel={onCancel}
      />

      <EditorMetadata
        title={title}
        onTitleChange={setTitle}
        description={description}
        onDescriptionChange={setDescription}
        showValidation={showValidation}
        hasEmptyTitle={hasEmptyTitle()}
      />

      <DndArea
        categories={categories}
        showValidation={showValidation}
        sensors={sensors}
        activeItem={activeItem}
        activeCategory={activeCategory}
        handlers={{
          onDragStart: handleDragStart,
          onDragOver: handleDragOver,
          onDragEnd: handleDragEnd,
          addCategory,
          updateCategoryName,
          removeCategory,
          addItemToCategory,
          updateItemText,
          updateItemDescription,
          removeItemFromCategory,
          addPhoto: handleAddPhoto,
          deletePhoto: handleDeletePhoto,
        }}
      />

      {showRequiredDialog && (
        <ValidationDialog
          message={buildValidationMessage()}
          onClose={() => setShowRequiredDialog(false)}
        />
      )}
    </div>
  );
};

export default TemplateEditor;
