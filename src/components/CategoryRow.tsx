import React, { useRef, useState, useEffect } from 'react';
import { Trash2, Plus, X, Camera, Image } from 'lucide-react';
import { Category } from '../types';
import { motion } from 'framer-motion';
import { storageService } from '../services/storage';

import { useLanguage } from '../hooks/useLanguage';
import catStyles from './CategoryRow.module.css';
import photoStyles from '../styles/photo-zone.module.css';

interface CategoryRowProps {
  category: Category;
  showValidation: boolean;
  onUpdateName: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onAddItem: (categoryId: string) => void;
  onUpdateItem: (categoryId: string, itemId: string, text: string) => void;
  onUpdateItemDescription: (categoryId: string, itemId: string, description: string) => void;
  onRemoveItem: (categoryId: string, itemId: string) => void;
  onAddPhoto: (categoryId: string, itemId: string, file: File) => void;
  onDeletePhoto: (categoryId: string, itemId: string, photoId: string) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  category,
  showValidation,
  onUpdateName,
  onRemove,
  onAddItem,
  onUpdateItem,
  onUpdateItemDescription,
  onRemoveItem,
  onAddPhoto,
  onDeletePhoto,
}) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="card"
    >
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          className={`input font-semibold bg-surface-1 border-transparent focus:border-accent h-8 flex-1${showValidation && !category.name.trim() ? ' input-invalid' : ''}`}
          value={category.name}
          onChange={(e) => onUpdateName(category.id, e.target.value)}
          placeholder={t('editor_cat_placeholder')}
        />
        <button
          onClick={() => {
            if (category.items.length === 0 || window.confirm(t('delete_confirm'))) {
              onRemove(category.id);
            }
          }}
          className="btn-icon btn-icon-danger shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-2 pl-3 border-l border-subtle">
        {category.items.map((item) => (
        <ItemRow
          key={item.id}
          itemId={item.id}
          text={item.text}
          description={item.description || ''}
          photoIds={item.photoIds || []}
          categoryId={category.id}
          showValidation={showValidation}
          onUpdateText={onUpdateItem}
          onUpdateDescription={onUpdateItemDescription}
          onRemove={onRemoveItem}
          onAddPhoto={onAddPhoto}
          onDeletePhoto={onDeletePhoto}
        />
        ))}
        <button
          onClick={() => onAddItem(category.id)}
          className="flex items-center gap-1.5 text-xs text-tertiary hover:text-primary transition-colors py-1 mt-1"
        >
          <Plus size={12} /> {t('editor_add_item')}
        </button>
      </div>
    </motion.div>
  );
};

interface ItemRowProps {
  itemId: string;
  text: string;
  description: string;
  photoIds: string[];
  categoryId: string;
  showValidation: boolean;
  onUpdateText: (categoryId: string, itemId: string, text: string) => void;
  onUpdateDescription: (categoryId: string, itemId: string, description: string) => void;
  onRemove: (categoryId: string, itemId: string) => void;
  onAddPhoto: (categoryId: string, itemId: string, file: File) => void;
  onDeletePhoto: (categoryId: string, itemId: string, photoId: string) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({
  itemId,
  text,
  description,
  photoIds,
  categoryId,
  showValidation,
  onUpdateText,
  onUpdateDescription,
  onRemove,
  onAddPhoto,
  onDeletePhoto,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set());
  const [showDescription, setShowDescription] = useState(true);
  const [thumbnailsLoaded, setThumbnailsLoaded] = useState(false);

  useEffect(() => {
    if (!photoIds || photoIds.length === 0) {
      setThumbnails({});
      setLoadingThumbnails(new Set());
      setThumbnailsLoaded(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoadingThumbnails(new Set(photoIds));
      setThumbnailsLoaded(false);
      const map: Record<string, string> = {};

      for (const pid of photoIds) {
        if (cancelled) break;
        try {
          const photo = await storageService.getPhoto(pid);
          if (photo && !cancelled && photo.dataUrl) {
            map[pid] = photo.dataUrl;
          }
        } catch {
          // ignore
        }
      }

      if (!cancelled) {
        setThumbnails(map);
        setLoadingThumbnails(new Set());
        setThumbnailsLoaded(true);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [photoIds, itemId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddPhoto(categoryId, itemId, file);
      e.target.value = '';
    }
  };

  return (
    <div className={`${catStyles['editor-item']}${showValidation && !text.trim() ? ` ${catStyles['editor-item-invalid']}` : ''}`}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          className={`input h-8 text-sm flex-1 font-medium${showValidation && !text.trim() ? ' input-invalid' : ''}`}
          value={text}
          onChange={(e) => onUpdateText(categoryId, itemId, e.target.value)}
          placeholder={t('editor_item_placeholder')}
        />
        <button
          onClick={() => onRemove(categoryId, itemId)}
          className="btn-icon btn-icon-danger"
        >
          <X size={16} />
        </button>
      </div>

      {showDescription && (
        <textarea
          className="input min-h-[36px] text-xs bg-surface-1 border-subtle mt-1.5"
          value={description}
          onChange={(e) => onUpdateDescription(categoryId, itemId, e.target.value)}
          placeholder={t('editor_item_desc_placeholder')}
        />
      )}

      <div className={photoStyles['photo-zone']}>
        <div className={photoStyles['photo-zone-label']}>{t('item_guide_photo')}</div>
        <div className={photoStyles['photo-strip']}>
          {photoIds.map(pid => (
            <div key={pid} className={photoStyles['photo-thumb-wrap']}>
              {loadingThumbnails.has(pid) ? (
                <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']}`}>
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : thumbnails[pid] ? (
                <img src={thumbnails[pid]} alt="" className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-guide']}`} />
              ) : (
                <div className={`${photoStyles['photo-thumb']} ${photoStyles['photo-thumb-placeholder']}`}>
                  <Image size={12} />
                </div>
              )}
              <button
                onClick={() => onDeletePhoto(categoryId, itemId, pid)}
                className={photoStyles['photo-thumb-delete']}
                title={t('item_delete_photo')}
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            className={photoStyles['photo-add-btn']}
            title={t('item_add_photo')}
          >
            <Camera size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryRow;