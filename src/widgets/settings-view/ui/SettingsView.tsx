import React, { useState } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useTemplate } from '@/app/model/template-context';
import { useChecklist } from '@/app/model/checklist-context';
import { useShare, MyCodeCard, ContactsList, SendShareDialog, PickItemDialog } from '@/features/share';
import { useUtility } from '@/app/model/utility-context';
import type { Contact, Template, Checklist } from '@/shared/config';
import LanguageSection from './LanguageSection';
import AppearanceSection from './AppearanceSection';
import NotificationsSection from './NotificationsSection';
import DataSection from './DataSection';

const SettingsView: React.FC = () => {
  const { t } = useTranslation();
  const { handleExport, handleImport, handleClearData } = useUtility();
  const { templates } = useTemplate();
  const { checklists } = useChecklist();
  const { enabled, notificationGranted, requestNotification } = useShare();
  const [sendTarget, setSendTarget] = useState<Contact | null>(null);
  const [sendItem, setSendItem] = useState<{ item: Template | Checklist; type: 'template' | 'checklist' } | null>(null);

  const handleClear = () => {
    handleClearData();
  };

  const handleFileImport = async (file: File) => {
    const result = await handleImport(file);
    const { templates: tCount, checklists: cCount, photos } = result.added;
    const msg = `Added ${tCount} templates, ${cCount} checklists, ${photos} photos. Skipped ${result.skipped}.`;
    setTimeout(() => window.location.reload(), 1500);
    return { text: msg, error: false };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">{t.settings.title}</h2>
        <p className="text-secondary text-sm mb-6">{t.settings.desc}</p>
      </div>

      <LanguageSection />
      <AppearanceSection />

      {enabled && (
        <div className="space-y-4">
          <NotificationsSection notificationGranted={notificationGranted} onRequest={requestNotification} />
          <MyCodeCard />
          <div className="card">
            <ContactsList onSendToContact={setSendTarget} />
          </div>
        </div>
      )}

      <DataSection onExport={handleExport} onImport={handleFileImport} onClear={handleClear} />

      {sendTarget && !sendItem && (
        <PickItemDialog
          templates={templates}
          checklists={checklists}
          onPick={(item, type) => setSendItem({ item, type })}
          onClose={() => setSendTarget(null)}
        />
      )}

      {sendTarget && sendItem && (
        <SendShareDialog
          contact={sendTarget}
          item={sendItem.item}
          itemType={sendItem.type}
          onClose={() => { setSendTarget(null); setSendItem(null); }}
        />
      )}
    </div>
  );
};

export default SettingsView;
