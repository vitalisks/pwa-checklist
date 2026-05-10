import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/shared/i18n';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={styles.overlay}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.title}>{title}</div>
        <div className={styles.message} style={{ whiteSpace: 'pre-line' }}>{message}</div>
        <div className={styles.actions}>
          <button onClick={onCancel} className="btn btn-ghost">
            {t('action_cancel')}
          </button>
          <button onClick={onConfirm} className={`btn ${variant === 'warning' ? 'btn-primary' : 'btn-danger'}`}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmDialog;
