import React from 'react';
import { ArrowLeft, Mic, MicOff, Copy, ClipboardPaste, CheckCircle, AlertCircle, Save, Edit2 } from 'lucide-react';
import type { Template } from '@/shared/config';
import { useLanguage } from '@/shared/i18n';
import { useIdeaFlow } from '../model';
import { useEditingState } from '@/features/edit-template';
import { useNavigation } from '@/app/model/navigation-context';
import type { ParseError } from '../api';
import { motion } from 'framer-motion';

interface IdeaFlowViewProps {
  onSave: (template: Template) => void;
}

function buildCopyableError(error: ParseError): string {
  if (error.kind === 'invalid_json') {
    return `The JSON you returned is invalid. Please return ONLY valid JSON with no markdown or explanation.\n\nYour output was:\n${error.raw}`;
  }
  if (error.kind === 'invalid_schema') {
    return `The JSON structure is incorrect: ${error.detail}\n\nPlease fix and return ONLY the corrected JSON.\n\nYour output was:\n${error.raw}`;
  }
  return '';
}

function errorMessageKey(kind: ParseError['kind']): 'idea_error_empty' | 'idea_error_clipboard_unavailable' | 'idea_error_invalid_json' | 'idea_error_invalid_schema' {
  switch (kind) {
    case 'empty':
      return 'idea_error_empty';
    case 'clipboard_unavailable':
      return 'idea_error_clipboard_unavailable';
    case 'invalid_json':
      return 'idea_error_invalid_json';
    case 'invalid_schema':
      return 'idea_error_invalid_schema';
  }
}

const IdeaFlowView: React.FC<IdeaFlowViewProps> = ({ onSave }) => {
  const { t, language } = useLanguage();
  const { startEditing } = useEditingState();
  const { closeIdeaFlow } = useNavigation();
  const {
    step,
    idea,
    setIdea,
    isListening,
    hasSpeechSupport,
    toggleVoice,
    copyPromptToClipboard,
    promptCopied,
    pasteAndParse,
    parseError,
    parsedTemplate,
  } = useIdeaFlow();

  const handleCopy = async () => {
    await copyPromptToClipboard(language);
  };

  const handleCopyError = async () => {
    if (!parseError) return;
    const msg = buildCopyableError(parseError);
    await navigator.clipboard.writeText(msg);
  };

  const handleSave = () => {
    if (parsedTemplate) onSave(parsedTemplate);
  };

  const handleEdit = () => {
    if (parsedTemplate) {
      startEditing(parsedTemplate);
      closeIdeaFlow();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={closeIdeaFlow} className="btn-icon" aria-label={t('idea_back')}>
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold">
          {step === 'input' ? t('idea_view_title') : t('idea_preview_title')}
        </h2>
      </div>

      {step === 'input' && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="card space-y-3">
            <textarea
              className="input min-h-[120px]"
              placeholder={t('idea_placeholder')}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              autoFocus
            />
            {hasSpeechSupport && (
              <button
                onClick={toggleVoice}
                className={`btn btn-ghost text-xs gap-1.5 ${isListening ? 'text-accent' : ''}`}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                {isListening ? t('idea_listening') : t('idea_voice_start')}
              </button>
            )}
          </div>

          <div className="card space-y-3">
            <p className="text-xs text-secondary">{t('idea_copy_instruction')}</p>
            <button
              onClick={handleCopy}
              disabled={!idea.trim()}
              className="btn btn-primary w-full"
            >
              {promptCopied ? (
                <>
                  <CheckCircle size={16} />
                  {t('idea_copy_success')}
                </>
              ) : (
                <>
                  <Copy size={16} />
                  {t('idea_create_template')}
                </>
              )}
            </button>
          </div>

          <div className="card space-y-3">
            <button
              onClick={pasteAndParse}
              className="btn btn-ghost w-full border border-subtle"
            >
              <ClipboardPaste size={16} />
              {t('idea_paste_button')}
            </button>

            {parseError && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-danger">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{t(errorMessageKey(parseError.kind))}</span>
                </div>
                {(parseError.kind === 'invalid_json' || parseError.kind === 'invalid_schema') && (
                  <button
                    onClick={handleCopyError}
                    className="btn btn-ghost text-xs gap-1"
                  >
                    <Copy size={12} />
                    {t('idea_copy_error')}
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {step === 'preview' && parsedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="card space-y-1">
            <h3 className="font-semibold text-base">{parsedTemplate.title}</h3>
            {parsedTemplate.description && (
              <p className="text-sm text-secondary">{parsedTemplate.description}</p>
            )}
            <p className="section-label mt-1">
              {parsedTemplate.categories.reduce((acc, c) => acc + c.items.length, 0)} {t('templates_items')} &middot; {parsedTemplate.categories.length} {t('templates_categories')}
            </p>
          </div>

          {parsedTemplate.categories.map((cat) => (
            <div key={cat.id} className="card space-y-2">
              <p className="text-sm font-semibold">{cat.name}</p>
              <ul className="space-y-1">
                {cat.items.map((item) => (
                  <li key={item.id} className="text-sm text-secondary flex gap-2">
                    <span className="text-accent mt-0.5">·</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex gap-3">
            <button onClick={handleEdit} className="btn btn-ghost flex-1 border border-subtle">
              <Edit2 size={15} />
              {t('idea_preview_edit')}
            </button>
            <button onClick={handleSave} className="btn btn-primary flex-1">
              <Save size={15} />
              {t('idea_preview_save')}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default IdeaFlowView;
