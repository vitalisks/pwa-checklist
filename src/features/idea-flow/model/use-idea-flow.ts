import { useState, useCallback, useRef, useEffect } from 'react';
import type { Template } from '@/shared/config';
import { generatePrompt, parseResponse } from '../api';
import type { ParseError } from '../api';
import { PROMPT_VERSION } from '../config';

export type IdeaFlowStep = 'input' | 'preview';

interface UseIdeaFlowReturn {
  step: IdeaFlowStep;
  idea: string;
  setIdea: (v: string) => void;
  isListening: boolean;
  hasSpeechSupport: boolean;
  toggleVoice: () => void;
  copyPromptToClipboard: (language: string) => Promise<boolean>;
  promptCopied: boolean;
  pasteAndParse: () => Promise<void>;
  parseError: ParseError | null;
  parsedTemplate: Template | null;
}

export function useIdeaFlow(): UseIdeaFlowReturn {
  const [step, setStep] = useState<IdeaFlowStep>('input');
  const [idea, setIdea] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [parseError, setParseError] = useState<ParseError | null>(null);
  const [parsedTemplate, setParsedTemplate] = useState<Template | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const hasSpeechSupport =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleVoice = useCallback(() => {
    if (!hasSpeechSupport) return;

    if (isListening) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    const SpeechRecognitionCtor =
      window.SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setIdea((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [hasSpeechSupport, isListening]);

  const copyPromptToClipboard = useCallback(async (language: string): Promise<boolean> => {
    if (!idea.trim()) return false;
    const { prompt } = generatePrompt(idea.trim(), language);
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      return true;
    } catch {
      return false;
    }
  }, [idea]);

  const pasteAndParse = useCallback(async () => {
    setParseError(null);
    if (!navigator.clipboard?.readText) {
      setParseError({ kind: 'clipboard_unavailable' });
      return;
    }
    let text = '';
    try {
      text = await navigator.clipboard.readText();
    } catch {
      setParseError({ kind: 'clipboard_unavailable' });
      return;
    }

    const result = parseResponse(text);

    if ('kind' in result) {
      setParseError(result);
    } else {
      const template: Template = {
        ...result,
        generatedFrom: { idea: idea.trim(), promptVersion: PROMPT_VERSION },
      };
      setParsedTemplate(template);
      setParseError(null);
      setStep('preview');
    }
  }, [idea]);

  return {
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
  };
}
