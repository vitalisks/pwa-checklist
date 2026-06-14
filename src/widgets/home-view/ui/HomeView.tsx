import React from 'react';
import { TemplateList } from '@/widgets/template-list';
import { ChecklistList } from '@/widgets/checklist-list';
import { useTranslation } from '@/shared/i18n';

interface HomeViewProps {
  searchQuery?: string;
}

const HomeView: React.FC<HomeViewProps> = ({ searchQuery = '' }) => {
const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {searchQuery && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-label">{t.home.templatesFound}</h2>
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
            <h2 className="section-label">{t.home.activeChecklists}</h2>
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
