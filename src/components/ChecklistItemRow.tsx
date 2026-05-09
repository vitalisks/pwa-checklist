import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Check, Circle, CircleSlash, Camera, Image, X } from 'lucide-react';
import { ChecklistItem } from '../types';
import { motion } from 'framer-motion';
import { storageService } from '../services/storage';

import { useLanguage } from '../hooks/useLanguage';
import itemStyles from './ChecklistItemRow.module.css';
import photoStyles from '../styles/photo-zone.module.css';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggleChecked: () => void;
  onToggleSkipped: () => void;
  onAddPhoto: (file: File) => void;
  onDeletePhoto: (photoId: string) => void;
  onViewPhotos: (photoIds: string[], startIndex: number) => void;
}

const ChecklistItemRow: React.FC<ChecklistItemRowProps> = ({
  item,
  onToggleChecked,
  onToggleSkipped,
  onAddPhoto,
  onDeletePhoto,
  onViewPhotos,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [guideThumbs, setGuideThumbs] = useState<Record<string, string>>({});
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [captureThumbs, setCaptureThumbs] = useState<Record<string, string>>({});
  const [descExpanded, setDescExpanded] = useState(false);
  const [descClamped, setDescClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const isProcessed = item.checked || !!item.skipped;
  const hasDescription = !!item.description && item.description.length > 0;
  const guideIds = item.guidePhotoIds || [];
  const captureIds = item.photoIds || [];
  const hasGuides = guideIds.length > 0;
  const hasCaptures = captureIds.length > 0;

  useEffect(() => {
    if (guideIds.length === 0) { setGuideThumbs({}); return; }
    let cancelled = false;
    setLoadingGuides(true);
    const load = async () => {
      const map: Record<string, string> = {};
      for (const pid of guideIds) {
        try {
          const photo = await storageService.getPhoto(pid);
          if (photo && !cancelled) map[pid] = photo.dataUrl;
        } catch {
          // ignore
        }
      }
      if (!cancelled) {
        setGuideThumbs(map);
        setLoadingGuides(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [guideIds.join(',')]);

  useEffect(() => {
    if (captureIds.length === 0) { setCaptureThumbs({}); return; }
    let cancelled = false;
    const load = async () => {
      const map: Record<string, string> = {};
      for (const pid of captureIds) {
        try {
          const photo = await storageService.getPhoto(pid);
          if (photo && !cancelled) map[pid] = photo.dataUrl;
        } catch {
          // ignore
        }
      }
      if (!cancelled) setCaptureThumbs(map);
    };
    load();
    return () => { cancelled = true; };
  }, [captureIds.join(',')]);

  useLayoutEffect(() => {
    if (descRef.current && !descExpanded) {
      setDescClamped(descRef.current.scrollHeight > descRef.current.clientHeight);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.description]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddPhoto(file);
      e.target.value = '';
    }
  };

  const allPhotoIds = [...guideIds, ...captureIds];

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
                <Check size={12} style={{ color: 'var(--canvas)' }} strokeWidth={3} />
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
            {hasDescription && (
              <div>
                <p
                  ref={descRef}
                  className={`text-xs text-tertiary leading-relaxed mt-0.5${descExpanded ? '' : ' line-clamp-3'}`}
                >
                  {item.description}
                </p>
                {(descClamped || descExpanded) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDescExpanded(!descExpanded); }}
                    className="text-2xs text-accent mt-0.5 hover:underline"
                  >
                    {descExpanded ? t('see_less') : t('see_more')}
                  </button>
                )}
              </div>
            )}
            {item.skipped && (
              <span className="text-2xs text-warning font-semibold tracking-wide mt-0.5">
                {t('checklist_item_skipped')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-1.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className={photoStyles['photo-add-btn-sm']}
            title={t('item_add_photo')}
          >
            <Camera size={14} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleSkipped(); }}
            className={`px-2 py-1 text-2xs ${item.skipped ? 'bg-warning-subtle text-warning border-warning-subtle' : 'bg-surface-1 text-tertiary border-subtle'} border rounded-sm flex items-center gap-1`}
            title={t('checklist_skip')}
          >
            <CircleSlash size={10} />
            <span>{t('checklist_skip')}</span>
          </button>
        </div>
      </div>

      {(hasGuides || hasCaptures) && (
        <div className={photoStyles['photo-zone']} onClick={(e) => e.stopPropagation()}>
          {hasGuides && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={photoStyles['photo-zone-label']}>{t('item_guide_photo')}</div>
                {loadingGuides && (
                  <div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className={photoStyles['photo-strip']}>
                {guideIds.map((pid, i) => (
                  <div key={pid} className={photoStyles['photo-thumb-wrap']}>
                    {loadingGuides || !guideThumbs[pid] ? (
                      <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']} ${photoStyles['photo-thumb-guide']}`}>
                        <Image size={12} />
                      </div>
                    ) : (
                      <button onClick={() => onViewPhotos(allPhotoIds, i)} className={photoStyles['guide-photo-btn']}>
                        <img src={guideThumbs[pid]} alt="guide" className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-guide']}`} />
                        <span className={photoStyles['guide-badge']}>{t('item_guide_photo_badge')}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasCaptures && (
            <div className={hasGuides ? 'mt-2' : ''}>
              <div className={photoStyles['photo-zone-label']}>{t('item_your_photo')}</div>
              <div className={photoStyles['photo-strip']}>
                {captureIds.map((pid, i) => (
                  <div key={pid} className={photoStyles['photo-thumb-wrap']}>
                    {captureThumbs[pid] ? (
                      <button onClick={() => onViewPhotos(allPhotoIds, guideIds.length + i)}>
                        <img src={captureThumbs[pid]} alt="capture" className={photoStyles['photo-thumb']} />
                      </button>
                    ) : (
                      <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']}`}>
                        <Image size={12} />
                      </div>
                    )}
                    <button
                      onClick={() => onDeletePhoto(pid)}
                      className={photoStyles['photo-thumb-delete']}
                      title={t('item_delete_photo')}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ChecklistItemRow;