import React, { useState } from 'react';
import { useTranslation } from '@/shared/i18n';
import { useShare } from '../model';
import { Share2, Copy, Check } from 'lucide-react';

const MyCodeCard: React.FC = () => {
  const { myCode } = useShare();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: myCode });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(myCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-semibold">{t.share.myCode}</h3>
      <p className="text-xs text-tertiary">{t.share.codeDescription}</p>

      <div className="flex gap-2">
        <button onClick={handleCopy} className="btn btn-soft flex-1 text-xs">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? t.common.copied : t.share.copyCode}
        </button>
        <button onClick={handleShare} className="btn btn-soft flex-1 text-xs">
          <Share2 size={14} />
          {t.share.shareCode}
        </button>
      </div>
    </div>
  );
};

export default MyCodeCard;
