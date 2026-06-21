import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, CircleSlash } from 'lucide-react';

interface ItemStatusIconProps {
  checked: boolean;
  skipped: boolean;
}

export const ItemStatusIcon: React.FC<ItemStatusIconProps> = ({ checked, skipped }) => {
  if (checked) {
    return (
      <motion.div
        className="mt-0.5 shrink-0"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <Check size={12} color="#fff" strokeWidth={3} />
        </div>
      </motion.div>
    );
  }

  if (skipped) {
    return <CircleSlash size={20} className="text-warning shrink-0 mt-0.5" />;
  }

  return <Circle size={20} className="text-tertiary shrink-0 mt-0.5" />;
};
