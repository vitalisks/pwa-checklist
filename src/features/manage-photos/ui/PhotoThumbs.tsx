import React from 'react';
import { ImageIcon, X } from 'lucide-react';
import photoStyles from '@/shared/styles/photo-zone.module.css';

interface GuidePhotoThumbProps {
  src?: string;
  onClick?: () => void;
  badgeLabel: string;
}

export const GuidePhotoThumb: React.FC<GuidePhotoThumbProps> = ({ src, onClick, badgeLabel }) => {
  if (!src) {
    return (
      <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']} ${photoStyles['photo-thumb-guide']}`}>
        <ImageIcon size={12} />
      </div>
    );
  }
  return (
    <button onClick={onClick} className={photoStyles['guide-photo-btn']}>
      <img src={src} alt="guide" className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-guide']}`} />
      <span className={photoStyles['guide-badge']}>{badgeLabel}</span>
    </button>
  );
};

interface AiPhotoThumbProps {
  url: string;
  isBroken: boolean;
  onClick?: () => void;
  onError: () => void;
}

export const AiPhotoThumb: React.FC<AiPhotoThumbProps> = ({ url, isBroken, onClick, onError }) => {
  if (isBroken) {
    return (
      <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']} ${photoStyles['photo-thumb-guide']}`}>
        <ImageIcon size={12} />
      </div>
    );
  }
  return (
    <button onClick={onClick} className={photoStyles['guide-photo-btn']}>
      <img src={url} alt="ai reference" className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-guide']}`} onError={onError} />
      <span className={photoStyles['ai-badge']}>AI</span>
    </button>
  );
};

interface CapturePhotoThumbProps {
  src?: string;
  onClick?: () => void;
  onDelete?: () => void;
}

export const CapturePhotoThumb: React.FC<CapturePhotoThumbProps> = ({ src, onClick, onDelete }) => {
  return (
    <div className={photoStyles['photo-thumb-wrap']}>
      {src ? (
        <button onClick={onClick}>
          <img src={src} alt="capture" className={photoStyles['photo-thumb']} />
        </button>
      ) : (
        <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']}`}>
          <ImageIcon size={12} />
        </div>
      )}
      {onDelete && (
        <button onClick={onDelete} className={photoStyles['photo-thumb-delete']}>
          <X size={10} />
        </button>
      )}
    </div>
  );
};
