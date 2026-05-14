import React from 'react';
import { StorageProvider } from '@/shared/api';
import { LanguageProvider } from '@/shared/i18n';
import { TemplateProvider } from '@/app/model/template-context';
import { ChecklistProvider } from '@/app/model/checklist-context';
import { UtilityProvider } from '@/app/model/utility-context';
import { EditingStateProvider } from '@/features/edit-template';
import { NavigationProvider } from '@/app/model/navigation-context';
import AppRoutes from './ui/routes';

const App: React.FC = () => {
  return (
    <StorageProvider>
      <LanguageProvider>
        <TemplateProvider>
          <ChecklistProvider>
            <UtilityProvider>
              <EditingStateProvider>
                <NavigationProvider>
                  <AppRoutes />
                </NavigationProvider>
              </EditingStateProvider>
            </UtilityProvider>
          </ChecklistProvider>
        </TemplateProvider>
      </LanguageProvider>
    </StorageProvider>
  );
};

export default App;
