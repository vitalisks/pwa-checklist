import React, { createContext, useContext, useMemo } from 'react';
import type { StoragePort } from './storage-port';
import { IndexedDBAdapter } from './indexeddb-adapter';

const StorageContext = createContext<StoragePort | null>(null);

const defaultAdapter = new IndexedDBAdapter();

export const StorageProvider: React.FC<{
  storage?: StoragePort;
  children: React.ReactNode;
}> = ({ storage, children }) => {
  const value = useMemo(() => storage ?? defaultAdapter, [storage]);
  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
};

export function useStorage(): StoragePort {
  const ctx = useContext(StorageContext);
  if (!ctx) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return ctx;
}
