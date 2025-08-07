'use client'

import { useState, useEffect } from 'react'

import NavigationControls from './nav/navigator'
import VivViewerWrapper from './map/VivViewerWrapper'
import { getDefaultMaxContrastLimit, getInitialNavigationState } from '../../../utils/getDefaults'
import { useZarrStore } from '../../../contexts/ZarrStoreContext'
import { useViewer2DData } from '../../../contexts/Viewer2DDataContext'

import type { 
  NavigationLimits, 
  NavigationHandlers,ChannelMapping, ContrastLimits
} from '../../../types/viewer2D'


export default function CrossViewer() {
  const { hasLoadedArray, msInfo } = useZarrStore()
  const { navigationState, setNavigationState } = useViewer2DData()
  
  // Navigation limits and handlers (state managed by context)
  const [navigationLimits, setNavigationLimits] = useState<NavigationLimits | null>(null)
  const navigationHandlers: NavigationHandlers = {
    onXOffsetChange: (value: number) => navigationState && setNavigationState({ ...navigationState, xOffset: value }),
    onYOffsetChange: (value: number) => navigationState && setNavigationState({ ...navigationState, yOffset: value }),
    onZSliceChange: (value: number) => navigationState && setNavigationState({ ...navigationState, zSlice: value }),
    onTimeSliceChange: (value: number) => navigationState && setNavigationState({ ...navigationState, timeSlice: value }),
    onContrastLimitsChange: (limits: ContrastLimits) => navigationState && setNavigationState({
      ...navigationState, contrastLimits: limits
    }),
    onChannelChange: (role: keyof ChannelMapping, value: number | null) => navigationState && setNavigationState({
      ...navigationState,
      channelMap: {
        ...navigationState.channelMap,
        [role]: value
      }
    })
  }

  /**
   * When the store is loaded from ZarrStoreContext, we now initialise the viewer with defaults
   */
  useEffect(() => {
    if (!msInfo || navigationState) {
      return; // Guard against missing multiscale information or already initialized
    }

    // Get the default navigation state (z-slice, channel map, etc.)
    const initialNavState = getInitialNavigationState(msInfo);
    
    // Calculate navigation limits based on the array's shape and data type
    const shape = msInfo.shape;
    const maxContrastLimit = getDefaultMaxContrastLimit(msInfo.dtype);

    setNavigationLimits({
      maxXOffset: 0,
      maxYOffset: 0,
      maxZSlice: shape.z ?? 0,
      maxTimeSlice: shape.t ?? 0,
      numChannels: msInfo.channels.length,
      maxContrastLimit
    });

    // Set the full, initial navigation state, including default contrast limits for the first channel
    setNavigationState({
      ...initialNavState,
      contrastLimits: [maxContrastLimit, maxContrastLimit] // Default contrast for the first channel
    });

  }, [hasLoadedArray, msInfo, navigationState, setNavigationState]) // When the store is loaded, initialize with default values

  return (
    <div style={{ 
      height: '100%', // Take height from parent
      minHeight: '500px', // Minimum usable height
      display: 'flex',
      flexDirection: 'column'
    }}>

      {hasLoadedArray && msInfo && navigationState && navigationLimits ? (
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          alignItems: 'stretch', // Stretch to fill height
          flex: 1, // Take remaining space
          minHeight: 0 // Allow flex child to shrink
        }}>
          <div style={{ 
            flex: 1, 
            minWidth: '60%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <VivViewerWrapper
              msInfo={msInfo}
              navigationState={navigationState}
            />
          </div>

          <NavigationControls
            msInfo={msInfo}
            navigationState={navigationState}
            navigationLimits={navigationLimits}
            navigationHandlers={navigationHandlers}
          />
        </div>
      ) : (
        <div style={{ 
          padding: '20px',
          textAlign: 'center',
          color: '#6c757d',
          fontStyle: 'italic'
        }}>
          Load a Zarr array to begin exploring with map-like navigation
        </div>
      )}
    </div>
  )
}