import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/shared/i18n';
import { useShare } from '../model';
import { DialogPortal } from '@/shared/ui';
import { getAvatarColor, getInitials } from '@/shared/lib';
import type { Contact, Template, Checklist } from '@/shared/config';
import { X, Send, Check, FileText, ClipboardList, Image, AlertCircle, Loader } from 'lucide-react';
import { compressDataUrl, estimateBase64Size } from '@/shared/lib/image/compressImage';
import { PhotoRepository } from '@/entities/photo';
import { useStorage } from '@/shared/api';
import styles from './SendShareDialog.module.css';

interface Props {
  contact: Contact;
  item: Template | Checklist;
  itemType: 'template' | 'checklist';
  onClose: () => void;
}

interface PhotoEntry {
  id: string;
  dataUrl: string;
  sizeKb: number;
  selected: boolean;
  tooLarge: boolean;
}

const SHARE_MAX_PHOTO_KB = 150;
const SHARE_MAX_WIDTH = 480;
const SHARE_QUALITY = 0.8;

function getAllPhotoIds(item: Template | Checklist, itemType: 'template' | 'checklist'): string[] {
  const ids: string[] = [];
  if (itemType === 'template') {
    const tpl = item as Template;
    for (const cat of tpl.categories) {
      for (const item of cat.items) {
        if (item.photoIds) ids.push(...item.photoIds);
      }
    }
  } else {
    const cl = item as Checklist;
    for (const cat of cl.categories) {
      for (const item of cat.items) {
        if (item.photoIds) ids.push(...item.photoIds);
        if (item.guidePhotoIds) ids.push(...item.guidePhotoIds);
      }
    }
  }
  return [...new Set(ids)];
}

const SendShareDialog: React.FC<Props> = ({ contact, item, itemType, onClose }) => {
  const { shareChecklist, shareTemplate } = useShare();
  const storage = useStorage();
  const photoRepo = useMemo(() => new PhotoRepository(storage), [storage]);
  const { t } = useTranslation();

  const [photosState, setPhotosState] = useState<{
    entries: PhotoEntry[];
    loading: boolean;
    tooLargeError: string | null;
    selectedIds: Set<string>;
  }>(() => {
    const photoIds = getAllPhotoIds(item, itemType);
    if (photoIds.length === 0) {
      return { entries: [], loading: false, tooLargeError: null, selectedIds: new Set() };
    }
    return { entries: [], loading: true, tooLargeError: null, selectedIds: new Set() };
  });

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const photoIds = getAllPhotoIds(item, itemType);
    if (photoIds.length === 0) return;

    let cancelled = false;

    (async () => {
      const entries: PhotoEntry[] = [];
      let firstTooLarge: string | null = null;

      await Promise.all(
        photoIds.map(async (id) => {
          const photo = await photoRepo.get(id);
          if (!photo || cancelled) return;

          const compressed = await compressDataUrl(photo.dataUrl, SHARE_MAX_WIDTH, SHARE_QUALITY);
          if (cancelled) return;

          const sizeKb = Math.round(estimateBase64Size(compressed) / 1024);
          const tooLarge = sizeKb > SHARE_MAX_PHOTO_KB;
          if (tooLarge && !firstTooLarge) firstTooLarge = id;

          entries.push({ id, dataUrl: compressed, sizeKb, selected: true, tooLarge });
        }),
      );

      if (!cancelled) {
        const selectedIds = new Set(
          entries.filter((e) => !e.tooLarge).map((e) => e.id),
        );
        setPhotosState({
          entries,
          loading: false,
          tooLargeError: firstTooLarge
            ? `${t.share.photoTooLarge} (${entries.find((e) => e.id === firstTooLarge)?.sizeKb ?? 0}KB > ${SHARE_MAX_PHOTO_KB}KB)`
            : null,
          selectedIds,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item, itemType, photoRepo, t]);

  const totalSizeKb = useMemo(() => {
    return photosState.entries
      .filter((e) => photosState.selectedIds.has(e.id))
      .reduce((sum, e) => sum + e.sizeKb, 0);
  }, [photosState.entries, photosState.selectedIds]);

  const togglePhoto = (id: string) => {
    setPhotosState((prev) => {
      const next = new Set(prev.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { ...prev, selectedIds: next };
    });
  };

  const handleSend = async () => {
    setSending(true);
    setSendError(null);

    const photosToSend = photosState.loading
      ? undefined
      : Object.fromEntries(
          photosState.entries
            .filter((e) => photosState.selectedIds.has(e.id))
            .map((e) => [e.id, e.dataUrl]),
        );

    const ok = itemType === 'checklist'
      ? await shareChecklist(contact, item as Checklist, photosToSend)
      : await shareTemplate(contact, item as Template, photosToSend);

    if (ok) {
      setDone(true);
      setTimeout(onClose, 1400);
    } else {
      setSendError(t.share.sendError);
    }
    setSending(false);
  };

  const title = 'title' in item ? item.title : 'Untitled';
  const canSend =
    !photosState.loading &&
    !photosState.tooLargeError &&
    (photosState.entries.length === 0 || photosState.selectedIds.size > 0);

  return (
    <DialogPortal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={styles.overlay}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '30%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 400, mass: 0.8 }}
            className={styles.sheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.handle} />

            <div className={styles.header}>
              <span className={styles.title}>
                {t.share.sendTo} <span className={styles.titleHighlight}>{contact.name}</span>
              </span>
              <button onClick={onClose} className={styles.closeBtn}>
                <X size={14} />
              </button>
            </div>

            <div className={styles.body}>
              <div className={styles.recipientRow}>
                <div className={styles.avatar} style={{ background: getAvatarColor(contact.deviceId) }}>
                  {getInitials(contact.name)}
                </div>
                <div>
                  <div className={styles.recipientName}>{contact.name}</div>
                  <div className={styles.recipientLabel}>{contact.deviceId.slice(0, 8)}</div>
                </div>
              </div>

              <div className={styles.itemPreview}>
                <div className={`${styles.itemIcon} ${itemType === 'template' ? styles.itemIconTemplate : styles.itemIconChecklist}`}>
                  {itemType === 'template' ? <FileText size={18} /> : <ClipboardList size={18} />}
                </div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemTitle}>{title}</div>
                  <div className={`${styles.itemType} ${itemType === 'template' ? styles.itemTypeTemplate : styles.itemTypeChecklist}`}>
                    {itemType === 'template' ? t.templates.title : t.nav.home}
                  </div>
                </div>
              </div>

              {photosState.loading && (
                <div className={styles.photosLoading}>
                  <Loader size={16} className={styles.loadingSpinner} />
                  <span>{t.share.loadingPhotos}</span>
                </div>
              )}

              {!photosState.loading && photosState.entries.length > 0 && (
                <div className={styles.photosSection}>
                  <div className={styles.photosSectionHeader}>
                    <Image size={12} />
                    <span>{t.share.photos} ({photosState.selectedIds.size}/{photosState.entries.length})</span>
                    <span className={styles.totalSize}>{totalSizeKb}KB</span>
                  </div>
                  <div className={styles.photosGrid}>
                    {photosState.entries.map((entry) => (
                      <button
                        key={entry.id}
                        className={`${styles.photoThumb} ${entry.tooLarge ? styles.photoThumbTooLarge : ''} ${!photosState.selectedIds.has(entry.id) ? styles.photoThumbDeselected : ''}`}
                        onClick={() => togglePhoto(entry.id)}
                        title={entry.id}
                      >
                        <img src={entry.dataUrl} alt="" />
                        <span className={`${styles.photoSize} ${entry.tooLarge ? styles.photoSizeDanger : entry.sizeKb > 100 ? styles.photoSizeWarning : styles.photoSizeOk}`}>
                          {entry.sizeKb}KB
                        </span>
                        {!photosState.selectedIds.has(entry.id) && (
                          <span className={styles.photoDimmed} />
                        )}
                      </button>
                    ))}
                  </div>
                  {photosState.tooLargeError && (
                    <div className={styles.photoError}>
                      <AlertCircle size={12} />
                      <span>{photosState.tooLargeError}</span>
                    </div>
                  )}
                </div>
              )}

              {sendError && <div className={styles.error}>{sendError}</div>}
            </div>

            {done ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.successState}
              >
                <Check size={18} className={styles.successIcon} />
                {t.share.sentSuccess}
              </motion.div>
            ) : (
              <div className={styles.footer}>
                <button onClick={onClose} className={styles.cancelBtn}>
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !canSend}
                  className={styles.sendBtn}
                >
                  {sending ? (
                    <div className={styles.spinner} />
                  ) : (
                    <>
                      <Send size={14} />
                      {t.share.send}
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </DialogPortal>
  );
};

export default SendShareDialog;