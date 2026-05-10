import React from 'react';
import { motion } from 'framer-motion';

interface ChecklistProgressBarProps {
  progress: number;
}

const ChecklistProgressBar: React.FC<ChecklistProgressBarProps> = ({ progress }) => {
  return (
    <div className="progress-track">
      <motion.div
        className="progress-fill progress-fill-active"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
};

export default ChecklistProgressBar;
