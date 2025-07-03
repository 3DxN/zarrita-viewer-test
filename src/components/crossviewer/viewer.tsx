'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { PictureInPictureViewer } from '@hms-dbmi/viv'
import { AltZarrPixelSource } from '../../ext/AltZarrPixelSource'
import { useZarrStore } from '../../contexts/ZarrStoreContext'

import type { NavigationState, ZarrViewerProps } from '../../types/crossviewer'

export default function ZarrViewer({
  currentArray,
  arrayInfo,
  navigationState,
  loading,
  onError
}: ZarrViewerProps) {
  const { omeData } = useZarrStore()
  const [vivLoaders, setVivLoaders] = useState<AltZarrPixelSource[]>([])
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Hook to observe container size changes
  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current
      setContainerDimensions({ 
        width: Math.max(clientWidth, 400), // Minimum width
        height: Math.max(clientHeight, 400) // Minimum height
      })
    }
  }, [])

  useEffect(() => {
    updateDimensions()
    
    // Set up ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    return () => resizeObserver.disconnect()
  }, [updateDimensions])

  // Create Viv loaders from the current array
  const createVivLoaders = useMemo(() => {
    if (!currentArray || !arrayInfo) return []

    try {
      // Determine the axis labels based on array shape
      const shape = currentArray.shape
      let labels: string[] = []
      
      if (shape.length === 5) {
        labels = ['t', 'c', 'z', 'y', 'x']
      } else if (shape.length === 4) {
        // Could be CZYX or TZYX - assume CZYX for now
        labels = ['c', 'z', 'y', 'x']
      } else if (shape.length === 3) {
        labels = ['z', 'y', 'x']
      } else if (shape.length === 2) {
        labels = ['y', 'x']
      } else {
        throw new Error(`Unsupported array shape: ${shape}`)
      }

      // Create a single loader for the full resolution
      const loader = new AltZarrPixelSource(currentArray, {
        labels: labels as any, // Type assertion for Viv's complex label typing
        tileSize: 256
      })

      return [loader]
    } catch (error) {
      console.error('Failed to create Viv loaders:', error)
      onError(`Failed to create Viv loaders: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return []
    }
  }, [currentArray, arrayInfo, onError])

  useEffect(() => {
    setVivLoaders(createVivLoaders)
  }, [createVivLoaders])

  // Calculate selection based on navigation state
  const selection = useMemo(() => {
    if (!currentArray) return {}

    const selection: Record<string, number> = {}
    const shape = currentArray.shape

    if (shape.length >= 4) {
      selection.c = navigationState.currentChannel
    }
    if (shape.length >= 3) {
      selection.z = navigationState.zSlice
    }
    if (shape.length >= 5) {
      selection.t = navigationState.timeSlice
    }

    return selection
  }, [currentArray, navigationState])

  // Generate dynamic colors and contrast limits
  const colorAndContrast = useMemo(() => {
    if (!currentArray) return { colors: [[255, 255, 255]], contrastLimits: [[0, 4095]] }

    // Default color palette for multiple channels
    const defaultColors = [
      [255, 0, 0],   // Red
      [0, 255, 0],   // Green  
      [0, 0, 255],   // Blue
      [255, 255, 0], // Yellow
      [255, 0, 255], // Magenta
      [0, 255, 255], // Cyan
      [255, 128, 0], // Orange
      [128, 0, 255]  // Purple
    ]

    // Determine number of channels
    const shape = currentArray.shape
    let numChannels = 1
    if (shape.length >= 4) {
      if (shape.length === 5) {
        numChannels = shape[1] // TCZYX
      } else if (shape.length === 4) {
        numChannels = shape[0] <= 10 ? shape[0] : 1 // CZYX (assume C if small number)
      }
    }

    // Get color for current channel or use first channel color if single channel
    const channelIndex = navigationState.currentChannel || 0
    const color = defaultColors[channelIndex % defaultColors.length]

    // Try to get better contrast limits from OME metadata
    let contrastMin = 0
    let contrastMax = 4095
    
    if (omeData?.multiscales?.[0]?.datasets?.[0]?.transforms?.[0]?.scale) {
      // Use dtype to determine better contrast limits
      const dtype = currentArray.dtype || 'uint16'
      if (dtype.includes('uint8')) {
        contrastMax = 255
      } else if (dtype.includes('uint16')) {
        contrastMax = 65535
      } else if (dtype.includes('float')) {
        contrastMax = 1.0
      }
    }

    return {
      colors: [color],
      contrastLimits: [[contrastMin, contrastMax]]
    }
  }, [currentArray, navigationState.currentChannel, omeData])

  if (loading) {
    return (
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f9f9f9'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading...</div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Preparing map viewer</div>
        </div>
      </div>
    )
  }

  if (!currentArray || !arrayInfo || vivLoaders.length === 0) {
    return (
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f9f9f9'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>No data loaded</div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Load a Zarr array to begin viewing</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="viv-viewer-container"
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        position: 'relative',
        overflow: 'hidden',
        // Ensure this container captures and constrains events
        isolation: 'isolate',
        // Add transform to create a new stacking context
        transform: 'translateZ(0)',
        // Contain layout and style to prevent leakage
        contain: 'layout style'
      }}
      onMouseLeave={(e) => {
        // Prevent event bubbling when mouse leaves the viewer area
        e.stopPropagation()
      }}
      onMouseEnter={(e) => {
        // Ensure focus is captured when entering the viewer
        e.currentTarget.focus()
      }}
      tabIndex={0} // Make the container focusable
    >
      <PictureInPictureViewer
        loader={vivLoaders}
        selections={[selection]}
        height={containerDimensions.height}
        width={containerDimensions.width}
        overview={{
          maximumWidth: 100, 
          maximumHeight: 100,
        }}
        overviewOn={true}
        contrastLimits={colorAndContrast.contrastLimits}
        colors={colorAndContrast.colors}
        channelsVisible={[true]}
        onViewportLoad={() => {
          console.log('Viewport loaded with dimensions:', containerDimensions)
        }}
      />
    </div>
  )
}