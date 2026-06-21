import React from 'react';
import { Image, AlertCircle } from 'lucide-react';
import styles from './SendShareDialog.module.css';

interface PhotoEntry {
  id: string;
  dataUrl: string;
  sizeKb: number;
  selected: boolean;
  tooLarge: boolean;
}

interface Props {
  entries: PhotoEntry[];
  selectedIds: Set<string>;
  tooLargeError: string | null;
  totalSizeKb: number;
  photosLabel: string;
  onToggle: (id: string) => void;
}

export const PhotoSelectionGrid: React.FC<Props> = ({
  entries, selectedIds, tooLargeError, totalSizeKb, photosLabel, onToggle,
}) => {
  if (entries.length === 0) return null;

  return (
    <div className={styles.photosSection}>
      <div className={styles.photosSectionHeader}>
        <Image size={12} />
        <span>{photosLabel} ({selectedIds.size}/{entries.length})</span>
        <span className={styles.totalSize}>{totalSizeKb}KB</span>
      </div>
      <div className={styles.photosGrid}>
        {entries.map((entry) => (
          <button
            key={entry.id}
            className={`${styles.photoThumb} ${entry.tooLarge ? styles.photoThumbTooLarge : ''} ${!selectedIds.has(entry.id) ? styles.photoThumbDeselected : ''}`}
            onClick={() => onToggle(entry.id)}
            title={entry.id}
          >
            <img src={entry.dataUrl} alt="" />
            <span className={`${styles.photoSize} ${entry.tooLarge ? styles.photoSizeDanger : entry.sizeKb > 100 ? styles.photoSizeWarning : styles.photoSizeOk}`}>
              {entry.sizeKb}KB
            </span>
            {!selectedIds.has(entry.id) && (
              <span className={styles.photoDimmed} />
            )}
          </button>
        ))}
      </div>
      {tooLargeError && (
        <div className={styles.photoError}>
          <AlertCircle size={12} />
          <span>{tooLargeError}</span>
        </div>
      )}
    </div>
  );
};
