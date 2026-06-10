import React from 'react';
import { ThemeProvider } from '@/shared/theme';
import { StorageProvider } from '@/shared/api';
import { I18nProvider } from '@/shared/i18n';
import { TemplateProvider } from '@/app/model/template-context';
import { ChecklistProvider } from '@/app/model/checklist-context';
import { UtilityProvider } from '@/app/model/utility-context';
import { EditingStateProvider } from '@/features/edit-template';
import { NavigationProvider } from '@/app/model/navigation-context';
import AppRoutes from './ui/routes';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <StorageProvider>
        <I18nProvider>
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
        </I18nProvider>
      </StorageProvider>
    </ThemeProvider>
  );
};

export default App;
