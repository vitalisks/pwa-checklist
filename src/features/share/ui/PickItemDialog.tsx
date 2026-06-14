import React, { useState } from 'react';
import { useTranslation } from '@/shared/i18n';
import { DialogPortal } from '@/shared/ui';
import type { Template, Checklist } from '@/shared/config';
import { X } from 'lucide-react';

interface Props {
  templates: Template[];
  checklists: Checklist[];
  onPick: (item: Template | Checklist, type: 'template' | 'checklist') => void;
  onClose: () => void;
}

const PickItemDialog: React.FC<Props> = ({ templates, checklists, onPick, onClose }) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'templates' | 'checklists'>('templates');

  const items = tab === 'templates' ? templates : checklists;

  return (
    <DialogPortal>
    <div className="fixed inset-0 z-100 bg-black/60 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm max-h-[80vh] flex flex-col space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between shrink-0">
          <h3 className="text-sm font-semibold">{t.share.send}</h3>
          <button onClick={onClose} className="btn-icon">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setTab('templates')}
            className={`btn text-xs flex-1 h-8 ${tab === 'templates' ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t.templates.title}
          </button>
          <button
            onClick={() => setTab('checklists')}
            className={`btn text-xs flex-1 h-8 ${tab === 'checklists' ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t.nav.home}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onPick(item, tab === 'templates' ? 'template' : 'checklist')}
              className="card-inset w-full text-left hover:border-hover transition-colors"
            >
              <p className="text-xs font-medium truncate">
                {'title' in item ? item.title : 'Untitled'}
              </p>
            </button>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-secondary text-center py-4">{t.share.noContacts}</p>
          )}
        </div>
      </div>
    </div>
    </DialogPortal>
  );
};

export default PickItemDialog;
