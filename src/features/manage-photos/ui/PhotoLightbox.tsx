import React, { useState, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStorage } from '@/shared/api';
import { useTranslation } from '@/shared/i18n';
import { ConfirmDialog, DialogPortal } from '@/shared/ui';
import { LightboxImage } from './LightboxImage';
import { LightboxNavigation } from './LightboxNavigation';
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
      <LightboxNavigation
        currentIndex={currentIndex}
        total={photoIds.length}
        onClose={onClose}
        onPrev={goPrev}
        onNext={goNext}
        onGoTo={setCurrentIndex}
      />

      <LightboxImage loading={loading} dataUrl={dataUrl} isZoomed={isZoomed} onClick={handleImageClick} />

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
