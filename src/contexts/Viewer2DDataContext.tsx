'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import * as zarrita from 'zarrita'

import { useZarrStore } from './ZarrStoreContext'
import type { NavigationState, VivViewState, Viewer2DDataContextType, Viewer2DDataProviderProps } from '../types/viewer2D'


// Viewer2D data context type definition - imported from types
// export interface Viewer2DDataContextType { ... } - now in types/viewer2d-data.ts

const Viewer2DDataContext = createContext<Viewer2DDataContextType | null>(null)

export function useViewer2DData(): Viewer2DDataContextType {
  const context = useContext(Viewer2DDataContext)
  if (!context) {
    throw new Error('useViewer2DData must be used within a Viewer2DDataProvider')
  }
  return context
}

export function Viewer2DDataProvider({ children }: Viewer2DDataProviderProps) {
  const { 
    msInfo, 
    cellposeArray, 
    isCellposeLoading, 
    cellposeError 
  } = useZarrStore()
  
  // Frame state (replacing FrameStateContext)
  const [frameCenter, setFrameCenter] = useState<[number, number]>([500, 500])
  const [frameSize, setFrameSize] = useState<[number, number]>([400, 400])
  const [frameZDepth, setFrameZDepth] = useState<number>(5)
  
  // View state
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null)
  const [vivViewState, setVivViewState] = useState<VivViewState | null>(null)
  
  // Data loading state
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [frameBoundCellposeData, setFrameBoundCellposeData] = useState<zarrita.Chunk<zarrita.DataType> | null>(null)
  
  // Frame bounds calculation
  const getFrameBounds = useCallback(() => {
    const [centerX, centerY] = frameCenter
    const [width, height] = frameSize
    const halfWidth = width / 2
    const halfHeight = height / 2

    return {
      left: centerX - halfWidth,
      right: centerX + halfWidth,
      top: centerY - halfHeight,
      bottom: centerY + halfHeight,
    }
  }, [frameCenter, frameSize])
  
  // Current view bounds calculation from viv view state
  const currentViewBounds = useMemo(() => {
    if (!vivViewState || !msInfo) return null
    
    // This is a simplified calculation - you might need to adjust based on your viewer setup
    const [targetX, targetY] = vivViewState.target
    const zoom = vivViewState.zoom
    
    // Calculate view bounds based on zoom and target
    // Note: This is approximate - you may need container dimensions for exact calculation
    const zoomScale = Math.pow(2, zoom)
    const viewWidth = 1000 / zoomScale  // Approximate - should use container width
    const viewHeight = 600 / zoomScale  // Approximate - should use container height
    
    return {
      x1: targetX - viewWidth / 2,
      y1: targetY - viewHeight / 2,
      x2: targetX + viewWidth / 2,
      y2: targetY + viewHeight / 2
    }
  }, [vivViewState, msInfo])
  
  // View bounds setter
  const setViewBounds = useCallback((bounds: { x1: number, y1: number, x2: number, y2: number }) => {
    const centerX = (bounds.x1 + bounds.x2) / 2
    const centerY = (bounds.y1 + bounds.y2) / 2
    const width = bounds.x2 - bounds.x1
    const height = bounds.y2 - bounds.y1
    
    // Calculate appropriate zoom level
    const zoom = Math.log2(Math.min(1000 / width, 600 / height)) // Approximate
    
    setVivViewState({
      target: [centerX, centerY, 0],
      zoom: zoom
    })
  }, [])
  
  // Z/T slice setters
  const setZSlice = useCallback((z: number) => {
    if (navigationState) {
      setNavigationState({
        ...navigationState,
        zSlice: z
      })
    }
  }, [navigationState])
  
  const setTimeSlice = useCallback((t: number) => {
    if (navigationState) {
      setNavigationState({
        ...navigationState,
        timeSlice: t
      })
    }
  }, [navigationState])
  
  // Get current Z/T slices
  const currentZSlice = navigationState?.zSlice ?? 0
  const currentTimeSlice = navigationState?.timeSlice ?? 0
  
  // Helper function for frame-bound array slicing (DRY principle)
  const getFrameBoundData = useCallback(async (
    array: zarrita.Array<zarrita.DataType>,
  ): Promise<zarrita.Chunk<zarrita.DataType> | null> => {
    if (!navigationState) {
      console.log('❌ Missing navigation state for frame-bound data')
      return null
    }
    
    try {
      // Calculate frame bounds
      const bounds = getFrameBounds()
      
      // Add spatial bounds (ensure they're within array bounds)
      const maxX = array.shape[array.shape.length - 1]
      const maxY = array.shape[array.shape.length - 2]
      
      const x1 = Math.max(0, Math.floor(bounds.left))
      const x2 = Math.min(maxX, Math.ceil(bounds.right))
      const y1 = Math.max(0, Math.floor(bounds.top))
      const y2 = Math.min(maxY, Math.ceil(bounds.bottom))
      
      // Create array-based selection based on array dimensions
      const selection: (number | zarrita.Slice | null)[] = []
      
      // Build selection array based on actual array shape
      const hasZ = array.shape.length > 2 && msInfo?.shape.z && msInfo.shape.z >= 1
      if (hasZ) {
        selection.push(zarrita.slice(currentZSlice - frameZDepth, currentZSlice + frameZDepth + 1))
      }
      selection.push(zarrita.slice(y1, y2))
      selection.push(zarrita.slice(x1, x2))
      
      const result = await zarrita.get(array, selection)

      console.log(`✅ Frame-bound main data extracted:`, {
        originalShape: array.shape,
        bounds: { x1, y1, x2, y2 },
        selection,
        resultShape: result.shape
      })
      
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Error getting frame-bound main data:`, errorMsg)
      throw error
    }
  }, [navigationState, getFrameBounds, currentZSlice, currentTimeSlice, msInfo])
  
  // Auto-update frame-bound Cellpose data when dependencies change
  useEffect(() => {
    const loadFrameBoundCellposeData = async () => {
      if (!cellposeArray || !navigationState) {
        setFrameBoundCellposeData(null)
        return
      }
      
      setIsDataLoading(true)
      setDataError(null)
      
      try {
        // Use shared helper function
        const result = await getFrameBoundData(cellposeArray)
        setFrameBoundCellposeData(result)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('❌ Error getting frame-bound Cellpose data:', errorMsg)
        setDataError(errorMsg)
        setFrameBoundCellposeData(null)
      } finally {
        setIsDataLoading(false)
      }
    }
    
    loadFrameBoundCellposeData()
  }, [cellposeArray, navigationState, frameCenter, frameSize, currentZSlice, currentTimeSlice])
  
  const contextValue: Viewer2DDataContextType = {
    // Frame state
    frameCenter,
    frameSize,
    frameZDepth,
    setFrameCenter,
    setFrameSize,
    setFrameZDepth,
    getFrameBounds,
    
    // View state
    currentViewBounds,
    currentZSlice,
    currentTimeSlice,
    setViewBounds,
    setZSlice,
    setTimeSlice,

    // Navigation state
    navigationState,
    setNavigationState,
    
    // Viv viewer state
    vivViewState,
    setVivViewState,
    
    // Data access
    frameBoundCellposeData,
    isDataLoading: isDataLoading || isCellposeLoading,
    dataError: dataError || cellposeError
  }
  
  return (
    <Viewer2DDataContext.Provider value={contextValue}>
      {children}
    </Viewer2DDataContext.Provider>
  )
}
