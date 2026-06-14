import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { motion } from 'framer-motion';

interface CompletedBannerProps {
  onBack: () => void;
}

const CompletedBanner: React.FC<CompletedBannerProps> = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card bg-success-subtle border-success-subtle text-center py-8"
    >
      <CheckCircle size={40} className="text-success mx-auto mb-4" />
      <h3 className="text-base font-bold mb-2">{t.checklist.complete}</h3>
      <p className="text-secondary text-sm mb-6">{t.checklist.doneMsg}</p>
      <button onClick={onBack} className="btn btn-primary">
        {t.checklist.back}
      </button>
    </motion.div>
  );
};

export default CompletedBanner;
