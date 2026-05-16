import React, { useState, useRef } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useUtility } from '@/app/model/utility-context';
import { ConfirmDialog } from '@/shared/ui';
import { Trash2, Download, Upload } from 'lucide-react';

const SettingsView: React.FC = () => {
  const { language, changeLanguage, t } = useTranslation();
  const { handleExport, handleImport, handleClearData } = useUtility();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ text: string; error: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <div className="flex gap-1">
            {(['en', 'es', 'lv', 'ru'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => changeLanguage(lang)}
                className={`btn h-8 px-3 text-xs ${language === lang ? 'btn-primary' : 'btn-ghost'}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
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
