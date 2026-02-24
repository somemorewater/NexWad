import { createContext, useEffect, useMemo, useState } from 'react'

export const ThemeContext = createContext(null)

const STORAGE_KEY = 'nexwad_theme'
const THEMES = ['original', 'dark', 'red', 'blue', 'green', 'yellow']

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('original')

  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE_KEY)
    if (storedTheme && THEMES.includes(storedTheme)) {
      setThemeState(storedTheme)
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (nextTheme) => {
    if (!THEMES.includes(nextTheme)) return
    setThemeState(nextTheme)
  }

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
