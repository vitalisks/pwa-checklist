import React, { useRef, useState, useLayoutEffect } from 'react';
import { Check, Circle, CircleSlash, Camera, Image, MessageSquarePlus, Trash2, X } from 'lucide-react';
import type { ChecklistItem } from '@/shared/config';
import { motion } from 'framer-motion';
import { useStorage } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { usePhotoThumbs } from '@/shared/lib/hooks/use-photo-thumbs';
import { PhotoList } from '@/features/manage-photos';
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
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [descClamped, setDescClamped] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const descRef = useRef<HTMLParagraphElement>(null);
  const hasDescription = !!item.description && item.description.length > 0;
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
  const hasComments = comments.length > 0;

  useLayoutEffect(() => {
    const el = descRef.current;
    if (el && hasDescription && !descExpanded) {
      setDescClamped(el.scrollHeight > el.clientHeight + 1);
    }
  }, [item.description, descExpanded, hasDescription]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddPhoto(file);
      e.target.value = '';
    }
  };

  const handleAddComment = () => {
    const text = commentText.trim();
    if (!text || !onAddComment) return;
    onAddComment(text);
    setCommentText('');
    setShowCommentInput(false);
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
    if (e.key === 'Escape') {
      setShowCommentInput(false);
      setCommentText('');
    }
  };

  const allPhotoIds = [...guideIds, ...imageLinks, ...captureIds];

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className={`${itemStyles['cl-item']} ${item.checked ? itemStyles['cl-item-checked'] : ''} ${item.skipped ? itemStyles['cl-item-skipped'] : ''}`}
      onClick={onToggleChecked}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {item.checked ? (
            <motion.div
              className="mt-0.5 shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <Check size={12} color="#fff" strokeWidth={3} />
              </div>
            </motion.div>
          ) : item.skipped ? (
            <CircleSlash size={20} className="text-warning shrink-0 mt-0.5" />
          ) : (
            <Circle size={20} className="text-tertiary shrink-0 mt-0.5" />
          )}

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
              onClick={(e) => {
                e.stopPropagation();
                setShowCommentInput(v => !v);
                setTimeout(() => commentInputRef.current?.focus(), 50);
              }}
              className={`${itemStyles['action-btn']} text-2xs px-2 bg-surface-1 text-tertiary border-subtle border rounded-sm`}
              title={t.item.addComment}
            >
              <MessageSquarePlus size={12} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
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
            <CircleSlash size={10} />
            <span>{t.checklist.skip}</span>
          </button>
        </div>
      </div>

      {hasDescription && (
        <div style={{ paddingLeft: '28px' }} className="mt-1">
          <p
            ref={descRef}
            className={`text-sm text-secondary leading-relaxed${descExpanded ? '' : ' line-clamp-3'}`}
          >
            {item.description}
          </p>
          {(descClamped || descExpanded) && (
            <button
              onClick={(e) => { e.stopPropagation(); setDescExpanded(!descExpanded); }}
              className="text-2xs text-accent mt-0.5 hover:underline"
            >
              {descExpanded ? t.common.seeLess : t.common.seeMore}
            </button>
          )}
        </div>
      )}

      {showCommentInput && onAddComment && (
        <div style={{ paddingLeft: '28px' }} className="mt-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <input
              ref={commentInputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              className="input text-xs flex-1"
              placeholder={t.item.commentPlaceholder}
            />
            <button
              onClick={handleAddComment}
              className="btn-icon text-accent"
              disabled={!commentText.trim()}
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => { setShowCommentInput(false); setCommentText(''); }}
              className="btn-icon text-tertiary"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {hasComments && (
        <div style={{ paddingLeft: '28px' }} className="mt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-2xs text-tertiary font-medium tracking-wide">{t.item.comments}</span>
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-1.5 group">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-secondary leading-relaxed whitespace-pre-wrap">{c.text}</p>
                <span className="text-2xs text-muted">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              {onDeleteComment && (
                <button
                  onClick={() => onDeleteComment(c.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 text-tertiary hover:text-danger"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

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
                      <button
                        onClick={() => onViewPhotos(allPhotoIds, guideIds.length + i)}
                        className={photoStyles['guide-photo-btn']}
                      >
                        <img
                          src={url}
                          alt="ai reference"
                          className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-guide']}`}
                          onError={() => setBrokenLinks((prev) => new Set(prev).add(url))}
                        />
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
