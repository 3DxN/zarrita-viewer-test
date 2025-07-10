import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  VivViewer,
  OverviewView,
  DetailView,
  getDefaultInitialViewState,
  OVERVIEW_VIEW_ID,
  DETAIL_VIEW_ID
} from '@hms-dbmi/viv'
import { AltZarrPixelSource } from '../../../ext/AltZarrPixelSource'
import { useZarrStore } from '../../../contexts/ZarrStoreContext'
import { 
  FrameView, 
  FRAME_VIEW_ID, 
  createFrameOverlayLayers,
  DragMode,
  FrameInteractionState,
  getCursorForDragMode,
  calculateFrameResize
} from './FrameView'
import type { NavigationState } from '../../../types/crossviewer'

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
  const [frameInteraction, setFrameInteraction] = useState<FrameInteractionState>({
    isDragging: false,
    dragMode: 'none',
    startPos: [0, 0],
    startFrameCenter: [0, 0],
    startFrameSize: [0, 0]
  })
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null)
  const [detailViewDrag, setDetailViewDrag] = useState<{
    isDragging: boolean,
    startPos: [number, number],
    startTarget: [number, number, number]
  }>({
    isDragging: false,
    startPos: [0, 0],
    startTarget: [0, 0, 0]
  })
  
  // Use controlled view states to prevent feedback loops
  const [controlledDetailViewState, setControlledDetailViewState] = useState<any>(null)
  const [isManuallyPanning, setIsManuallyPanning] = useState(false)
  
  // Use a ref to track the current detail view state without triggering re-renders
  const detailViewStateRef = useRef<any>(null)
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
      
      // Initialize detail view state ref and controlled state
      const initialState = {
        target: [width / 2, height / 2, 0],
        zoom: 0
      };
      detailViewStateRef.current = initialState;
      setControlledDetailViewState(initialState);
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

  // Handle frame interactions (handles and move area are pickable)
  const handleFrameInteraction = useCallback((info: any) => {
    if (!info || !info.object) return false;
    
    const layerType = info.object.type;
    console.log('Frame interaction:', layerType, info);
    console.log('Layer ID:', info.layer?.id);
    console.log('Viewport ID:', info.viewport?.id);
    
    // Handle resize operations on handle clicks
    if (layerType && layerType.startsWith('resize-')) {
      console.log('Handle clicked, starting resize operation:', layerType);
      setFrameInteraction({
        isDragging: true,
        dragMode: layerType as DragMode,
        startPos: [info.coordinate[0], info.coordinate[1]],
        startFrameCenter: [...frameCenter],
        startFrameSize: [...frameSize]
      });
      return true; // Interaction handled
    }
    
    // Handle move operations on frame area clicks
    if (layerType === 'move') {
      console.log('Frame area clicked, starting move operation');
      setFrameInteraction({
        isDragging: true,
        dragMode: 'move',
        startPos: [info.coordinate[0], info.coordinate[1]],
        startFrameCenter: [...frameCenter],
        startFrameSize: [...frameSize]
      });
      return true; // Interaction handled
    }
    
    return false; // No interaction handled, let detail view handle it
  }, [frameCenter, frameSize]);

  // Create interactive frame overlay layers
  const frameOverlayLayers = useMemo(() => {
    if (!currentArray) return [];

    return createFrameOverlayLayers(frameCenter, frameSize, FRAME_VIEW_ID, {
      fillColor: [0, 0, 0, 0] as [number, number, number, number], // Transparent - will be overridden anyway
      lineColor: [255, 255, 255, 255] as [number, number, number, number],
      lineWidth: 3,
      filled: false, // Will be overridden - frame gets no fill, transparent fill layer added separately
      stroked: true,
      showHandles: true,
      handleSize: 8, // Larger handles for easier interaction
      hoveredHandle
    });
  }, [currentArray, frameCenter, frameSize, hoveredHandle]);

  // Handle DeckGL hover events for visual feedback only
  const handleHover = useCallback((info: any) => {
    // Only update hover state for handles (only handles are pickable now)
    if (!frameInteraction.isDragging && info.object && info.object.type && info.object.type.startsWith('resize-') && info.layer && info.layer.id && info.layer.id.includes('handle')) {
      console.log('Hovering over handle:', info.object.type);
      setHoveredHandle(info.object.type);
    } else if (!frameInteraction.isDragging) {
      // Clear hover when not over any handle - this includes moving from handle to frame area
      if (hoveredHandle !== null) {
        console.log('Clearing hovered handle');
        setHoveredHandle(null);
      }
    }
  }, [frameInteraction.isDragging, hoveredHandle]);

  // Handle view state changes to keep frame synchronized
  const handleViewStateChange = useCallback(({ viewId, viewState, oldViewState }: any) => {
    if (viewId === DETAIL_VIEW_ID) {
      // Always update the ref to track current state
      detailViewStateRef.current = viewState
      
      // Only update controlled state if we're not manually panning to avoid feedback loop
      if (!isManuallyPanning) {
        setControlledDetailViewState(viewState);
      }
    }
  }, [isManuallyPanning])

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
    
    return [detailView, frameView, overviewView]
  }, [vivLoaders, containerDimensions])

  // Generate view states following Viv's pattern
  const viewStates = useMemo(() => {
    if (vivLoaders.length === 0 || views.length === 0) return []
    
    // Create view states array matching views order
    const overviewState = getDefaultInitialViewState(vivLoaders, overview, 0.5)
    // Use controlled detail view state if available, otherwise use default
    const detailState = controlledDetailViewState || getDefaultInitialViewState(vivLoaders, containerDimensions, 0)
    
    return [
      { ...detailState, id: DETAIL_VIEW_ID },
      { ...detailState, id: FRAME_VIEW_ID }, // Frame follows detail view state
      { ...overviewState, id: OVERVIEW_VIEW_ID }
    ]
  }, [vivLoaders, views, overview, containerDimensions, controlledDetailViewState])

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
        // Frame view gets the overlay layers
        return { ...baseProps, frameOverlayLayers }
      }
      return baseProps
    })
  }, [vivLoaders, views, selection, colorAndContrast, frameOverlayLayers])

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
          controller: {
            dragPan: true, // Let DeckGL handle drag pan normally
            scrollZoom: true,
            doubleClickZoom: true,
            touchZoom: true,
            dragRotate: false,
            touchRotate: false,
            keyboard: true
          },
          pickingRadius: 15, // Increased picking radius for easier handle selection
          onDragStart: (info: any) => {
            console.log('Drag start event info:', info);
            console.log('Viewport ID:', info.viewport?.id);
            console.log('Layer ID:', info.layer?.id);
            console.log('Object type:', info.object?.type);
            
            // Handle frame interactions first (highest priority)
            if (info.layer && info.object) {
              if ((info.layer.id.includes('handle') && info.object.type?.startsWith('resize-')) ||
                  (info.layer.id.includes('move-area') && info.object.type === 'move')) {
                console.log('Frame interaction drag start, handling interaction');
                const handled = handleFrameInteraction(info);
                if (handled) {
                  console.log('Frame drag start handled, stopping propagation');
                  return true; // Stop propagation - we're handling this
                }
              }
            }
            
            // For any drag that's not a frame interaction, start manual panning
            // This works regardless of which viewport the event comes from
            if (info.coordinate && detailViewStateRef.current) {
              console.log('Starting manual detail view panning');
              setIsManuallyPanning(true);
              setDetailViewDrag({
                isDragging: true,
                startPos: [info.coordinate[0], info.coordinate[1]],
                startTarget: [
                  detailViewStateRef.current.target[0], 
                  detailViewStateRef.current.target[1], 
                  detailViewStateRef.current.target[2]
                ]
              });
              return true; // We'll handle this manually
            }
            
            // Fallback - let default behavior handle it
            return false;
          },
          onDrag: (info: any) => {
            if (frameInteraction.isDragging && info.coordinate) {
              console.log('Dragging frame:', frameInteraction.dragMode, info.coordinate);
              const [currentX, currentY] = info.coordinate;
              const [startX, startY] = frameInteraction.startPos;
              
              const deltaX = currentX - startX;
              const deltaY = currentY - startY;
              
              const result = calculateFrameResize(
                frameInteraction.dragMode,
                frameInteraction.startFrameCenter,
                frameInteraction.startFrameSize,
                deltaX,
                deltaY
              );
              
              setFrameCenter(result.center);
              setFrameSize(result.size);
              return true; // Stop propagation
            }
            
            // Handle manual detail view panning
            if (detailViewDrag.isDragging && info.coordinate) {
              console.log('Manual detail view panning:', info.coordinate);
              const [currentX, currentY] = info.coordinate;
              const [startX, startY] = detailViewDrag.startPos;
              
              const deltaX = currentX - startX;
              const deltaY = currentY - startY;
              
              // Calculate new target position
              const newTarget = [
                detailViewDrag.startTarget[0] - deltaX,
                detailViewDrag.startTarget[1] - deltaY,
                detailViewDrag.startTarget[2]
              ];
              
              // Update controlled state to trigger view update
              const newViewState = {
                ...detailViewStateRef.current,
                target: newTarget
              };
              
              detailViewStateRef.current = newViewState;
              setControlledDetailViewState(newViewState);
              
              return true; // Stop propagation
            }
            
            return false; // Allow default behavior
          },
          onDragEnd: (info: any) => {
            if (frameInteraction.isDragging) {
              console.log('Frame drag end');
              setFrameInteraction({
                isDragging: false,
                dragMode: 'none',
                startPos: [0, 0],
                startFrameCenter: [0, 0],
                startFrameSize: [100, 100]
              });
              return true; // Stop propagation
            }
            
            if (detailViewDrag.isDragging) {
              console.log('Manual detail view panning end');
              setIsManuallyPanning(false);
              setDetailViewDrag({
                isDragging: false,
                startPos: [0, 0],
                startTarget: [0, 0, 0]
              });
              return true; // Stop propagation
            }
            
            return false; // Allow default behavior
          },
          onClick: (info: any) => {
            console.log('Click event info:', info);
            console.log('Viewport ID:', info.viewport?.id);
            console.log('Layer ID:', info.layer?.id);
            console.log('Object type:', info.object?.type);
            
            // Only intercept events that hit our specific pickable frame objects
            if (info.layer && info.viewport?.id === FRAME_VIEW_ID && info.object) {
              if ((info.layer.id.includes('handle') && info.object.type?.startsWith('resize-')) ||
                  (info.layer.id.includes('move-area') && info.object.type === 'move')) {
                console.log('Frame interaction clicked, handling interaction');
                const handled = handleFrameInteraction(info);
                if (handled) {
                  console.log('Frame interaction handled, stopping propagation');
                  return true; // Stop propagation - we're handling this
                }
              }
            }
            
            // Handle overview clicks
            if (info.viewport && info.viewport.id === OVERVIEW_VIEW_ID && info.coordinate) {
              console.log('Overview clicked');
              const [x, y] = info.coordinate
              setFrameCenter([x, y])
              // Let Viv handle the view state naturally
              return true;
            }
            
            // For all other cases, let default behavior handle it
            return false;
          },
          onHover: handleHover,
          getCursor: (info: any) => {
            if (frameInteraction.isDragging) {
              return getCursorForDragMode(frameInteraction.dragMode);
            }
            if (detailViewDrag.isDragging) {
              return 'grabbing';
            }
            if (hoveredHandle && hoveredHandle.startsWith('resize-')) {
              return getCursorForDragMode(hoveredHandle as DragMode);
            }
            // Check if we're hovering over the frame move area
            if (info && info.object && info.object.type === 'move' && info.layer && info.layer.id.includes('move-area')) {
              return 'move';
            }
            // Show grab cursor when over frame view but not over any interactive elements
            if (info && info.viewport?.id === FRAME_VIEW_ID && !info.layer) {
              return 'grab';
            }
            return 'default';
          }
        }}
      />
    </div>
  )
}
