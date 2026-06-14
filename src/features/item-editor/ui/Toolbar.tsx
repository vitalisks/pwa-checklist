import { ChevronLeft, Save } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';

interface ToolbarProps {
  isDraft: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function Toolbar({ isDraft, onBack, onCancel, onSave }: ToolbarProps) {
  const { t } = useTranslation();

  return (
    <div style={{
      position: 'fixed',
      top: 'var(--header-height, 52px)',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 'var(--content-max-width)',
      background: 'var(--surface-1)',
      zIndex: 10,
    }}>
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
}
