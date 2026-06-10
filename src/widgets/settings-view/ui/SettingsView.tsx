import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, LANGUAGES } from '@/shared/i18n';
import { useUtility } from '@/app/model/utility-context';
import { useTheme } from '@/shared/theme';
import { ConfirmDialog } from '@/shared/ui';
import { Trash2, Download, Upload, Sun, Moon, Monitor, ChevronDown } from 'lucide-react';

const SettingsView: React.FC = () => {
  const { language, changeLanguage, t } = useTranslation();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { handleExport, handleImport, handleClearData } = useUtility();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showLangMenu) return
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showLangMenu])

  const handleClear = () => {
    handleClearData();
    setShowClearConfirm(false);
  };

  const handleExportClick = async () => {
    setExporting(true);
    try {
      await handleExport();
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const result = await handleImport(file);
      const { templates, checklists, photos } = result.added;
      const msg = `Added ${templates} templates, ${checklists} checklists, ${photos} photos. Skipped ${result.skipped}.`;
      setImportMessage({ text: msg, error: false });
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setImportMessage({ text: t.settings.importError, error: true });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
<h2 className="text-lg font-bold">{t.settings.title}</h2>
      <p className="text-secondary text-sm mb-6">{t.settings.desc}</p>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{t.settings.language}</h3>
          </div>
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="btn btn-soft h-8 px-3 text-xs flex items-center gap-1.5"
            >
              {LANGUAGES.find(l => l.code === language)?.nativeName ?? language}
              <ChevronDown size={14} className={`transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 card py-1 min-w-[160px]">
                {LANGUAGES.map(({ code, name, nativeName }) => (
                  <button
                    key={code}
                    onClick={() => { changeLanguage(code); setShowLangMenu(false) }}
                    className={`w-full text-left px-3 py-1.5 text-sm ${language === code ? 'text-accent' : ''}`}
                  >
                    {nativeName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold">{t.settings.data}</h3>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex gap-2">
          <button
            onClick={handleExportClick}
            disabled={exporting}
            className="btn btn-soft flex-1"
          >
            <Download size={16} />
            {exporting ? '…' : t.settings.export}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="btn btn-soft flex-1"
          >
            <Upload size={16} />
            {importing ? '…' : t.settings.import}
          </button>
        </div>

        {importMessage && (
          <p className={`text-xs ${importMessage.error ? 'text-danger' : 'text-accent'}`}>
            {importMessage.text}
          </p>
        )}

        <div className="pt-3 border-t border-subtle">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="btn btn-danger w-full"
          >
            <Trash2 size={16} /> {t.settings.clearData}
          </button>
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmDialog
          title={t.settings.clearData}
          message={t.settings.clearWarning}
          confirmLabel={t.common.delete.confirmAction}
          onConfirm={handleClear}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
};

export default SettingsView;
