import { Save } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';

interface EditorToolbarProps {
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function EditorToolbar({ isEditing, onSave, onCancel }: EditorToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold">{isEditing ? t.editor.edit : t.editor.new}</h2>
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn btn-ghost">
          {t.editor.cancel}
        </button>
        <button onClick={onSave} className="btn btn-primary">
          <Save size={16} /> {t.editor.save}
        </button>
      </div>
    </div>
  );
}
