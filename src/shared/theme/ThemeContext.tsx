import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

export type ThemeMode = 'system' | 'dark' | 'light'
export type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = 'moirai-theme'

function getStoredMode(): ThemeMode | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light' || stored === 'system') return stored
  return null
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'system') return getSystemTheme()
  return mode
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#1f1f1d' : '#e8e4dc')
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => getStoredMode() ?? 'system')
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(themeMode))

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode)
    localStorage.setItem(STORAGE_KEY, mode)
    setTheme(resolveTheme(mode))
  }, [])

  useEffect(() => {
    if (themeMode !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handler = () => setTheme(resolveTheme('system'))
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeMode])

  const value = useMemo(() => ({ theme, themeMode, setThemeMode }), [theme, themeMode, setThemeMode])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
