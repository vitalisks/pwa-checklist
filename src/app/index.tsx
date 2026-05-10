import React from 'react';
import { StorageProvider } from '@/shared/api';
import { LanguageProvider } from '@/shared/i18n';
import AppRoutes from './ui/routes';

const App: React.FC = () => {
  return (
    <StorageProvider>
      <LanguageProvider>
        <AppRoutes />
      </LanguageProvider>
    </StorageProvider>
  );
};

export default App;
