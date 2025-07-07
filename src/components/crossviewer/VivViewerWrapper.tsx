import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  VivViewer,
  OverviewView,
  DetailView,
  getDefaultInitialViewState,
  OVERVIEW_VIEW_ID,
  DETAIL_VIEW_ID
} from '@hms-dbmi/viv'
import { PolygonLayer } from '@deck.gl/layers'
import { AltZarrPixelSource } from '../../ext/AltZarrPixelSource'
import { useZarrStore } from '../../contexts/ZarrStoreContext'
import { FrameView, FRAME_VIEW_ID } from './FrameView'
import type { NavigationState } from '../../types/crossviewer'

export { FRAME_VIEW_ID } from './FrameView'

type VivWrapperProps = {
  currentArray: any
  arrayInfo: any
  navigationState: NavigationState
  loading: boolean
  onError: (error: string) => void
}

export const VivViewerWrapper: React.FC<VivWrapperProps> = ({
  currentArray,
  arrayInfo,
  navigationState,
  loading,
  onError
}) => {
  const { omeData } = useZarrStore()
  const [vivLoaders, setVivLoaders] = useState<AltZarrPixelSource[]>([])
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 })
  const [frameCenter, setFrameCenter] = useState<[number, number]>([500, 500])
  const [frameSize, setFrameSize] = useState<[number, number]>([400, 400])
  const [detailViewState, setDetailViewState] = useState<any>(null)
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

  // Initialize frame center based on array dimensions
  useEffect(() => {
    if (currentArray && arrayInfo) {
      const shape = currentArray.shape
      const width = shape[shape.length - 1]
      const height = shape[shape.length - 2]
      setFrameCenter([width / 2, height / 2])
      setFrameSize([Math.min(width, height) * 0.2, Math.min(width, height) * 0.2]) // 20% of smaller dimension
      
      // Initialize detail view state
      setDetailViewState({
        target: [width / 2, height / 2, 0],
        zoom: 0
      })
    }
  }, [currentArray, arrayInfo])

  useEffect(() => {
    setVivLoaders(createVivLoaders)
    
    // Update frame center and size when array changes
    if (currentArray) {
      const shape = currentArray.shape
      const height = shape[shape.length - 2] || 1000
      const width = shape[shape.length - 1] || 1000
      
      // Set frame center to image center
      setFrameCenter([width / 2, height / 2])
      
      // Set frame size to be proportional to image size - make it bigger for visibility
      const frameWidth = Math.min(width / 2, 800)
      const frameHeight = Math.min(height / 2, 800)
      setFrameSize([frameWidth, frameHeight])
    }
  }, [createVivLoaders, currentArray])

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

  // Create a layer for the selection frame using PolygonLayer
  const frameOverlayLayer = useMemo(() => {
    if (!currentArray) return null;

    // Create a simple test polygon that should be visible
    const testPolygon = [
      [0, 0],
      [200, 0],
      [200, 200],
      [0, 200],
      [0, 0]
    ];

    const [centerX, centerY] = frameCenter;
    const [width, height] = frameSize;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Create a hollow rectangle polygon (frame)
    const framePolygon = [
      [centerX - halfWidth, centerY - halfHeight],
      [centerX + halfWidth, centerY - halfHeight],
      [centerX + halfWidth, centerY + halfHeight],
      [centerX - halfWidth, centerY + halfHeight],
      [centerX - halfWidth, centerY - halfHeight] // Close the polygon
    ];

    console.log('Frame polygon coordinates:', framePolygon);
    console.log('Frame center:', frameCenter, 'Frame size:', frameSize);
    console.log('Test polygon coordinates:', testPolygon);

    const layer = new PolygonLayer({
      id: 'frame-overlay',
      data: [
        { contour: framePolygon },
        { contour: testPolygon }
      ],
      getPolygon: d => d.contour,
      getFillColor: [255, 0, 0, 200], // Bright red fill
      getLineColor: [255, 255, 255, 255], // White border
      getLineWidth: 10,
      lineWidthUnits: 'pixels',
      filled: true,
      stroked: true,
      pickable: false, // Make sure it doesn't capture mouse events
      parameters: { depthTest: false }, // Ensure it renders on top
      coordinateSystem: 0, // Use default coordinate system
    })
    console.log(`Layer:`, layer) // Debug log
    return layer;
  }, [currentArray, frameCenter, frameSize]);

  const handleOverviewClick = useCallback((info: any) => {
    console.log('Click info:', info) // Debug log
    
    // Only handle clicks on the overview viewport
    if (info.viewport && info.viewport.id === OVERVIEW_VIEW_ID && info.coordinate) {
      const [x, y] = info.coordinate
      console.log('Moving frame to:', x, y) // Debug log
      setFrameCenter([x, y])
      
      // Update the detail view to center on clicked position
      const newViewState = {
        target: [x, y, 0],
        zoom: detailViewState?.zoom || 0
      }
      setDetailViewState(newViewState)
    }
  }, [detailViewState])

  // Handle view state changes to keep frame synchronized
  const handleViewStateChange = useCallback(({ viewId, viewState, oldViewState }: any) => {
    if (viewId === DETAIL_VIEW_ID) {
      setDetailViewState(viewState)
      if (viewState.target) {
        setFrameCenter([viewState.target[0], viewState.target[1]])
      }
    }
  }, [])

  // Overview configuration
  const overview = useMemo(() => ({
    height: Math.min(120, Math.floor(containerDimensions.height * 0.2)),
    width: Math.min(120, Math.floor(containerDimensions.width * 0.2)),
    zoom: -6,
    backgroundColor: [0, 0, 0]
  }), [containerDimensions])

  // Generate view instances following Viv's pattern
  const views = useMemo(() => {
    if (vivLoaders.length === 0) return []
    
    // Create views array similar to PictureInPictureViewer
    const detailView = new DetailView({ 
      id: DETAIL_VIEW_ID,
      height: containerDimensions.height,
      width: containerDimensions.width
    })
    
    const overviewView = new OverviewView({ 
      id: OVERVIEW_VIEW_ID,
      loader: vivLoaders,
      detailHeight: containerDimensions.height,
      detailWidth: containerDimensions.width
    })
    
    const frameView = new FrameView({ 
      id: FRAME_VIEW_ID,
      x: 0,
      y: 0,
      height: containerDimensions.height,
      width: containerDimensions.width
    })
    
    return [detailView, overviewView, frameView]
  }, [vivLoaders, containerDimensions])

  // Generate view states following Viv's pattern
  const viewStates = useMemo(() => {
    if (vivLoaders.length === 0 || views.length === 0) return []
    
    // Create view states array matching views order
    const overviewState = getDefaultInitialViewState(vivLoaders, overview, 0.5)
    const detailState = detailViewState || getDefaultInitialViewState(vivLoaders, containerDimensions, 0)
    
    return [
      { ...detailState, id: DETAIL_VIEW_ID },
      { ...overviewState, id: OVERVIEW_VIEW_ID },
      { ...detailState, id: FRAME_VIEW_ID } // Frame follows detail view state
    ]
  }, [vivLoaders, views, overview, containerDimensions, detailViewState])

  // Generate layer props following Viv's pattern
  const layerProps = useMemo(() => {
    if (vivLoaders.length === 0 || views.length === 0) return []
    
    const baseProps = {
      loader: vivLoaders,
      selections: [selection],
      colors: colorAndContrast.colors,
      contrastLimits: colorAndContrast.contrastLimits,
      channelsVisible: [true]
    }
    
    // Return layer props for each view in the same order as views array
    return views.map((view) => {
      if (view.id === FRAME_VIEW_ID) {
        // Frame view gets the overlay layer
        return { ...baseProps, frameOverlayLayer }
      }
      return baseProps
    })
  }, [vivLoaders, views, selection, colorAndContrast, frameOverlayLayer])

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

  if (!currentArray || !arrayInfo || vivLoaders.length === 0 || views.length === 0) {
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
        overflow: 'hidden'
      }}
      tabIndex={0} // Make the container focusable
    >
      <VivViewer
        views={views}
        layerProps={layerProps}
        viewStates={viewStates}
        onViewStateChange={handleViewStateChange}
        deckProps={{
          style: { backgroundColor: 'black' },
          controller: true,
          pickingRadius: 5,
          onClick: handleOverviewClick
        }}
      />
    </div>
  )
}
