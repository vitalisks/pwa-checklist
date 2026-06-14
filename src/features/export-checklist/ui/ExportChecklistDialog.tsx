import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Share2, CheckCircle, AlertCircle } from 'lucide-react'
import type { Checklist } from '@/shared/config'
import { useTranslation } from '@/shared/i18n'
import { useChecklistExport } from '../model/use-checklist-export'
import styles from './ExportChecklistDialog.module.css'

interface ExportChecklistDialogProps {
  checklist: Checklist
  isOpen: boolean
  onClose: () => void
}

export const ExportChecklistDialog: React.FC<ExportChecklistDialogProps> = ({
  checklist,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation()
  const { state, containerRef, exportAsImage, exportAndShareImage, reset } = useChecklistExport()
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (state.status === 'success') {
      const timer = setTimeout(onClose, 1500)
      return () => clearTimeout(timer)
    }
  }, [state.status, onClose])

  useEffect(() => {
    if (!isOpen) { reset(); setComment(''); } // eslint-disable-line react-hooks/set-state-in-effect
  }, [isOpen, reset])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && state.status !== 'generating') onClose()
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
          >
            <motion.div
              className={styles.dialog}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {state.status === 'generating' ? (
                <div className={styles.status}>
                  <div className={styles.spinner} />
                  {t.export.generating}
                </div>
              ) : state.status === 'success' ? (
                <div className={styles.status}>
                  <CheckCircle size={36} className={styles.successIcon} />
                  {t.export.successImage}
                </div>
              ) : state.status === 'error' ? (
                <div className={styles.status}>
                  <AlertCircle size={36} className={styles.errorIcon} />
                  {state.errorMessage || t.export.error}
                </div>
              ) : (
                <>
                  <h3 className={styles.title}>{t.export.export}</h3>
                  <p className={styles.desc}>{checklist.title}</p>

                  <textarea
                    className={styles.commentInput}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t.export.commentPlaceholder}
                    rows={3}
                  />

                  <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={() => exportAsImage(checklist, comment || undefined)}>
                      <div className={styles.actionIcon}>
                        <Image size={16} />
                      </div>
                      <div className={styles.actionLabel}>
                        <span>{t.export.asImage}</span>
                      </div>
                    </button>

                    <button className={styles.actionBtn} onClick={() => exportAndShareImage(checklist, comment || undefined)}>
                      <div className={styles.actionIcon}>
                        <Share2 size={16} />
                      </div>
                      <div className={styles.actionLabel}>
                        <span>{t.export.shareImage}</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={containerRef} className={styles.hiddenContainer} />
    </>
  )
}
