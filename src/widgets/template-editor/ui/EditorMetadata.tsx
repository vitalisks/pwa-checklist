import { useTranslation } from '@/shared/i18n';

interface EditorMetadataProps {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  showValidation: boolean;
  hasEmptyTitle: boolean;
}

export function EditorMetadata({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  showValidation,
  hasEmptyTitle,
}: EditorMetadataProps) {
  const { t } = useTranslation();

  return (
    <div className="card">
      <div className="space-y-3">
        <div>
          <input
            type="text"
            className={`input font-semibold text-base${showValidation && hasEmptyTitle ? ' input-invalid' : ''}`}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t.editor.titlePlaceholderRequired}
          />
        </div>
        <div>
          <textarea
            className="input min-h-[50px]"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={t.editor.descPlaceholder}
          />
        </div>
      </div>
    </div>
  );
}
