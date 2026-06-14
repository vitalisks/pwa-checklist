/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { buildTr } from './buildTr'
import type { Tr } from './tr'
import { DEFAULT_LANGUAGE, languageLoaders } from './translations'
import type { Translations } from './translations'
import defaultTranslations from './locales/en'

interface I18nContextValue {
  language: string
  isLoading: boolean
  changeLanguage: (lang: string) => void
  t: Tr
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = 'checklist_lang'

function getInitialLanguage(): string {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && languageLoaders[saved]) return saved
  const browserLang = navigator.language.split('-')[0]
  if (languageLoaders[browserLang]) return browserLang
  return DEFAULT_LANGUAGE
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState(getInitialLanguage)
  const [translations, setTranslations] = useState<Translations>(defaultTranslations)

  useEffect(() => {
    if (language === DEFAULT_LANGUAGE) {
      setTranslations(defaultTranslations) // eslint-disable-line react-hooks/set-state-in-effect
      return
    }
    let cancelled = false
    languageLoaders[language]()
      .then(loaded => {
        if (!cancelled) setTranslations(loaded)
      })
      .catch(() => {
        if (cancelled) return
        setTranslations(defaultTranslations)
        setLanguage(DEFAULT_LANGUAGE)
      })

    return () => { cancelled = true }
  }, [language])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const changeLanguage = useCallback((lang: string) => {
    if (!languageLoaders[lang]) return
    setLanguage(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }, [])

  const t = useMemo(() => buildTr(translations), [translations])

  const value = useMemo(
    () => ({ language, isLoading: false, changeLanguage, t }),
    [language, changeLanguage, t]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18nContext(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18nContext must be used within I18nProvider')
  return ctx
}
