import React, { useCallback } from 'react';
import { Routes, Route, useParams, useNavigate, useSearchParams, Navigate, useLocation } from 'react-router-dom';
import type { Template, Checklist } from '@/shared/config';
import type { IncomingShare } from '@/features/share';
import { useTemplate } from '@/app/model/template-context';
import { useChecklist } from '@/app/model/checklist-context';
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

const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  return <HomeView searchQuery={searchQuery} />;
};

const TemplatesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  return <TemplateList searchQuery={searchQuery} />;
};

const InboxPage: React.FC = () => {
  const { acceptShare } = useShare();
  const { saveTemplate } = useTemplate();
  const { persistChecklist } = useChecklist();
  const { incomingInvites, acceptInvite, declineInvite } = useCollaboration();

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
    <InboxView
      onAccept={handleAcceptShare}
      incomingInvites={incomingInvites}
      onAcceptInvite={acceptInvite}
      onDeclineInvite={declineInvite}
    />
  );
};

const ChecklistDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { checklists, convertChecklistToTemplate } = useChecklist();

  const checklist = id ? checklists.find(c => c.id === id) : null;

  const handleSaveAsTemplate = useCallback((checklist: Checklist) => {
    const template = convertChecklistToTemplate(checklist);
    navigate('/template/new', { state: { fromChecklist: template } });
  }, [convertChecklistToTemplate, navigate]);

  const handleClose = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (!checklist) return null;

  return (
    <ChecklistView
      checklist={checklist}
      onSaveAsTemplate={handleSaveAsTemplate}
      onClose={handleClose}
    />
  );
};

const ChecklistNewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { persistChecklist } = useChecklist();

  const draftChecklist = (location.state as { draft?: Checklist })?.draft;

  const handleSaveChecklist = useCallback(async (checklist: Checklist) => {
    await persistChecklist(checklist);
    navigate('/checklist/' + checklist.id, { replace: true });
  }, [persistChecklist, navigate]);

  const handleClose = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (!draftChecklist) return <Navigate to="/" replace />;

  return (
    <ChecklistView
      checklist={draftChecklist}
      defaultEdit={true}
      onSaveChecklist={handleSaveChecklist}
      onClose={handleClose}
    />
  );
};

const TemplateEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { templates, saveTemplate } = useTemplate();

  const fromChecklist = (location.state as { fromChecklist?: Template })?.fromChecklist;
  const template = fromChecklist ?? (id ? templates.find(t => t.id === id) : undefined);

  const handleSave = useCallback(async (tpl: Template) => {
    await saveTemplate(tpl);
    navigate('/templates');
  }, [saveTemplate, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/templates');
  }, [navigate]);

  return (
    <TemplateEditor
      template={template}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

const IdeaFlowPage: React.FC = () => {
  const navigate = useNavigate();
  const { saveTemplate } = useTemplate();

  const handleSave = useCallback(async (template: Template) => {
    await saveTemplate(template);
    navigate('/');
  }, [saveTemplate, navigate]);

  const handleEdit = useCallback((template: Template) => {
    navigate('/template/new', { state: { fromChecklist: template } });
  }, [navigate]);

  const handleClose = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return <IdeaFlowView onSave={handleSave} onEdit={handleEdit} onClose={handleClose} />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="settings" element={<SettingsView />} />
        <Route path="checklist/new" element={<ChecklistNewPage />} />
        <Route path="checklist/:id" element={<ChecklistDetailPage />} />
        <Route path="template/new" element={<TemplateEditPage />} />
        <Route path="template/:id/edit" element={<TemplateEditPage />} />
        <Route path="idea-flow" element={<IdeaFlowPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
