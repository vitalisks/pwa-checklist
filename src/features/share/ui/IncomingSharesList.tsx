import React, { useState, useCallback } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useShare } from '../model';
import { formatTime } from '@/shared/lib';
import type { IncomingShare } from '../model/share-types';
import { Check, X, Inbox, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onAccept: (share: IncomingShare) => Promise<void>;
}

const IncomingSharesList: React.FC<Props> = ({ onAccept }) => {
  const { incomingShares, dismissShare, enabled } = useShare();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

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

  if (!enabled || !incomingShares.length) return null;

  const pending = incomingShares.filter((s) => s.status === 'pending');

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full"
      >
        <div className="flex items-center gap-2 flex-1">
          <Inbox size={18} className="text-accent shrink-0" />
          <span className="text-xs font-semibold">{t.share.incoming}</span>
          <span className="badge badge-success">{pending.length}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-tertiary transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden mt-3"
          >
            <div className="space-y-1">
              {pending.map((share, i) => (
                <motion.div
                  key={share.shareId}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.04 }}
                  className="card-inset flex items-start gap-2"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`badge ${share.type === 'template' ? 'badge-success' : 'badge-warning'}`}>
                        {share.type === 'template' ? t.templates.title : t.nav.home}
                      </span>
                    </div>
                    <p className="text-xs font-medium truncate">
                      {share.title}
                    </p>
                    <p className="text-2xs text-tertiary">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IncomingSharesList;
