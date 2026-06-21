import React from 'react';
import { motion } from 'framer-motion';

interface LightboxImageProps {
  loading: boolean;
  dataUrl: string | null;
  isZoomed: boolean;
  onClick: () => void;
}

export const LightboxImage: React.FC<LightboxImageProps> = ({ loading, dataUrl, isZoomed, onClick }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (dataUrl) {
    return (
      <motion.img
        key={dataUrl}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        src={dataUrl}
        alt="checklist item"
        className={`max-w-full max-h-full rounded-md object-contain select-none ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        draggable={false}
      />
    );
  }

  return <div className="text-white/40 text-sm" onClick={(e) => e.stopPropagation()}>No image</div>;
};
