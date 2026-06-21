import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DialogPortal } from '../dialog-portal';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const springTransition = {
  type: 'spring' as const,
  damping: 28,
  stiffness: 400,
  mass: 0.8,
};

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, icon, children, footer }) => {
  return (
    <DialogPortal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="bottom-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="overlay-bottom"
            onClick={onClose}
          >
            <motion.div
              key="bottom-sheet"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '30%', opacity: 0 }}
              transition={springTransition}
              className={styles.sheet}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className={styles.header}>
                <span className={styles.title}>
                  {icon}
                  {title}
                </span>
                <button onClick={onClose} className={styles.closeBtn}>
                  <X size={14} />
                </button>
              </div>
              <div className={styles.body}>
                {children}
              </div>
              {footer && (
                <div className={styles.footer}>
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogPortal>
  );
};
