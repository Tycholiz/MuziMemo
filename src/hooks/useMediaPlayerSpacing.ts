import { useMemo } from 'react'
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext'
import { theme } from '../utils/theme'

/**
 * Custom hook to provide appropriate bottom spacing when the media player is visible
 * This ensures scrollable content doesn't get obscured by the persistent bottom media player
 */
export function useMediaPlayerSpacing() {
  const audioPlayer = useAudioPlayerContext()

  // Calculate the media player height based on its styling
  // MediaCard: padding (16px) + content (~48px) = ~64px
  // AudioProgressBar: paddingVertical (16px) + slider (40px) + time labels (~16px) + margins (4px) = ~76px
  // Total BottomMediaPlayer height = ~140px
  const MEDIA_PLAYER_HEIGHT = 140

  const bottomSpacing = useMemo(() => {
    // Only add bottom spacing when media player is visible (currentClip exists)
    return audioPlayer.currentClip ? MEDIA_PLAYER_HEIGHT + theme.spacing.md : theme.spacing.md
  }, [audioPlayer.currentClip])

  return {
    /**
     * Bottom padding to add to scrollable containers to prevent overlap with media player
     */
    bottomPadding: bottomSpacing,

    /**
     * Whether the media player is currently visible
     */
    isMediaPlayerVisible: !!audioPlayer.currentClip,

    /**
     * The calculated height of the media player component
     */
    mediaPlayerHeight: MEDIA_PLAYER_HEIGHT,
  }
}
