import { useI18nContext } from './I18nProvider'

export function useTranslation() {
  const { t, language, changeLanguage } = useI18nContext()
  return { t, language, changeLanguage }
}
