import React, { useState, useEffect } from 'react';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStorage } from '@/shared/api';
import { useLanguage } from '@/shared/i18n';
import { ConfirmDialog } from '@/shared/ui';
import styles from './PhotoLightbox.module.css';

interface PhotoLightboxProps {
  photoIds: string[];
  startIndex: number;
  onClose: () => void;
  onDelete?: (photoId: string) => void;
}

const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ photoIds, startIndex, onClose, onDelete }) => {
  const { t } = useLanguage();
  const storage = useStorage();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
  }, [currentIndex, photoIds]);

  const goNext = () => {
    if (currentIndex < photoIds.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    setTouchStartX(null);
  };

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const handleDeleteClick = () => {
    if (!onDelete) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!onDelete) return;
    onDelete(photoIds[currentIndex]);
    setShowDeleteConfirm(false);
    if (photoIds.length <= 1) {
      onClose();
    } else if (currentIndex >= photoIds.length - 1) {
      setCurrentIndex(Math.max(0, currentIndex - 1));
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={styles.overlay}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute top-4 right-4 flex gap-3 z-10">
        {onDelete && !photoIds[currentIndex]?.startsWith('http') && (
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteClick(); }}
            className={styles.btn}
            title={t('item_delete_photo')}
          >
            <Trash2 size={20} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className={styles.btn}
        >
          <X size={20} />
        </button>
      </div>

      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className={styles['nav-btn']}
          style={{ left: 16 }}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {currentIndex < photoIds.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className={styles['nav-btn']}
          style={{ right: 16 }}
        >
          <ChevronRight size={28} />
        </button>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
        <div className="flex gap-1.5">
          {photoIds.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
            />
          ))}
        </div>
        <div className="text-white/50 text-xs">
          {currentIndex + 1} / {photoIds.length}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : dataUrl ? (
        <motion.img
          key={currentIndex}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
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

      {showDeleteConfirm && (
        <ConfirmDialog
          title={t('delete_confirm_title')}
          message={t('delete_confirm_msg')}
          confirmLabel={t('delete_confirm_action')}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </motion.div>
  );
};

export default PhotoLightbox;
