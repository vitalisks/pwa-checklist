import React, { useState, useEffect, useCallback } from 'react';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStorage } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { ConfirmDialog, DialogPortal } from '@/shared/ui';
import styles from './PhotoLightbox.module.css';

interface PhotoLightboxProps {
  photoIds: string[];
  startIndex: number;
  onClose: () => void;
  onDelete?: (photoId: string) => void;
}

const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ photoIds, startIndex, onClose, onDelete }) => {
  const { t } = useTranslation();
  const storage = useStorage();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const currentId = photoIds[currentIndex];
    if (!currentId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setIsZoomed(false);
      if (currentId.startsWith('http://') || currentId.startsWith('https://')) {
        if (!cancelled) {
          setDataUrl(currentId);
          setLoading(false);
        }
        return;
      }
      const photo = await storage.getPhoto(currentId);
      if (!cancelled) {
        setDataUrl(photo?.dataUrl || null);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [currentIndex, photoIds, storage]);

  const goNext = useCallback(() => {
    if (currentIndex < photoIds.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, photoIds.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    setTouchStartX(null);
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  }, [touchStartX, goNext, goPrev]);

  const handleImageClick = useCallback(() => {
    setIsZoomed(v => !v);
  }, []);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;
    setShowDeleteConfirm(true);
  }, [onDelete]);

  const handleConfirmDelete = useCallback(() => {
    if (!onDelete) return;
    onDelete(photoIds[currentIndex]);
    setShowDeleteConfirm(false);
    if (photoIds.length <= 1) {
      onClose();
    } else if (currentIndex >= photoIds.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  }, [onDelete, photoIds, currentIndex, onClose]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photoIds.length - 1;
  const canDelete = onDelete && !photoIds[currentIndex]?.startsWith('http');

  return (
    <DialogPortal>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={styles.overlay}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={styles.topBar}>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className={styles.iconBtn}>
          <X size={20} />
        </button>
        <span className={styles.position}>{currentIndex + 1} / {photoIds.length}</span>
        <div style={{ width: 36 }} />
      </div>

      {hasPrev && (
        <div
          className={styles.navZone}
          style={{ left: 0 }}
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
        />
      )}
      {hasNext && (
        <div
          className={styles.navZone}
          style={{ right: 0 }}
          onClick={(e) => { e.stopPropagation(); goNext(); }}
        />
      )}

      <div className={styles.bottomBar}>
        <div className={styles.navGroup}>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className={styles.navBtn}
            style={{ opacity: hasPrev ? 1 : 0.2, pointerEvents: hasPrev ? 'auto' : 'none' }}
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        <div className={styles.dots}>
          {photoIds.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''}`}
            />
          ))}
        </div>

        <div className={styles.navGroup}>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className={styles.navBtn}
            style={{ opacity: hasNext ? 1 : 0.2, pointerEvents: hasNext ? 'auto' : 'none' }}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : dataUrl ? (
        <motion.img
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          src={dataUrl}
          alt="checklist item"
          className={`max-w-full max-h-full rounded-md object-contain select-none ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={(e) => { e.stopPropagation(); handleImageClick(); }}
          draggable={false}
        />
      ) : (
        <div className="text-white/40 text-sm" onClick={(e) => e.stopPropagation()}>No image</div>
      )}

      {canDelete && (
        <button
          onClick={handleDeleteClick}
          className={styles.iconBtn}
          style={{
            position: 'fixed', right: 12, bottom: 72, zIndex: 101,
          }}
          title={t.item.deletePhoto}
        >
          <Trash2 size={18} />
        </button>
      )}

      {showDeleteConfirm && (
        <ConfirmDialog
          title={t.common.delete.confirmTitle}
          message={t.common.delete.confirmMsg}
          confirmLabel={t.common.delete.confirmAction}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </motion.div>
    </DialogPortal>
  );
};

export default PhotoLightbox;
