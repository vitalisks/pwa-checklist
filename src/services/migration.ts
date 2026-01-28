import { storageService } from './storage';
import { Template, Checklist } from '../types';

const LEGACY_KEYS = {
    TEMPLATES: 'checklist_templates',
    CHECKLISTS: 'active_checklists',
    MIGRATED: 'indexeddb_migrated',
};

export const migrateFromLocalStorage = async (): Promise<boolean> => {
    // Check if already migrated
    if (localStorage.getItem(LEGACY_KEYS.MIGRATED) === 'true') {
        return false;
    }

    try {
        let migrated = false;

        // Migrate templates
        const templatesData = localStorage.getItem(LEGACY_KEYS.TEMPLATES);
        if (templatesData) {
            const templates: Template[] = JSON.parse(templatesData);
            for (const template of templates) {
                await storageService.addTemplate(template);
            }
            migrated = true;
            console.log(`Migrated ${templates.length} templates to IndexedDB`);
        }

        // Migrate checklists
        const checklistsData = localStorage.getItem(LEGACY_KEYS.CHECKLISTS);
        if (checklistsData) {
            const checklists: Checklist[] = JSON.parse(checklistsData);
            for (const checklist of checklists) {
                await storageService.addChecklist(checklist);
            }
            migrated = true;
            console.log(`Migrated ${checklists.length} checklists to IndexedDB`);
        }

        // Mark as migrated
        if (migrated) {
            localStorage.setItem(LEGACY_KEYS.MIGRATED, 'true');
            // Optionally clear old data
            localStorage.removeItem(LEGACY_KEYS.TEMPLATES);
            localStorage.removeItem(LEGACY_KEYS.CHECKLISTS);
            console.log('Migration from localStorage to IndexedDB completed successfully');
        }

        return migrated;
    } catch (error) {
        console.error('Failed to migrate data from localStorage:', error);
        return false;
    }
};
