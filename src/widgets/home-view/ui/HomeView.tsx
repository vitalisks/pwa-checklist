import React from 'react';
import { TemplateList } from '@/widgets/template-list';
import { ChecklistList } from '@/widgets/checklist-list';
import { useLanguage } from '@/shared/i18n';
import { useNavigation } from '@/app/model/navigation-context';

const HomeView: React.FC = () => {
const { t } = useLanguage();
const { searchQuery } = useNavigation();

  return (
    <div className="space-y-6">
      {searchQuery && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-label">{t('home_templates_found')}</h2>
          </div>
          <TemplateList
            searchQuery={searchQuery}
            hideHeader={true}
          />
        </section>
      )}

      <section className="space-y-4">
        {searchQuery && (
          <div className="flex items-center justify-between">
            <h2 className="section-label">{t('home_active_checklists')}</h2>
          </div>
        )}
        <ChecklistList
          searchQuery={searchQuery}
        />
      </section>
    </div>
  );
};

export default HomeView;
