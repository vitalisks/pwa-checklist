import React, { useMemo, useState } from 'react';
import { ChevronLeft, CheckCircle, Trash2, Pencil, Check, X } from 'lucide-react';
import { Checklist } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import ChecklistProgressBar from './ChecklistProgressBar';
import ChecklistItemRow from './ChecklistItemRow';
import PhotoLightbox from './PhotoLightbox';
import ConfirmDialog from './ConfirmDialog';

import { useLanguage } from '../hooks/useLanguage';

interface ChecklistViewProps {
  checklist: Checklist;
  onUpdateTitle: (checklist: Checklist, newTitle: string) => void;
  onToggleItem: (checklist: Checklist, categoryId: string, itemId: string, field: 'checked' | 'skipped') => void;
  onAddPhoto: (checklist: Checklist, categoryId: string, itemId: string, file: File) => void;
  onDeletePhoto: (checklist: Checklist, categoryId: string, itemId: string, photoId: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

interface LightboxState {
  photoIds: string[];
  startIndex: number;
  categoryId: string;
  itemId: string;
  canDelete: boolean;
}

const ChecklistView: React.FC<ChecklistViewProps> = ({
  checklist,
  onUpdateTitle,
  onToggleItem,
  onAddPhoto,
  onDeletePhoto,
  onDelete,
  onBack,
}) => {
  const { t, language } = useLanguage();
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(checklist.title);

  const handleSaveTitle = () => {
    if (titleValue.trim() && titleValue !== checklist.title) {
      onUpdateTitle(checklist, titleValue.trim());
    } else {
      setTitleValue(checklist.title);
    }
    setEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setTitleValue(checklist.title);
    setEditingTitle(false);
  };

  const { totalItems, processedItems, progress } = useMemo(() => {
    const total = checklist.categories.reduce((acc, cat) => acc + cat.items.length, 0);
    const processed = checklist.categories.reduce(
      (acc, cat) => acc + cat.items.filter((i) => i.checked || i.skipped).length,
      0
    );
    return {
      totalItems: total,
      processedItems: processed,
      progress: total > 0 ? (processed / total) * 100 : 0,
    };
  }, [checklist]);

  const isCompleted = progress === 100 && checklist.status !== 'completed';

  const handleViewPhotos = (photoIds: string[], startIndex: number, categoryId: string, itemId: string, canDelete: boolean) => {
    setLightbox({ photoIds, startIndex, categoryId, itemId, canDelete });
  };

  const handleDeletePhoto = (photoId: string) => {
    if (lightbox) {
      onDeletePhoto(checklist, lightbox.categoryId, lightbox.itemId, photoId);
      if (lightbox.photoIds.length <= 1) {
        setLightbox(null);
      }
    }
  };

  const handleDeleteChecklist = () => {
    onDelete(checklist.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-icon hover:text-accent">
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="btn-icon btn-icon-danger"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="card">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {checklist.templateTitle && (
                <p className="text-xs font-semibold text-accent tracking-wider uppercase mb-1">
                  {checklist.templateTitle}
                </p>
              )}
              {editingTitle ? (
                <div>
                  <input
                    type="text"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    className="input font-semibold text-base w-full"
                    placeholder={t('checklist_title_placeholder')}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelTitle();
                    }}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={handleSaveTitle} className="btn btn-primary text-xs py-1 px-2">
                      <Check size={12} />{t('common_save')}
                    </button>
                    <button onClick={handleCancelTitle} className="btn btn-ghost text-xs py-1 px-2">
                      {t('common_cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <h2 className="text-base font-semibold flex-1">
                    {checklist.title || t('checklist_title_placeholder')}
                  </h2>
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="btn-icon"
                    title={t('checklist_edit_title')}
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
              <p className="text-tertiary text-xs mt-1">
                {new Date(checklist.createdAt).toLocaleDateString(
                  language === 'lv' ? 'lv-LV' :
                  language === 'ru' ? 'ru-RU' :
                  language === 'es' ? 'es-ES' : 'en-US'
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold text-accent">{Math.round(progress)}%</div>
            </div>
          </div>
          <ChecklistProgressBar progress={progress} />
        </div>
      </div>

      <div className="space-y-4">
        {checklist.categories.map((category) => (
          <div key={category.id} className="space-y-3">
            <h3 className="section-label">
              {category.name}
            </h3>
            <div className="space-y-2">
              {category.items.map((item) => {
                const allPhotoIds = [
                  ...(item.guidePhotoIds || []),
                  ...(item.photoIds || []),
                ];
                const guideCount = item.guidePhotoIds?.length || 0;

                return (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onToggleChecked={() => onToggleItem(checklist, category.id, item.id, 'checked')}
                    onToggleSkipped={() => onToggleItem(checklist, category.id, item.id, 'skipped')}
                    onAddPhoto={(file) => onAddPhoto(checklist, category.id, item.id, file)}
                    onDeletePhoto={(photoId) => onDeletePhoto(checklist, category.id, item.id, photoId)}
                    onViewPhotos={(photoIds, startIndex) =>
                      handleViewPhotos(photoIds, startIndex, category.id, item.id, startIndex >= guideCount)
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-success-subtle border-success-subtle text-center py-8"
        >
          <CheckCircle size={40} className="text-success mx-auto mb-4" />
          <h3 className="text-base font-bold mb-2">{t('checklist_complete')}</h3>
          <p className="text-secondary text-sm mb-6">{t('checklist_done_msg')}</p>
          <button onClick={onBack} className="btn btn-primary">
            {t('checklist_back')}
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {lightbox && (
          <PhotoLightbox
            photoIds={lightbox.photoIds}
            startIndex={lightbox.startIndex}
            onClose={() => setLightbox(null)}
            onDelete={lightbox.canDelete ? handleDeletePhoto : undefined}
          />
        )}
      </AnimatePresence>

      {showDeleteConfirm && (
        <ConfirmDialog
          title={t('delete_confirm_title')}
          message={t('delete_confirm_msg')}
          confirmLabel={t('delete_confirm_action')}
          onConfirm={handleDeleteChecklist}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default ChecklistView;