/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type FontScale = 'small' | 'normal' | 'large'

type ThemeContextValue = {
  theme: Theme
  fontScale: FontScale
  setFontScale: (fontScale: FontScale) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'cyber-arena-theme'
const FONT_SCALE_STORAGE_KEY = 'cyber-arena-font-scale'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  return storedTheme === 'dark' ? 'dark' : 'light'
}

function getInitialFontScale(): FontScale {
  if (typeof window === 'undefined') {
    return 'normal'
  }

  const storedFontScale = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY)
  return storedFontScale === 'small' || storedFontScale === 'large' ? storedFontScale : 'normal'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [fontScale, setFontScale] = useState<FontScale>(getInitialFontScale)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.fontScale = fontScale
    document.documentElement.style.fontSize =
      fontScale === 'small' ? '15px' : fontScale === 'large' ? '18px' : '16px'
    window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, fontScale)
  }, [fontScale])

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ fontScale, setFontScale, setTheme, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
