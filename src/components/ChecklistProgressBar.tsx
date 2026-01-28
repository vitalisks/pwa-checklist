import React from 'react';
import { motion } from 'framer-motion';

interface ChecklistProgressBarProps {
    progress: number;
}

const ChecklistProgressBar: React.FC<ChecklistProgressBarProps> = ({ progress }) => {
    return (
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <motion.div
                className="h-full bg-accent-color"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
            />
        </div>
    );
};

export default ChecklistProgressBar;
