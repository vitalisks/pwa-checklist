import React, { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { Trash2 } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface SettingsViewProps {
  onClearData: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onClearData }) => {
  const { language, setLanguage, t } = useLanguage();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClear = () => {
    onClearData();
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{t('settings_title')}</h2>
        <p className="text-secondary text-sm mb-6">{t('settings_desc')}</p>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{t('settings_language')}</h3>
          </div>
          <div className="flex gap-1">
            {(['en', 'es', 'lv', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`btn h-8 px-3 text-xs ${language === lang ? 'btn-primary' : 'btn-ghost'}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-subtle">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="btn btn-danger w-full"
          >
            <Trash2 size={16} /> {t('settings_clear_data')}
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmDialog
          title={t('settings_clear_data')}
          message={t('settings_clear_warning')}
          confirmLabel={t('delete_confirm_action')}
          onConfirm={handleClear}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
};

export default SettingsView;