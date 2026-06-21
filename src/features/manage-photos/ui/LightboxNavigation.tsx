import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './PhotoLightbox.module.css';

interface LightboxNavigationProps {
  currentIndex: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
}

export const LightboxNavigation: React.FC<LightboxNavigationProps> = ({
  currentIndex, total, onClose, onPrev, onNext, onGoTo,
}) => {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < total - 1;

  return (
    <>
      <div className={styles.topBar}>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className={styles.iconBtn}>
          <X size={20} />
        </button>
        <span className={styles.position}>{currentIndex + 1} / {total}</span>
        <div style={{ width: 36 }} />
      </div>

      {hasPrev && (
        <div
          className={styles.navZone}
          style={{ left: 0 }}
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
        />
      )}
      {hasNext && (
        <div
          className={styles.navZone}
          style={{ right: 0 }}
          onClick={(e) => { e.stopPropagation(); onNext(); }}
        />
      )}

      <div className={styles.bottomBar}>
        <div className={styles.navGroup}>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className={styles.navBtn}
            style={{ opacity: hasPrev ? 1 : 0.2, pointerEvents: hasPrev ? 'auto' : 'none' }}
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        <div className={styles.dots}>
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onGoTo(i); }}
              className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''}`}
            />
          ))}
        </div>

        <div className={styles.navGroup}>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className={styles.navBtn}
            style={{ opacity: hasNext ? 1 : 0.2, pointerEvents: hasNext ? 'auto' : 'none' }}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </>
  );
};
