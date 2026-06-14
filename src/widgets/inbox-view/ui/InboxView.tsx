import React, { useCallback, useState } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useShare } from '@/features/share';
import { formatTime } from '@/shared/lib';
import type { IncomingShare } from '@/features/share';
import type { IncomingInvite } from '@/features/collaboration';
import { Check, X, Inbox, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onAccept: (share: IncomingShare) => Promise<void>;
  incomingInvites: IncomingInvite[];
  onAcceptInvite: (checklistId: string) => Promise<void>;
  onDeclineInvite: (checklistId: string) => Promise<void>;
}

const InboxView: React.FC<Props> = ({ onAccept, incomingInvites, onAcceptInvite, onDeclineInvite }) => {
  const { incomingShares, dismissShare, enabled } = useShare();
  const { t } = useTranslation();
  const [processing, setProcessing] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = useCallback(async (share: IncomingShare) => {
    setProcessing(share.shareId);
    await onAccept(share);
    setProcessing(null);
  }, [onAccept]);

  const handleDismiss = useCallback(async (share: IncomingShare) => {
    setProcessing(share.shareId);
    await dismissShare(share);
    setProcessing(null);
  }, [dismissShare]);

  const handleAcceptInvite = useCallback(async (checklistId: string) => {
    setProcessing(`invite-${checklistId}`);
    await onAcceptInvite(checklistId);
    setProcessing(null);
  }, [onAcceptInvite]);

  const handleDeclineInvite = useCallback(async (checklistId: string) => {
    setProcessing(`invite-${checklistId}`);
    await onDeclineInvite(checklistId);
    setProcessing(null);
  }, [onDeclineInvite]);

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">{t.nav.inbox}</h2>
        </div>
        <div className="card text-center py-8">
          <Inbox size={32} className="text-tertiary mx-auto mb-2" />
          <p className="text-sm text-secondary">{t.share.setupFirebase}</p>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold">{t.nav.inbox}</h2>
        </div>
        <div className="card text-center py-8">
          <div className="w-8 h-8 rounded-full animate-spin mx-auto mb-2" style={{ border: '2px solid var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  const pending = incomingShares.filter((s) => s.status === 'pending');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">{t.nav.inbox}</h2>
      </div>

      {!pending.length ? (
        <div className="card text-center py-8">
          <Inbox size={32} className="text-tertiary mx-auto mb-2" />
          <p className="text-sm text-secondary">{t.share.noIncoming}</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-1">
            {pending.map((share, i) => (
              <motion.div
                key={share.shareId}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.03 }}
                layout
                className="card-inset flex items-start gap-2"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`badge ${share.type === 'template' ? 'badge-success' : 'badge-warning'}`}>
                      {share.type === 'template' ? t.templates.title : t.nav.home}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">
                    {share.title}
                  </p>
                  <p className="text-xs text-tertiary">
                    {share.senderName || share.senderDeviceId.slice(0, 8)}
                    {' · '}
                    {formatTime(share.receivedAt)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0 pt-1">
                  <button
                    onClick={() => handleAccept(share)}
                    disabled={processing === share.shareId}
                    className="btn-icon"
                    title={t.share.accept}
                  >
                    {processing === share.shareId ? (
                      <span
                        className="w-3.5 h-3.5 rounded-full animate-spin"
                        style={{ border: '2px solid var(--accent)', borderTopColor: 'transparent' }}
                      />
                    ) : (
                      <Check size={14} className="text-accent" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDismiss(share)}
                    disabled={processing === share.shareId}
                    className="btn-icon btn-icon-danger"
                    title={t.share.dismiss}
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {incomingInvites.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-4">
            <Users size={16} />
            <h3 className="text-sm font-semibold">{t.collaboration.invitationLabel}</h3>
          </div>
          <AnimatePresence mode="popLayout">
            <div className="space-y-1">
              {incomingInvites.map((invite, i) => (
                <motion.div
                  key={invite.checklistId}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                  layout
                  className="card-inset flex items-start gap-2"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium truncate">{invite.title}</p>
                    <p className="text-xs text-tertiary">
                      {invite.ownerName || invite.ownerDeviceId.slice(0, 8)}
                      {' · '}
                      {formatTime(invite.receivedAt)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0 pt-1">
                    <button
                      onClick={() => handleAcceptInvite(invite.checklistId)}
                      disabled={processing === `invite-${invite.checklistId}`}
                      className="btn-icon"
                      title={t.share.accept}
                    >
                      {processing === `invite-${invite.checklistId}` ? (
                        <span
                          className="w-3.5 h-3.5 rounded-full animate-spin"
                          style={{ border: '2px solid var(--accent)', borderTopColor: 'transparent' }}
                        />
                      ) : (
                        <Check size={14} className="text-accent" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeclineInvite(invite.checklistId)}
                      disabled={processing === `invite-${invite.checklistId}`}
                      className="btn-icon btn-icon-danger"
                      title={t.share.dismiss}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default InboxView;
