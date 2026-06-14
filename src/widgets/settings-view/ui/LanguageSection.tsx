import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation, LANGUAGES } from '@/shared/i18n';

const LanguageSection: React.FC = () => {
  const { language, changeLanguage, t } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showLangMenu) return;
    const handler = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showLangMenu]);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{t.settings.language}</h3>
        </div>
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="btn btn-soft h-8 px-3 text-xs flex items-center gap-1.5"
          >
            {LANGUAGES.find(l => l.code === language)?.nativeName ?? language}
            <ChevronDown size={14} className={`transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
          </button>
          {showLangMenu && (
            <div className="absolute right-0 top-full mt-1 z-50 card py-1 min-w-[160px]">
              {LANGUAGES.map(({ code, nativeName }) => (
                <button
                  key={code}
                  onClick={() => { changeLanguage(code); setShowLangMenu(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm ${language === code ? 'text-accent' : ''}`}
                >
                  {nativeName}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LanguageSection;
