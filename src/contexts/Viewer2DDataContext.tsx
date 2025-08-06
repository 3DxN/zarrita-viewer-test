'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import * as zarrita from 'zarrita'

import { useZarrStore } from './ZarrStoreContext'
import type { NavigationState, VivViewState, Viewer2DDataContextType, Viewer2DDataProviderProps } from '../types/crossviewer'


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
    root, 
    msInfo, 
    cellposeArray, 
    isCellposeLoading, 
    cellposeError 
  } = useZarrStore()
  
  // Frame state (replacing FrameStateContext)
  const [frameCenter, setFrameCenter] = useState<[number, number]>([500, 500])
  const [frameSize, setFrameSize] = useState<[number, number]>([400, 400])
  
  // View state
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null)
  const [vivViewState, setVivViewState] = useState<VivViewState | null>(null)
  
  // Data loading state
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  
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
  
  // Get frame-bound main array data
  const getFrameBoundArray = useCallback(async (): Promise<any | null> => {
    if (!root || !msInfo || !navigationState) {
      console.log('❌ Missing requirements for frame-bound array')
      return null
    }
    
    setIsDataLoading(true)
    setDataError(null)
    
    try {
      // Get highest resolution array (first in resolutions list)
      const highestResPath = msInfo.resolutions[0]
      const fullArray = await zarrita.open(root.resolve(highestResPath)) as zarrita.Array<zarrita.DataType>
      
      // Calculate frame bounds
      const bounds = getFrameBounds()
      
      // Create slice selection for frame bounds + current Z/T
      const selection: any = {}
      
      // Add Z/T dimensions if they exist
      if (msInfo.shape.t && msInfo.shape.t > 1) {
        selection.t = currentTimeSlice
      }
      if (msInfo.shape.z && msInfo.shape.z > 1) {
        selection.z = currentZSlice
      }
      
      // Add spatial bounds (ensure they're within array bounds)
      const maxX = msInfo.shape.x || fullArray.shape[fullArray.shape.length - 1]
      const maxY = msInfo.shape.y || fullArray.shape[fullArray.shape.length - 2]
      
      const x1 = Math.max(0, Math.floor(bounds.left))
      const x2 = Math.min(maxX, Math.ceil(bounds.right))
      const y1 = Math.max(0, Math.floor(bounds.top))
      const y2 = Math.min(maxY, Math.ceil(bounds.bottom))
      
      selection.x = zarrita.slice(x1, x2)
      selection.y = zarrita.slice(y1, y2)
      
      // Apply selection to get frame-bound data
      const result = await zarrita.get(fullArray, selection)
      
      console.log('✅ Frame-bound array extracted:', {
        originalShape: fullArray.shape,
        bounds: { x1, y1, x2, y2 },
        selection,
        resultShape: result.shape
      })
      
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Error getting frame-bound array:', errorMsg)
      setDataError(errorMsg)
      return null
    } finally {
      setIsDataLoading(false)
    }
  }, [root, msInfo, navigationState, getFrameBounds, currentZSlice, currentTimeSlice])
  
  // Get frame-bound Cellpose data
  const getFrameBoundCellposeData = useCallback(async (): Promise<any | null> => {
    if (!cellposeArray || !navigationState) {
      console.log('❌ No Cellpose array available or missing navigation state')
      return null
    }
    
    setIsDataLoading(true)
    setDataError(null)
    
    try {
      // Calculate frame bounds
      const bounds = getFrameBounds()
      
      // Create slice selection for frame bounds + current Z/T
      const selection: any = {}
      
      // Add Z/T dimensions if they exist in Cellpose data
      if (cellposeArray.shape.length > 2) {
        // Assume Cellpose data has same dimensional structure as main data
        if (msInfo?.shape.t && msInfo.shape.t > 1) {
          selection.t = currentTimeSlice
        }
        if (msInfo?.shape.z && msInfo.shape.z > 1) {
          selection.z = currentZSlice
        }
      }
      
      // Add spatial bounds (ensure they're within Cellpose array bounds)
      const maxX = cellposeArray.shape[cellposeArray.shape.length - 1]
      const maxY = cellposeArray.shape[cellposeArray.shape.length - 2]
      
      const x1 = Math.max(0, Math.floor(bounds.left))
      const x2 = Math.min(maxX, Math.ceil(bounds.right))
      const y1 = Math.max(0, Math.floor(bounds.top))
      const y2 = Math.min(maxY, Math.ceil(bounds.bottom))
      
      selection.x = zarrita.slice(x1, x2)
      selection.y = zarrita.slice(y1, y2)
      
      // Apply selection to get frame-bound Cellpose data
      const result = await zarrita.get(cellposeArray, selection)
      
      console.log('✅ Frame-bound Cellpose data extracted:', {
        originalShape: cellposeArray.shape,
        bounds: { x1, y1, x2, y2 },
        selection,
        resultShape: result.shape
      })
      
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Error getting frame-bound Cellpose data:', errorMsg)
      setDataError(errorMsg)
      return null
    } finally {
      setIsDataLoading(false)
    }
  }, [cellposeArray, navigationState, getFrameBounds, currentZSlice, currentTimeSlice, msInfo])
  
  const contextValue: Viewer2DDataContextType = {
    // Frame state
    frameCenter,
    frameSize,
    setFrameCenter,
    setFrameSize,
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
    getFrameBoundArray,
    getFrameBoundCellposeData,
    isDataLoading: isDataLoading || isCellposeLoading,
    dataError: dataError || cellposeError
  }
  
  return (
    <Viewer2DDataContext.Provider value={contextValue}>
      {children}
    </Viewer2DDataContext.Provider>
  )
}
