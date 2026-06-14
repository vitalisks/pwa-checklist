import React from 'react';
import { useTranslation } from '@/shared/i18n';
import { ChecklistProgressBar } from '@/widgets/progress-bar';

interface ChecklistTitleCardProps {
  templateTitle?: string;
  title: string;
  isEditing: boolean;
  showValidation: boolean;
  titleValue: string;
  onTitleChange: (value: string) => void;
  date: number;
  language: string;
  progress: number;
}

const ChecklistTitleCard: React.FC<ChecklistTitleCardProps> = ({
  templateTitle,
  title,
  isEditing,
  showValidation,
  titleValue,
  onTitleChange,
  date,
  language,
  progress,
}) => {
  const { t } = useTranslation();

  const locale = language === 'lv' ? 'lv-LV' : language === 'ru' ? 'ru-RU' : language === 'es' ? 'es-ES' : 'en-US';

  return (
    <div className="card">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {templateTitle && (
              <p className="text-xs font-semibold text-accent tracking-wider uppercase mb-1">
                {templateTitle}
              </p>
            )}
            {isEditing ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => onTitleChange(e.target.value)}
                className={`input font-semibold text-base${showValidation && !titleValue.trim() ? ' input-invalid' : ''}`}
                placeholder={t.checklist.titlePlaceholder}
                autoFocus
              />
            ) : (
              <h2 className="text-base font-semibold">{title || t.checklist.titlePlaceholder}</h2>
            )}
            <p className="text-tertiary text-xs mt-1">
              {new Date(date).toLocaleDateString(locale)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-accent">{Math.round(progress)}%</div>
          </div>
        </div>
        <ChecklistProgressBar progress={progress} />
      </div>
    </div>
  );
};

export default ChecklistTitleCard;
