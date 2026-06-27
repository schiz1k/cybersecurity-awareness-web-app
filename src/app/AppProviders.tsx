import { ContentProvider } from '../hooks/useContentState'
import { LeaderboardProvider } from '../hooks/useLeaderboardState'
import { PlatformProvider } from '../hooks/usePlatformState'
import { ThemeProvider } from '../hooks/useTheme'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ContentProvider>
        <LeaderboardProvider>
          <PlatformProvider>{children}</PlatformProvider>
        </LeaderboardProvider>
      </ContentProvider>
    </ThemeProvider>
  )
}
