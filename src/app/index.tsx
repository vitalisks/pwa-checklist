import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/shared/theme';
import { StorageProvider } from '@/shared/api';
import { I18nProvider } from '@/shared/i18n';
import { TemplateProvider } from '@/app/model/template-context';
import { ChecklistProvider } from '@/app/model/checklist-context';
import { UtilityProvider } from '@/app/model/utility-context';
import { EditingStateProvider } from '@/features/edit-template';
import { ShareProvider } from '@/features/share';
import { CollaborationProvider } from '@/features/collaboration';
import { AuthProvider } from '@/features/auth';
import AppRoutes from './ui/routes';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <StorageProvider>
          <I18nProvider>
            <TemplateProvider>
              <ChecklistProvider>
                <UtilityProvider>
                  <ShareProvider>
                    <CollaborationProvider>
            <EditingStateProvider>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </EditingStateProvider>
                    </CollaborationProvider>
                  </ShareProvider>
                </UtilityProvider>
              </ChecklistProvider>
            </TemplateProvider>
          </I18nProvider>
        </StorageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
