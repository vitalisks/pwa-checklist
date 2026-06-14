/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useMemo } from 'react';
import type { ImportResult } from '@/shared/api';
import { useStorage } from '@/shared/api';
import { exportData, importData, clearAllData } from '@/features/import-export';

interface UtilityContextType {
  handleExport: () => Promise<void>;
  handleImport: (file: File) => Promise<ImportResult>;
  handleClearData: () => Promise<void>;
}

const UtilityContext = createContext<UtilityContextType | undefined>(undefined);

export const UtilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storage = useStorage();

  const value = useMemo(() => ({
    handleExport: () => exportData(storage),
    handleImport: (file: File) => importData(storage, file),
    handleClearData: async () => { await clearAllData(storage); window.location.reload(); },
  }), [storage]);

  return (
    <UtilityContext.Provider value={value}>
      {children}
    </UtilityContext.Provider>
  );
};

export function useUtility(): UtilityContextType {
  const ctx = useContext(UtilityContext);
  if (!ctx) throw new Error('useUtility must be used within a UtilityProvider');
  return ctx;
}
