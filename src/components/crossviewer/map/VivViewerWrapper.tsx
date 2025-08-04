import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import * as zarrita from 'zarrita'
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

import type * as viv from "@vivjs/types";
import type { NavigationState } from '../../../types/crossviewer'
import { IMultiscaleInfo } from '../../../types/loader'

export { FRAME_VIEW_ID } from './FrameView'

type VivWrapperProps = {
  msInfo: IMultiscaleInfo
  navigationState: NavigationState
}

export const VivViewerWrapper: React.FC<VivWrapperProps> = ({
  msInfo,
  navigationState,
}) => {
  const { root } = useZarrStore()
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

  useEffect(() => {
    async function loadAllResolutions() {
      if (!root || !msInfo) {
        setVivLoaders([])
        return
      }

      const allLoaders: AltZarrPixelSource[] = []

      for (const resolutionPath of msInfo.resolutions) {
        try {
          const resolutionArray =
            await zarrita.open(root.resolve(resolutionPath)) as zarrita.Array<typeof msInfo.dtype>
          const loader = new AltZarrPixelSource(resolutionArray, {
            labels: ['t', 'c', 'z', 'y', 'x'].filter(
              key => Object.keys(msInfo.shape).includes(key)
            ) as viv.Labels<string[]>,
            /*
             * TileSize represents a chunk size in pixels for each resolution level.
             * If tilesize is incorrect it causes initial mismatches in render sizes.
             */
            tileSize: resolutionArray.chunks.at(-1)!
          })
          allLoaders.push(loader)
        } catch (error) {
          console.error(`Failed to load resolution at ${resolutionPath}:`, error)
        }
      }

      setVivLoaders(allLoaders)
    }

    loadAllResolutions()
  }, [msInfo, root])

  // Initialize frame center based on array dimensions and set initial view to lowest resolution
  useEffect(() => {
    if (msInfo && vivLoaders.length > 0) {
      const shape = msInfo.shape
      const width = shape.x
      const height = shape.y

      if (!width || !height) {
        // Dims missing, return for now and come back later
        console.log('Missing dimensions for msInfo, cannot initialize frame center');
        return
      }

      setFrameCenter([width / 2, height / 2])
      setFrameSize([Math.min(width, height) * 0.2, Math.min(width, height) * 0.2]) // 20% of smaller dimension
      
      if (controlledDetailViewState) {
        return // Already set, no need to reinitialize
      }
      // Initialize detail view state to show the lowest resolution (zoomed out)
      // Use a zoom level that shows the entire image
      const initialState = {
        target: [width / 2, height / 2, 0],
        zoom: -4
      };
      
      console.log('Setting initial view state for lowest resolution:', initialState);
      detailViewStateRef.current = initialState;
      setControlledDetailViewState(initialState);
    }
  }, [msInfo, vivLoaders, containerDimensions])

  const selections = useMemo(() => {
    if (!navigationState.channelMap) {
      console.log("No channel map available, returning empty selections")
      return []
    }
    
    const shape = msInfo.shape;
    const selection: Record<string, number> = {};
    if (shape.z && shape.z >= 0) {
      selection.z = navigationState.zSlice;
    }
    if (shape.t && shape.t >= 0) {
      selection.t = navigationState.timeSlice;
    }
    return [selection];
  
  }, [navigationState])


  // Generate colors based on channel map
  const colors = useMemo(() => {
    // Default color palette for multiple channels - referenced from
    // https://github.com/3DxN/Phenotype3DLegacy/blob/main/src/genHnE.py
    const defaultColors = [
      [42.4, 68.1, 25.7], // Nucl
      [11.8, 255, 137.2], // Cyto
    ]

    if (!navigationState.channelMap) {
      console.log("Using default color")
      return [defaultColors[0]]
    }

    // From channelMap determine the selected channels
    // Just check the number of non-null values
    const channelMap = navigationState.channelMap;

    return defaultColors.slice(0, Object.values(channelMap).filter(
      val => val !== null && val !== undefined).length
    )
  }, [navigationState.channelMap])


  // Handle frame interactions (handles and move area are pickable)
  const handleFrameInteraction = useCallback((info: any) => {
    if (!info || !info.object) {
      console.log('No interaction info or object, returning false');
      return false;
    }
    
    const layerType = info.object.type;
    if (layerType && layerType.startsWith('resize-')) {
      setFrameInteraction({
        isDragging: true,
        dragMode: layerType as DragMode,
        startPos: [info.coordinate[0], info.coordinate[1]],
        startFrameCenter: [...frameCenter],
        startFrameSize: [...frameSize]
      });
      return true;
    }
    if (layerType === 'move') {
      setFrameInteraction({
        isDragging: true,
        dragMode: 'move',
        startPos: [info.coordinate[0], info.coordinate[1]],
        startFrameCenter: [...frameCenter],
        startFrameSize: [...frameSize]
      });
      return true;
    }
    return false;
  }, [frameCenter, frameSize]);

  // Create interactive frame overlay layers
  const frameOverlayLayers = useMemo(() => {
    if (!msInfo) {
      console.log('returning empty frame overlay layers');
      return [];
    }

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
  }, [msInfo, frameCenter, frameSize, hoveredHandle]);

  // Handle DeckGL hover events for visual feedback only
  const handleHover = useCallback((info: any) => {
    // Only update hover state for handles (only handles are pickable now)
    if (!frameInteraction.isDragging && info.object && info.object.type && info.object.type.startsWith('resize-') && info.layer && info.layer.id && info.layer.id.includes('handle')) {
      setHoveredHandle(info.object.type);
    } else if (!frameInteraction.isDragging) {
      // Clear hover when not over any handle - this includes moving from handle to frame area
      if (hoveredHandle !== null) {
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
    zoom: -4,
    backgroundColor: [0, 0, 0]
  }), [containerDimensions])

  // Generate view instances following Viv's pattern
  const views = useMemo(() => {
    if (vivLoaders.length === 0) {
      console.log('views is returning empty array', { vivLoaders })
      return []
    }

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
    if (vivLoaders.length === 0 || views.length === 0) {
      console.log('viewStates is returning empty array', { vivLoaders, views })
      return []
    }

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
    if (vivLoaders.length === 0 || views.length === 0 || !msInfo.shape.c) {
      return []
    }

    const contrastLimits = Array.from({ length: msInfo.shape.c }, (_, index) => {
      const entries = Object.entries(navigationState.channelMap)
      for (let i = 0; i < entries.length; i++) {
        if (entries[i][1] === index) {
          return [0, navigationState.contrastLimits[i]]
        }
      }
      return [0, 65535] // Use a sensible default instead of [0, 0]
    });

    const channelsVisible = Array.from({ length: msInfo.shape.c }, (_, index) => {
      // Check if this channel index is in the channelMap values
      return Object.values(navigationState.channelMap).includes(index);
    });

    const baseProps = {
      loader: vivLoaders,
      selections,
      colors,
      contrastLimits,
      channelsVisible
    }

    console.log('Generating layer props:', baseProps)
    
    // Return layer props for each view in the same order as views array
    return views.map((view) => {
      if (view.id === FRAME_VIEW_ID) {
        // Frame view gets the overlay layers
        return { ...baseProps, frameOverlayLayers }
      }
      return baseProps
    })
  }, [vivLoaders, views, selections, colors, frameOverlayLayers])

  if (!msInfo || vivLoaders.length === 0 || views.length === 0) {
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
            
            // Only intercept events that hit our specific pickable frame objects
            if (info.layer && info.viewport?.id === FRAME_VIEW_ID && info.object) {
              if ((info.layer.id.includes('handle') && info.object.type?.startsWith('resize-')) ||
                  (info.layer.id.includes('move-area') && info.object.type === 'move')) {
                const handled = handleFrameInteraction(info);
                if (handled) {
                  return true; // Stop propagation - we're handling this
                }
              }
            }
            
            // Handle overview clicks
            if (info.viewport && info.viewport.id === OVERVIEW_VIEW_ID && info.coordinate) {
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
