import React from 'react';
import { ChevronLeft, Pencil, Save, FileText, Share2, Download, Users, Trash2 } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { getAvatarColor, getInitials } from './utils';

interface CollaboratorAvatar {
  id: string;
  name: string;
}

interface ReadToolbarProps {
  isDraft: boolean;
  showSaveAsTemplate: boolean;
  shareEnabled: boolean;
  isCollaborative: boolean;
  collaboratorAvatars: CollaboratorAvatar[];
  onBack: () => void;
  onEdit: () => void;
  onSaveDraft: () => void;
  onCancelDraft: () => void;
  onSaveAsTemplate: () => void;
  onShare: () => void;
  onExport: () => void;
  onCollaborate: () => void;
  onDelete: () => void;
}

const ReadToolbar: React.FC<ReadToolbarProps> = ({
  isDraft,
  showSaveAsTemplate,
  shareEnabled,
  isCollaborative,
  collaboratorAvatars,
  onBack,
  onEdit,
  onSaveDraft,
  onCancelDraft,
  onSaveAsTemplate,
  onShare,
  onExport,
  onCollaborate,
  onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-icon hover:text-accent">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {isDraft ? (
            <>
              <button onClick={onCancelDraft} className="btn btn-ghost">
                {t.editor.cancel}
              </button>
              <button onClick={onSaveDraft} className="btn btn-primary">
                <Save size={16} /> {t.editor.save}
              </button>
            </>
          ) : (
            <button onClick={onEdit} className="btn btn-soft">
              <Pencil size={14} /> {t.checklist.editMode}
            </button>
          )}
        </div>
      </div>
      {!isDraft && (
        <div className="flex items-center gap-1.5 w-full justify-end">
          {showSaveAsTemplate && (
            <button
              onClick={onSaveAsTemplate}
              className="btn-icon hover:text-accent"
              title={t.checklist.saveAsTemplate}
            >
              <FileText size={16} />
            </button>
          )}
          {shareEnabled && (
            <button
              onClick={onShare}
              className="btn-icon hover:text-accent"
              title={t.share.send}
            >
              <Share2 size={16} />
            </button>
          )}
          <button
            onClick={onExport}
            className="btn-icon hover:text-accent"
            title={t.export.export}
          >
            <Download size={16} />
          </button>
          <button
            onClick={onCollaborate}
            className={`btn-icon hover:text-accent ${isCollaborative ? 'text-accent' : ''}`}
            title={t.collaboration.collaborate}
          >
            <Users size={16} />
          </button>
          {collaboratorAvatars.length > 0 && (
            <div className="flex items-center -space-x-1.5 ml-0.5">
              {collaboratorAvatars.slice(0, 4).map((c, i) => (
                <div
                  key={c.id}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-surface-2 shrink-0"
                  style={{ background: getAvatarColor(c.id), zIndex: 4 - i }}
                  title={c.name}
                >
                  {getInitials(c.name)}
                </div>
              ))}
              {collaboratorAvatars.length > 4 && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-tertiary bg-surface-3 border border-surface-2 shrink-0"
                  title={`+${collaboratorAvatars.length - 4} more`}
                >
                  +{collaboratorAvatars.length - 4}
                </div>
              )}
            </div>
          )}
          <button
            onClick={onDelete}
            className="btn-icon btn-icon-danger"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReadToolbar;
