'use client'

import { useState, useCallback } from 'react'
import { Array, DataType } from 'zarrita'
import ArrayLoader from '../loader/ArrayLoader'
import { VivViewerWrapper } from './map/VivViewerWrapper'
import NavigationControls from './nav/navigator'
import { useZarrStore } from '../../contexts/ZarrStoreContext'

import type { NavigationState, NavigationLimits, NavigationHandlers, ChannelMapping, ContrastLimits } from '../../types/crossviewer'
import { getDefaultMaxContrastLimit, getInitialNavigationState } from './utils/getDefaults'
import type { IArrayInfo } from '../../types/loader'


export default function CrossViewer() {
  const { availableChannels } = useZarrStore()
  const [loading, setLoading] = useState(false)
  const [_, setError] = useState<string | null>(null)
  const [arrayInfo, setArrayInfo] = useState<IArrayInfo | null>(null)
  const [currentArray, setCurrentArray] = useState<Array<DataType> | null>(null)
  const [selectedResolution, setSelectedResolution] = useState('0')
  
  // Navigation state and limits
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null)
  const [navigationLimits, setNavigationLimits] = useState<NavigationLimits | null>(null)

  // Navigation handlers
  const navigationHandlers: NavigationHandlers = {
    onXOffsetChange: (value: number) => setNavigationState(prev => prev ? ({ ...prev, xOffset: value }) : prev),
    onYOffsetChange: (value: number) => setNavigationState(prev => prev ? ({ ...prev, yOffset: value }) : prev),
    onZSliceChange: (value: number) => setNavigationState(prev => prev ? ({ ...prev, zSlice: value }) : prev),
    onTimeSliceChange: (value: number) => setNavigationState(prev => prev ? ({ ...prev, timeSlice: value }) : prev),
    onContrastLimitsChange: (limits: ContrastLimits) => setNavigationState(
      prev => prev ? ({ ...prev, contrastLimits: limits }) : prev
    ),
    onChannelChange: (role: keyof ChannelMapping, value: number | null) => setNavigationState(prev => prev ? ({
      ...prev,
      channelMap: {
        ...prev.channelMap,
        [role]: value
      }
    }) : prev)
  }

  /**
   * This callback is now the single source of truth for initializing
   * all state related to a newly loaded Zarr array.
   */
  const handleArrayLoaded = useCallback((array: Array<DataType>, info: IArrayInfo) => {
    // 1. Set the current array and info
    setCurrentArray(array)
    setArrayInfo(info)
    setError(null) // Clear any previous errors

    // 2. Initialize navigation state and limits
    if (!availableChannels) {
      return; // Guard against missing channel names
    }

    // Get the default navigation state (z-slice, channel map, etc.)
    const initialNavState = getInitialNavigationState(array, availableChannels);
    
    // Calculate navigation limits based on the array's shape and data type
    const shape = array.shape;
    const channels = shape.length >= 4 ? (shape.length === 5 ? shape[1] : shape[0]) : 1;
    const maxZ = shape.length >= 3 ? Math.max(0, shape[shape.length - 3] - 1) : 0;
    const maxTime = shape.length === 5 ? Math.max(0, shape[0] - 1) : 0; // Time is only in 5D arrays
    const maxContrastLimit = getDefaultMaxContrastLimit(array.dtype);

    setNavigationLimits({
      maxXOffset: 0,
      maxYOffset: 0,
      maxZSlice: maxZ,
      maxTimeSlice: maxTime,
      numChannels: channels,
      maxContrastLimit
    });

    // Set the full, initial navigation state, including default contrast limits for the first channel
    setNavigationState({
      ...initialNavState,
      contrastLimits: [maxContrastLimit, maxContrastLimit] // Default contrast for the first channel
    });

  }, [availableChannels]) // This callback depends on `availableChannels` from the context

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setCurrentArray(null)
    setArrayInfo(null)
  }, [])

  return (
    <div style={{ 
      height: '100%', // Take height from parent
      minHeight: '500px', // Minimum usable height
      display: 'flex',
      flexDirection: 'column'
    }}>
      <ArrayLoader
        onArrayLoaded={handleArrayLoaded}
        onError={handleError}
        onLoadingChange={setLoading}
        externalResolution={selectedResolution}
        onResolutionUsed={(resolution) => {
          if (resolution !== selectedResolution) {
            setSelectedResolution(resolution)
          }
        }}
      />

      {arrayInfo && navigationState && navigationLimits ? (
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
              currentArray={currentArray}
              arrayInfo={arrayInfo}
              navigationState={navigationState}
              loading={loading}
              onError={handleError}
            />
          </div>

          <NavigationControls
            arrayInfo={arrayInfo}
            navigationState={navigationState}
            navigationLimits={navigationLimits}
            navigationHandlers={navigationHandlers}
            channelNames={availableChannels}
          />
        </div>
      ) : (
        <div style={{ 
          padding: '20px',
          textAlign: 'center',
          color: '#6c757d',
          fontStyle: 'italic'
        }}>
          {loading ? 'Loading...' : 'Load a Zarr array to begin exploring with map-like navigation'}
        </div>
      )}
    </div>
  )
}