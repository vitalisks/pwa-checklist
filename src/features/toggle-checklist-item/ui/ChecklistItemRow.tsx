import React, { useRef, useState } from 'react';
import { Camera, Image, MessageSquarePlus } from 'lucide-react';
import type { ChecklistItem } from '@/shared/config';
import { motion } from 'framer-motion';
import { useStorage } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { usePhotoThumbs } from '@/shared/lib/hooks/use-photo-thumbs';
import { PhotoList } from '@/features/manage-photos';
import { ItemStatusIcon } from './ItemStatusIcon';
import { ItemDescription } from './ItemDescription';
import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';
import itemStyles from './ChecklistItemRow.module.css';
import photoStyles from '@/shared/styles/photo-zone.module.css';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggleChecked: () => void;
  onToggleSkipped: () => void;
  onAddPhoto: (file: File) => void;
  onDeletePhoto: (photoId: string) => void;
  onViewPhotos: (photoIds: string[], startIndex: number) => void;
  onAddComment?: (text: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

const ChecklistItemRow: React.FC<ChecklistItemRowProps> = ({
  item,
  onToggleChecked,
  onToggleSkipped,
  onAddPhoto,
  onDeletePhoto,
  onViewPhotos,
  onAddComment,
  onDeleteComment,
}) => {
  const { t } = useTranslation();
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const guideIds = item.guidePhotoIds || [];
  const captureIds = item.photoIds || [];
  const hasGuides = guideIds.length > 0;
  const hasCaptures = captureIds.length > 0;
  const imageLinks = item.imageLinks || [];
  const [brokenLinks, setBrokenLinks] = useState<Set<string>>(new Set());
  const hasImageLinks = imageLinks.length > 0;
  const { thumbs: guideThumbs, loading: loadingGuides } = usePhotoThumbs(guideIds, storage);
  const { thumbs: captureThumbs } = usePhotoThumbs(captureIds, storage);
  const effectiveGuideThumbs = guideIds.length === 0 ? {} : guideThumbs;
  const effectiveCaptureThumbs = captureIds.length === 0 ? {} : captureThumbs;
  const comments = item.comments || [];

  const allPhotoIds = [...guideIds, ...imageLinks, ...captureIds];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddPhoto(file);
      e.target.value = '';
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className={`${itemStyles['cl-item']} ${item.checked ? itemStyles['cl-item-checked'] : ''} ${item.skipped ? itemStyles['cl-item-skipped'] : ''}`}
      onClick={onToggleChecked}
    >
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <ItemStatusIcon checked={item.checked} skipped={!!item.skipped} />
          <div className="flex flex-col min-w-0 flex-1">
            <span className={`text-sm font-medium ${item.checked ? 'line-through text-secondary' : item.skipped ? 'italic text-secondary' : ''}`}>
              {item.text}
            </span>
            {item.skipped && (
              <span className="text-2xs text-warning font-semibold tracking-wide mt-0.5">
                {t.checklist.itemSkipped}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-1.5 shrink-0">
          {onAddComment && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowCommentInput(v => !v); }}
              className={`${itemStyles['action-btn']} text-2xs px-2 bg-surface-1 text-tertiary border-subtle border rounded-sm`}
              title={t.item.addComment}
            >
              <MessageSquarePlus size={12} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className={`${photoStyles['photo-add-btn-sm']} ${itemStyles['action-btn']}`}
            title={t.item.addPhoto}
          >
            <Camera size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSkipped(); }}
            className={`${itemStyles['action-btn']} text-2xs px-2 ${item.skipped ? 'bg-warning-subtle text-warning border-warning-subtle' : 'bg-surface-1 text-tertiary border-subtle'} border rounded-sm`}
            title={t.checklist.skip}
          >
            <span>{t.checklist.skip}</span>
          </button>
        </div>
      </div>

      <ItemDescription description={item.description} />

      {showCommentInput && onAddComment && (
        <div onClick={(e) => e.stopPropagation()}>
          <CommentInput onAddComment={(text) => { onAddComment(text); setShowCommentInput(false); }} />
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        <CommentList comments={comments} onDeleteComment={onDeleteComment} />
      </div>

      {(hasGuides || hasImageLinks || hasCaptures) && (
        <div className={photoStyles['photo-zone']} onClick={(e) => e.stopPropagation()}>
          {hasGuides && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={photoStyles['photo-zone-label']}>{t.item.guidePhoto}</div>
                {loadingGuides && (
                  <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className={photoStyles['photo-strip']}>
                {guideIds.map((pid, i) => (
                  <div key={pid} className={photoStyles['photo-thumb-wrap']}>
                    {loadingGuides || !effectiveGuideThumbs[pid] ? (
                      <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']} ${photoStyles['photo-thumb-guide']}`}>
                        <Image size={12} />
                      </div>
                    ) : (
                      <button onClick={() => onViewPhotos(allPhotoIds, i)} className={photoStyles['guide-photo-btn']}>
                        <img src={effectiveGuideThumbs[pid]} alt="guide" className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-guide']}`} />
                        <span className={photoStyles['guide-badge']}>{t.item.guidePhotoBadge}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasImageLinks && (
            <div className={hasGuides ? 'mt-2' : ''}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={photoStyles['photo-zone-label']}>AI</div>
              </div>
              <div className={photoStyles['photo-strip']}>
                {imageLinks.map((url, i) => (
                  <div key={`${url}-${i}`} className={photoStyles['photo-thumb-wrap']}>
                    {brokenLinks.has(url) ? (
                      <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']} ${photoStyles['photo-thumb-guide']}`}>
                        <Image size={12} />
                      </div>
                    ) : (
                      <button onClick={() => onViewPhotos(allPhotoIds, guideIds.length + i)} className={photoStyles['guide-photo-btn']}>
                        <img src={url} alt="ai reference" className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-guide']}`}
                          onError={() => setBrokenLinks((prev) => new Set(prev).add(url))} />
                        <span className={photoStyles['ai-badge']}>AI</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasCaptures && (
            <div className={(hasGuides || hasImageLinks) ? 'mt-2' : ''}>
              <div className={photoStyles['photo-zone-label']}>{t.item.yourPhoto}</div>
              <div className={photoStyles['photo-strip']}>
                <PhotoList
                  photoIds={captureIds}
                  thumbs={effectiveCaptureThumbs}
                  onView={(i) => onViewPhotos(allPhotoIds, guideIds.length + imageLinks.length + i)}
                  onDelete={(pid) => onDeletePhoto(pid)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ChecklistItemRow;
