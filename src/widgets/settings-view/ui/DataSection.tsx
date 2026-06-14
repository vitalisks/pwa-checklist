import React, { useRef, useState } from 'react';
import { Trash2, Download, Upload, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { ConfirmDialog } from '@/shared/ui';

interface DataSectionProps {
  onExport: () => Promise<void>;
  onImport: (file: File) => Promise<{ text: string; error: boolean }>;
  onClear: () => void;
}

const DataSection: React.FC<DataSectionProps> = ({ onExport, onImport, onClear }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);

  const handleExportClick = async () => {
    setExporting(true);
    try { await onExport(); } finally { setExporting(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const result = await onImport(file);
      setImportMessage(result);
    } catch {
      setImportMessage({ text: t.settings.importError, error: true });
    } finally {
      setImporting(false);
    }
  };

  const handleClearCache = async () => {
    setShowClearCacheConfirm(false);
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(r => r.unregister()));
    window.location.reload();
  };

  return (
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

      <div className="pt-3 border-t border-subtle space-y-2">
        <button
          onClick={() => setShowClearCacheConfirm(true)}
          className="btn btn-soft w-full"
        >
          <RefreshCw size={16} /> {t.settings.clearCache}
        </button>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="btn btn-danger w-full"
        >
          <Trash2 size={16} /> {t.settings.clearData}
        </button>
      </div>

      {showClearCacheConfirm && (
        <ConfirmDialog
          title={t.settings.clearCache}
          message={t.settings.clearCacheWarning}
          confirmLabel={t.settings.clearCache}
          onConfirm={handleClearCache}
          onCancel={() => setShowClearCacheConfirm(false)}
        />
      )}

      {showClearConfirm && (
        <ConfirmDialog
          title={t.settings.clearData}
          message={t.settings.clearWarning}
          confirmLabel={t.common.delete.confirmAction}
          onConfirm={() => { onClear(); setShowClearConfirm(false); }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
};

export default DataSection;
