import React, { useCallback } from 'react';
import type { Template, Checklist } from '@/shared/config';
import type { IncomingShare } from '@/features/share';
import { useTemplate } from '@/app/model/template-context';
import { useChecklist } from '@/app/model/checklist-context';
import { useEditingState } from '@/features/edit-template';
import { useNavigation } from '@/app/model/navigation-context';
import { useShare } from '@/features/share';
import { useCollaboration } from '@/features/collaboration';
import { generateUUID } from '@/shared/lib';
import { Layout } from '@/widgets/layout';
import { HomeView } from '@/widgets/home-view';
import { TemplateList } from '@/widgets/template-list';
import { InboxView } from '@/widgets/inbox-view';
import { SettingsView } from '@/widgets/settings-view';
import { ChecklistView } from '@/widgets/checklist-view';
import { TemplateEditor } from '@/widgets/template-editor';
import { IdeaFlowView } from '@/features/idea-flow';
import { motion, AnimatePresence } from 'framer-motion';

const AppRoutes: React.FC = () => {
  const { editingTemplate, cancelEditing, finishEditing, startEditing } = useEditingState();
  const { saveTemplate } = useTemplate();
  const { checklists, persistChecklist, convertChecklistToTemplate } = useChecklist();
  const { activeTab, viewingChecklistId, draftChecklist, isIdeaFlowOpen, closeIdeaFlow, closeChecklist, saveDraftChecklist } = useNavigation();
  const { acceptShare } = useShare();
  const { incomingInvites, acceptInvite, declineInvite } = useCollaboration();

  const viewingChecklist = draftChecklist ?? checklists.find(c => c.id === viewingChecklistId) ?? null;

  const handleSaveTemplate = useCallback(async (template: Template) => {
    await saveTemplate(template);
    finishEditing();
  }, [saveTemplate, finishEditing]);

  const handleIdeaFlowSave = useCallback(async (template: Template) => {
    await saveTemplate(template);
    closeIdeaFlow();
  }, [saveTemplate, closeIdeaFlow]);

  const handleSaveAsTemplate = useCallback(async (checklist: Checklist) => {
    const template = convertChecklistToTemplate(checklist);
    closeChecklist();
    startEditing(template);
  }, [convertChecklistToTemplate, closeChecklist, startEditing]);

  const handleSaveChecklist = useCallback(async (checklist: Checklist) => {
    await saveDraftChecklist(checklist);
  }, [saveDraftChecklist]);

  const handleAcceptShare = useCallback(async (share: IncomingShare) => {
    const payload = await acceptShare(share);
    if (!payload) return;

    const item = JSON.parse(JSON.stringify(payload)) as Template | Checklist;
    item.id = generateUUID();
    if (share.type === 'template') {
      const tpl = item as Template;
      tpl.categories = tpl.categories.map(c => ({
        ...c,
        id: generateUUID(),
        items: c.items.map(i => ({ ...i, id: generateUUID() })),
      }));
      await saveTemplate(tpl);
    } else {
      const cl = item as Checklist;
      cl.categories = cl.categories.map(c => ({
        ...c,
        id: generateUUID(),
        items: c.items.map(i => ({ ...i, id: generateUUID() })),
      }));
      await persistChecklist(cl);
    }
  }, [acceptShare, saveTemplate, persistChecklist]);

  return (
    <Layout>
      {viewingChecklist ? (
        <ChecklistView checklist={viewingChecklist} onSaveAsTemplate={handleSaveAsTemplate} defaultEdit={!!draftChecklist} onSaveChecklist={draftChecklist ? handleSaveChecklist : undefined} />
      ) : isIdeaFlowOpen ? (
        <IdeaFlowView onSave={handleIdeaFlowSave} />
      ) : editingTemplate !== undefined ? (
        <TemplateEditor
          template={editingTemplate || undefined}
          onSave={handleSaveTemplate}
          onCancel={cancelEditing}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`tab-${activeTab}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'home' ? (
              <HomeView />
            ) : activeTab === 'inbox' ? (
              <InboxView
                onAccept={handleAcceptShare}
                incomingInvites={incomingInvites}
                onAcceptInvite={acceptInvite}
                onDeclineInvite={declineInvite}
              />
            ) : activeTab === 'templates' ? (
              <TemplateList />
            ) : activeTab === 'settings' ? (
              <SettingsView />
            ) : null}
          </motion.div>
        </AnimatePresence>
      )}
    </Layout>
  );
};

export default AppRoutes;
