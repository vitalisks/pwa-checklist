import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { useTheme } from '@/shared/theme';

const AppearanceSection: React.FC = () => {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-semibold">{t.settings.appearance}</h3>
      <div className="flex gap-1">
        <button
          onClick={() => setThemeMode('system')}
          className={`btn h-8 px-3 text-xs ${themeMode === 'system' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Monitor size={14} />
          {t.settings.systemMode}
        </button>
        <button
          onClick={() => setThemeMode('dark')}
          className={`btn h-8 px-3 text-xs ${themeMode === 'dark' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Moon size={14} />
          {t.settings.darkMode}
        </button>
        <button
          onClick={() => setThemeMode('light')}
          className={`btn h-8 px-3 text-xs ${themeMode === 'light' ? 'btn-primary' : 'btn-ghost'}`}
        >
          <Sun size={14} />
          {t.settings.lightMode}
        </button>
      </div>
    </div>
  );
};

export default AppearanceSection;
