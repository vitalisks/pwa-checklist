import React from 'react';
import { ChevronLeft, Save } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import styles from './ChecklistView.module.css';

interface EditToolbarProps {
  isDraft: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
}

const EditToolbar: React.FC<EditToolbarProps> = ({ isDraft, onBack, onCancel, onSave }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.fixedToolbar}>
      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={onBack} className="btn-icon hover:text-accent">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={isDraft ? onBack : onCancel} className="btn btn-ghost">
            {t.editor.cancel}
          </button>
          <button onClick={onSave} className="btn btn-primary">
            <Save size={16} /> {t.editor.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditToolbar;
