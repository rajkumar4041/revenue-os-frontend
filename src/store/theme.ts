import { useReduxState } from 'redux-toolkit-state'
import { applyTheme, getInitialTheme, type Theme } from '@/lib/theme'

export function useTheme() {
  const [theme, setTheme] = useReduxState<Theme>('theme', getInitialTheme())

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return { theme, toggle }
}
