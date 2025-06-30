'use client'

import { useState, useCallback } from 'react'
import ArrayLoader from '../common/ArrayLoader'
import ZarrViewer from './viewer'
import NavigationControls from './navigator'

import type { CrossViewerProps, NavigationState, NavigationLimits, NavigationHandlers } from '../../types/crossviewer'


export default function CrossViewer() {
  const [loading, setLoading] = useState(false)
  const [_, setError] = useState<string | null>(null)
  const [arrayInfo, setArrayInfo] = useState<any>(null)
  const [currentArray, setCurrentArray] = useState<any>(null)
  
  // Navigation state
  const [navigationState, setNavigationState] = useState<NavigationState>({
    xOffset: 0,
    yOffset: 0,
    zSlice: 0,
    timeSlice: 0,
    currentChannel: 0
  })
  
  // Navigation limits
  const [navigationLimits, setNavigationLimits] = useState<NavigationLimits>({
    maxXOffset: 0,
    maxYOffset: 0,
    maxZSlice: 0,
    maxTimeSlice: 0,
    numChannels: 1
  })

  // Navigation handlers
  const navigationHandlers: NavigationHandlers = {
    onXOffsetChange: (value: number) => setNavigationState(prev => ({ ...prev, xOffset: value })),
    onYOffsetChange: (value: number) => setNavigationState(prev => ({ ...prev, yOffset: value })),
    onZSliceChange: (value: number) => setNavigationState(prev => ({ ...prev, zSlice: value })),
    onTimeSliceChange: (value: number) => setNavigationState(prev => ({ ...prev, timeSlice: value })),
    onChannelChange: (value: number) => setNavigationState(prev => ({ ...prev, currentChannel: value }))
  }

  const setupNavigationControls = useCallback((arr: any) => {
    const width = arr.shape[arr.shape.length - 1]
    const height = arr.shape[arr.shape.length - 2]
    
    // Determine number of channels based on array shape
    let channels = 1
    if (arr.shape.length >= 4) {
      if (arr.shape.length === 5) {
        channels = arr.shape[1]
      } else if (arr.shape.length === 4) {
        channels = arr.shape[0] <= 10 ? arr.shape[0] : 1
      }
    }
    
    // Set Z slice range
    let maxZ = 0
    if (arr.shape.length >= 3) {
      const zDim = arr.shape.length - 3
      maxZ = Math.max(0, arr.shape[zDim] - 1)
    }
    
    // Set time slice range
    let maxTime = 0
    if (arr.shape.length >= 4) {
      let timeDim = 0
      if (arr.shape.length === 5) {
        timeDim = 0
      } else if (arr.shape.length === 4) {
        timeDim = 0
      }
      maxTime = Math.max(0, arr.shape[timeDim] - 1)
    }
    
    // Update navigation limits
    setNavigationLimits({
      maxXOffset: Math.max(0, width - 256),
      maxYOffset: Math.max(0, height - 256),
      maxZSlice: maxZ,
      maxTimeSlice: maxTime,
      numChannels: channels
    })
    
    // Reset navigation values
    setNavigationState({
      xOffset: 0,
      yOffset: 0,
      zSlice: arr.shape.length >= 3 ? Math.floor(arr.shape[arr.shape.length - 3] / 2) : 0,
      timeSlice: 0,
      currentChannel: 0
    })
  }, [])

  const handleArrayLoaded = useCallback((array: any, info: any) => {
    setCurrentArray(array)
    setArrayInfo(info)
    setupNavigationControls(array)
    setError(null)
  }, [setupNavigationControls])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setCurrentArray(null)
    setArrayInfo(null)
  }, [])

  return (
    <div style={{ border: '1px solid #dee2e6', padding: '15px', borderRadius: '8px', backgroundColor: 'white' }}>
      <ArrayLoader
        onArrayLoaded={handleArrayLoaded}
        onError={handleError}
        onLoadingChange={setLoading}
      />

      {arrayInfo ? (
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          alignItems: 'flex-start',
        }}>
          <div style={{ flex: 1, minWidth: '20%' }}>
            <ZarrViewer
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
          />
        </div>
      ) : (
        <ZarrViewer
          currentArray={null}
          arrayInfo={null}
          navigationState={navigationState}
          loading={loading}
          onError={handleError}
        />
      )}
    </div>
  )
}