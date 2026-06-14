import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, X, GripVertical } from "lucide-react";
import { useStorage } from "@/shared/api";
import { PhotoLightbox, PhotoList } from "@/features/manage-photos";
import type { TemplateItem } from "@/shared/config";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "@/shared/i18n";

export interface SortableItemHandlers {
  updateText: (categoryId: string, itemId: string, text: string) => void;
  updateDescription: (categoryId: string, itemId: string, desc: string) => void;
  remove: (categoryId: string, itemId: string) => void;
  addPhoto: (categoryId: string, itemId: string, file: File) => void;
  deletePhoto: (categoryId: string, itemId: string, photoId: string) => void;
}

interface SortableItemProps {
  item: TemplateItem;
  categoryId: string;
  showValidation: boolean;
  handlers: SortableItemHandlers;
}

export function SortableItem({
  item,
  categoryId,
  showValidation,
  handlers: {
    updateText: onUpdateText,
    updateDescription: onUpdateDescription,
    remove: onRemove,
    addPhoto: onAddPhoto,
    deletePhoto: onDeletePhoto,
  },
}: SortableItemProps) {
  const { t } = useTranslation();
  const storage = useStorage();
  const descRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const ids = item.photoIds || [];
    if (ids.length === 0) {
      return;
    }
    let cancelled = false;
    const load = async () => {
      const map: Record<string, string> = {};
      for (const pid of ids) {
        try {
          const photo = await storage.getPhoto(pid);
          if (photo && !cancelled) map[pid] = photo.dataUrl;
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setThumbs(map);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [item.photoIds, storage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddPhoto(categoryId, item.id, file);
      e.target.value = "";
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  useEffect(() => {
    if (descRef.current) {
      descRef.current.style.height = "auto";
      descRef.current.style.height = `${descRef.current.scrollHeight}px`;
    }
  }, [item.description]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const photoIds = item.photoIds || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface-1 border border-subtle rounded px-1.5 py-1 transition-colors ${isDragging ? "border-accent" : ""}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex items-center gap-1.5">
        <button
          {...attributes}
          {...listeners}
          style={{ touchAction: "none" }}
          className="btn-icon w-5 h-5 cursor-grab active:cursor-grabbing text-tertiary hover:text-primary shrink-0"
        >
          <GripVertical size={12} />
        </button>
        <input
          type="text"
          className={`input h-7 flex-1 font-medium bg-transparent${showValidation && !item.text.trim() ? " input-invalid" : ""}`}
          value={item.text}
          onChange={(e) => onUpdateText(categoryId, item.id, e.target.value)}
          placeholder={t.editor.itemPlaceholder}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-icon w-5 h-5 text-tertiary hover:text-accent shrink-0"
          title={t.item.addPhoto}
        >
          <ImageIcon size={12} />
        </button>
        <button
          onClick={() => onRemove(categoryId, item.id)}
          className="btn-icon w-5 h-5 btn-icon-danger shrink-0"
        >
          <X size={12} />
        </button>
      </div>
      {item.description !== undefined && (
        <textarea
          ref={descRef}
          className="input bg-transparent border-subtle mt-1 ml-5"
          style={{ resize: "none", overflow: "hidden" }}
          value={item.description}
          onChange={(e) =>
            onUpdateDescription(categoryId, item.id, e.target.value)
          }
          placeholder={t.editor.itemDescPlaceholder}
        />
      )}
      {photoIds.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            marginTop: "6px",
            marginLeft: "26px",
            paddingTop: "6px",
          }}
        >
          <PhotoList
            photoIds={photoIds}
            thumbs={thumbs}
            onView={(i) => setLightboxIndex(i)}
            onDelete={(pid) => onDeletePhoto(categoryId, item.id, pid)}
          />
        </div>
      )}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photoIds={photoIds}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={(pid) => {
            onDeletePhoto(categoryId, item.id, pid);
            if (photoIds.length <= 1) setLightboxIndex(null);
            else setLightboxIndex(Math.min(lightboxIndex, photoIds.length - 2));
          }}
        />
      )}
    </div>
  );
}
