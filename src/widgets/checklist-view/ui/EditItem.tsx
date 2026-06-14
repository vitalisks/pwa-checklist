import { useState, useEffect, useRef } from 'react';
import { Camera, ImageIcon, X, GripVertical } from 'lucide-react';
import { useStorage } from '@/shared/api';
import { ItemEditRow } from '@/features/category-editor';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import photoStyles from '@/shared/styles/photo-zone.module.css';

export interface EditItemHandlers {
  updateText: (text: string) => void;
  updateDesc: (desc: string) => void;
  remove: () => void;
  addPhoto?: (file: File) => void;
  deletePhoto?: (photoId: string) => void;
  viewPhotos?: (photoIds: string[], startIndex: number) => void;
}

export interface EditItemProps {
  item: { id: string; text: string; description?: string };
  photoIds: string[];
  guidePhotoIds: string[];
  imageLinks: string[];
  showValidation: boolean;
  placeholder: string;
  descPlaceholder: string;
  handlers: EditItemHandlers;
}

export function EditItem({
  item, photoIds, guidePhotoIds, imageLinks, showValidation, placeholder, descPlaceholder, handlers,
}: EditItemProps) {
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [guideThumbs, setGuideThumbs] = useState<Record<string, string>>({});
  const [captureThumbs, setCaptureThumbs] = useState<Record<string, string>>({});
  const [brokenLinks, setBrokenLinks] = useState<Set<string>>(new Set());
  const hasGuides = guidePhotoIds.length > 0;
  const hasCaptures = photoIds.length > 0;
  const hasImageLinks = imageLinks.length > 0;
  const allPhotoIds = [...guidePhotoIds, ...imageLinks, ...photoIds];
  const effectiveGuideThumbs = guidePhotoIds.length === 0 ? {} : guideThumbs;
  const effectiveCaptureThumbs = photoIds.length === 0 ? {} : captureThumbs;

  const guidePhotosKey = guidePhotoIds.join(',');
  useEffect(() => {
    if (guidePhotoIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const pid of guidePhotoIds) {
        try { const p = await storage.getPhoto(pid); if (p && !cancelled) map[pid] = p.dataUrl; } catch { /* ignore */ }
      }
      if (!cancelled) setGuideThumbs(map);
    })();
    return () => { cancelled = true; };
  }, [guidePhotosKey, storage]); // eslint-disable-line react-hooks/exhaustive-deps

  const captureIdsKey = photoIds.join(',');
  useEffect(() => {
    if (photoIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const pid of photoIds) {
        try { const p = await storage.getPhoto(pid); if (p && !cancelled) map[pid] = p.dataUrl; } catch { /* ignore */ }
      }
      if (!cancelled) setCaptureThumbs(map);
    })();
    return () => { cancelled = true; };
  }, [captureIdsKey, storage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && handlers.addPhoto) { handlers.addPhoto(file); e.target.value = ''; }
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : undefined };

  return (
    <div ref={setNodeRef} style={style}>
      <ItemEditRow
        itemId={item.id}
        text={item.text}
        description={item.description}
        placeholder={placeholder}
        descriptionPlaceholder={descPlaceholder}
        showValidation={showValidation}
        dragHandle={
          <button {...attributes} {...listeners} style={{ touchAction: 'none' }}
            className="btn-icon w-5 h-5 cursor-grab active:cursor-grabbing text-tertiary hover:text-primary shrink-0">
            <GripVertical size={12} />
          </button>
        }
        extras={
          <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="btn-icon w-5 h-5 text-tertiary hover:text-accent shrink-0" title="Add photo">
            <Camera size={12} />
          </button>
        }
        onUpdateText={handlers.updateText}
        onUpdateDescription={handlers.updateDesc}
        onRemove={handlers.remove}
      />
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      {(hasGuides || hasImageLinks || hasCaptures) && (
        <div className={photoStyles['photo-zone']} onClick={(e) => e.stopPropagation()}>
          <div className={photoStyles['photo-strip']}>
            {guidePhotoIds.map((pid, i) => (
              <div key={pid} className={photoStyles['photo-thumb-wrap']}>
                {effectiveGuideThumbs[pid] ? (
                  <button onClick={() => handlers.viewPhotos?.(allPhotoIds, i)}
                    className={photoStyles['guide-photo-btn']}>
                    <img src={effectiveGuideThumbs[pid]} alt="guide"
                      className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-guide']}`} />
                    <span className={photoStyles['guide-badge']}>G</span>
                  </button>
                ) : (
                  <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']} ${photoStyles['photo-thumb-guide']}`}>
                    <ImageIcon size={12} />
                  </div>
                )}
              </div>
            ))}
            {imageLinks.map((url, i) => {
              const idx = guidePhotoIds.length + i;
              return (
                <div key={`${url}-${i}`} className={photoStyles['photo-thumb-wrap']}>
                  {brokenLinks.has(url) ? (
                    <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']} ${photoStyles['photo-thumb-guide']}`}>
                      <ImageIcon size={12} />
                    </div>
                  ) : (
                    <button onClick={() => handlers.viewPhotos?.(allPhotoIds, idx)}
                      className={photoStyles['guide-photo-btn']}>
                      <img src={url} alt="ai reference"
                        className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-guide']}`}
                        onError={() => setBrokenLinks(prev => new Set(prev).add(url))} />
                      <span className={photoStyles['ai-badge']}>AI</span>
                    </button>
                  )}
                </div>
              );
            })}
            {photoIds.map((pid, i) => {
              const idx = guidePhotoIds.length + imageLinks.length + i;
              return (
                <div key={pid} className={photoStyles['photo-thumb-wrap']}>
                  {effectiveCaptureThumbs[pid] ? (
                    <button onClick={() => handlers.viewPhotos?.(allPhotoIds, idx)}>
                      <img src={effectiveCaptureThumbs[pid]} alt="capture" className={photoStyles['photo-thumb']} />
                    </button>
                  ) : (
                    <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']}`}>
                      <ImageIcon size={12} />
                    </div>
                  )}
                  <button onClick={() => handlers.deletePhoto?.(pid)}
                    className={photoStyles['photo-thumb-delete']}>
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
