import React from 'react';
import TemplateList from './TemplateList';
import ChecklistList from './ChecklistList';
import { Template, Checklist } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface HomeViewProps {
    templates: Template[];
    checklists: Checklist[];
    searchQuery: string;
    onAddTemplate: () => void;
    onEditTemplate: (template: Template) => void;
    onDeleteTemplate: (id: string) => void;
    onCreateChecklist: (template: Template) => void;
    onOpenChecklist: (checklist: Checklist) => void;
    onDeleteChecklist: (id: string) => void;
}

const HomeView: React.FC<HomeViewProps> = ({
    templates,
    checklists,
    searchQuery,
    onAddTemplate,
    onEditTemplate,
    onDeleteTemplate,
    onCreateChecklist,
    onOpenChecklist,
    onDeleteChecklist,
}) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-8">
            {searchQuery && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/30 px-1">{t('home_templates_found')}</h2>
                    </div>
                    <TemplateList
                        templates={templates}
                        onAdd={onAddTemplate}
                        onEdit={onEditTemplate}
                        onDelete={onDeleteTemplate}
                        onCreateChecklist={onCreateChecklist}
                        searchQuery={searchQuery}
                        hideHeader={true}
                    />
                </section>
            )}

            <section className="space-y-4">
                {searchQuery && (
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/30 px-1">{t('home_active_checklists')}</h2>
                    </div>
                )}
                <ChecklistList
                    checklists={checklists}
                    onOpen={onOpenChecklist}
                    onDelete={onDeleteChecklist}
                    searchQuery={searchQuery}
                />
            </section>
        </div>
    );
};

export default HomeView;
