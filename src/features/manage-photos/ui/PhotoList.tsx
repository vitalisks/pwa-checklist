import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { ConfirmDialog } from '@/shared/ui';
import photoStyles from '@/shared/styles/photo-zone.module.css';

/**
 * PhotoList — reusable photo thumbnail strip with delete confirmation.
 *
 * Props:
 *   photoIds – array of IndexedDB photo IDs
 *   thumbs   – { [photoId]: dataUrl } — pre-loaded thumbnails
 *   onView   – (index) => void — called when user taps a thumbnail
 *   onDelete – (photoId) => void — called after delete is confirmed
 *
 * Deletion shows a ConfirmDialog before firing onDelete.
 * Each thumbnails uses photo-zone.module.css (.photo-thumb, .photo-thumb-delete).
 */

interface PhotoListProps {
  photoIds: string[];
  thumbs: Record<string, string>;
  onView: (index: number) => void;
  onDelete: (photoId: string) => void;
}

const PhotoList: React.FC<PhotoListProps> = ({ photoIds, thumbs, onView, onDelete }) => {
  const { t } = useTranslation();
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);

  return (
    <>
      {photoIds.map((pid, i) => (
        <div key={pid} className={photoStyles['photo-thumb-wrap']}>
          {thumbs[pid] ? (
            <button onClick={() => onView(i)} className={photoStyles['guide-photo-btn']}>
              <img src={thumbs[pid]} alt="" className={photoStyles['photo-thumb']} />
            </button>
          ) : (
            <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']}`}>
              <ImageIcon size={12} />
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDeletePhotoId(pid); }}
            className={photoStyles['photo-thumb-delete']}
            title={t.item.deletePhoto}
          >
            <X size={10} />
          </button>
        </div>
      ))}
      {confirmDeletePhotoId && (
        <ConfirmDialog
          title={t.common.delete.confirmTitle}
          message={t.common.delete.confirmMsg}
          confirmLabel={t.common.delete.confirmAction}
          onConfirm={() => { onDelete(confirmDeletePhotoId); setConfirmDeletePhotoId(null); }}
          onCancel={() => setConfirmDeletePhotoId(null)}
        />
      )}
    </>
  );
};

export default PhotoList;
