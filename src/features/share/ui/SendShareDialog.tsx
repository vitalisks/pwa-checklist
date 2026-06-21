import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/shared/i18n';
import { useShare } from '../model';
import { BottomSheet } from '@/shared/ui';
import type { Contact, Template, Checklist } from '@/shared/config';
import { Send, Check, Loader } from 'lucide-react';
import { compressDataUrl, estimateBase64Size } from '@/shared/lib/image/compressImage';
import { PhotoRepository } from '@/entities/photo';
import { useStorage } from '@/shared/api';
import { SendShareHeader } from './SendShareHeader';
import { PhotoSelectionGrid } from './PhotoSelectionGrid';
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

  const sheetTitle = <>{t.share.sendTo} <span className={styles.titleHighlight}>{contact.name}</span></>;

  const sheetFooter = done ? (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.successState}
    >
      <Check size={18} className={styles.successIcon} />
      {t.share.sentSuccess}
    </motion.div>
  ) : (
    <>
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
    </>
  );

  return (
    <BottomSheet isOpen onClose={onClose} title={sheetTitle} footer={sheetFooter}>
      <div className={styles.body}>
        <SendShareHeader contact={contact} itemType={itemType} title={title} typeLabel={itemType === 'template' ? t.templates.title : t.nav.home} />

        {photosState.loading && (
          <div className={styles.photosLoading}>
            <Loader size={16} className={styles.loadingSpinner} />
            <span>{t.share.loadingPhotos}</span>
          </div>
        )}

        <PhotoSelectionGrid
          entries={photosState.entries}
          selectedIds={photosState.selectedIds}
          tooLargeError={photosState.tooLargeError}
          totalSizeKb={totalSizeKb}
          photosLabel={t.share.photos}
          onToggle={togglePhoto}
        />

        {sendError && <div className={styles.error}>{sendError}</div>}
      </div>
    </BottomSheet>
  );
};

export default SendShareDialog;