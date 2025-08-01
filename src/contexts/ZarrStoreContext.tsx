'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import * as zarrita from 'zarrita'

import { 
  ZarrStoreSuggestionType, type ZarrStoreSuggestedPath,
  type ZarrStoreContextType, type ZarrStoreState, type ZarrStoreProviderProps 
} from '../types/store'
import * as omeUtils from '../utils/ome-utils'
import type OMEAttrs from '../types/ome'
import type { AxisKey, IMultiscaleInfo, MultiscaleShape } from '../types/loader'


const ZarrStoreContext = createContext<ZarrStoreContextType | null>(null)

export function useZarrStore() {
  const context = useContext(ZarrStoreContext)
  if (!context) {
    throw new Error('useZarrStore must be used within a ZarrStoreProvider')
  }
  return context
}


export function ZarrStoreProvider({ children, initialSource = '' }: ZarrStoreProviderProps) {
  const [state, setState] = useState<ZarrStoreState>({
    store: null,
    root: null,
    omeData: null,
    msInfo: null,
    isLoading: false,
    error: null,
    infoMessage: null,
    source: initialSource,
    hasLoadedStore: false,
    suggestedPaths: [],
    suggestionType: ZarrStoreSuggestionType.GENERIC
  })

  const setSource = useCallback((url: string) => {
    setState(prev => ({ ...prev, source: url }))
  }, [])

  const loadStore = useCallback(async (url: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, infoMessage: null }))
    
    try {
      console.log('Loading Zarr store from:', url)
      
      const store = new zarrita.FetchStore(url)
      const grp = await zarrita.open(store)
      
      // Check if this is actually a group (not an array)
      if (grp instanceof zarrita.Array) {
        throw new Error("This appears to be an array, not a group. OME-Zarr requires group structure.")
      }

      console.log('📊 Group loaded:', grp)
      console.log('📋 Attributes:', grp.attrs)

      // Use utility functions to determine the data type
      const attrs = (grp.attrs?.ome ?? grp.attrs) as OMEAttrs
      
      // Check if this is a plate using utility function
      if (omeUtils.isOmePlate(attrs)) {
        console.log('🧪 Detected OME-Zarr plate structure')
        setState(prev => ({
          ...prev,
          store,
          root: grp,
          omeData: attrs,
          isLoading: false,
          error: null,
          infoMessage: 'Please select a well from the plate below to continue.',
          source: url,
          hasLoadedStore: false, // Keep false so modal stays open for well selection
          suggestedPaths: [],
          suggestionType: ZarrStoreSuggestionType.PLATE
        }))
        return
      }

      // Check if this is a well using utility function
      if (omeUtils.isOmeWell(attrs)) {
        console.log('🔬 Detected OME-Zarr well structure')
        setState(prev => ({
          ...prev,
          store,
          root: grp,
          omeData: attrs,
          isLoading: false,
          error: null,
          infoMessage: 'Please select an image from the well below to continue.',
          source: url,
          hasLoadedStore: false, // Keep false so modal stays open for image selection
          suggestedPaths: [],
          suggestionType: ZarrStoreSuggestionType.WELL
        }))
        return
      }
      
      // Check if this has multiscales using utility function
      if (omeUtils.isOmeMultiscales(attrs)) {
        console.log('📈 Detected OME-Zarr multiscales structure')
        
        // Extract available resolutions from multiscales
        const multiscales = attrs.multiscales![0]
        const availableResolutions = multiscales.datasets.map(dataset => dataset.path)
        const axes = multiscales.axes?.map(axis => axis.name) || []
        
        // Extract available channels (if present in OMERO metadata)
        let availableChannels: string[] = []
        if (attrs.omero?.channels) {
          availableChannels = attrs.omero.channels.map((ch, idx) => 
            ch.label || `Channel ${idx}`
          )
        } else {
          alert('No channels found in OME metadata. Is your metadata valid?');
        }

        // Load the lowest resolution array to get the shape and dtype
        const lowestResArray = await zarrita.open(
          grp.resolve(multiscales.datasets[0].path)
        ) as zarrita.Array<zarrita.DataType>

        const shape = axes.reduce((acc, axis) => {
          acc[axis as AxisKey] = lowestResArray.shape[axes.indexOf(axis)]
          return acc
        }, {} as MultiscaleShape)

        // Extract multiscale Information
        const msInfo = {
          shape,
          dtype: lowestResArray.dtype,
          resolutions: availableResolutions,
          channels: availableChannels
        } as IMultiscaleInfo;

        setState(prev => ({
          ...prev,
          store,
          root: grp,
          omeData: attrs,
          msInfo: msInfo,
          isLoading: false,
          error: null,
          infoMessage: null,
          source: url,
          hasLoadedStore: true,
          suggestedPaths: [],
          suggestionType: ZarrStoreSuggestionType.GENERIC
        }))

        console.log('[ZarrStoreContext] ✅ Store loaded successfully:')
        return
      }

      // If none of the above match, this is not a supported OME-Zarr structure
      throw new Error("No supported OME-Zarr structure found in metadata")
      
    } catch (error) {
      console.error('Error loading Zarr store:', error)
      let errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Implement OME-Zarr specific error handling
      let suggestedPaths: Array<ZarrStoreSuggestedPath> = []
      let suggestionType: ZarrStoreSuggestionType = ZarrStoreSuggestionType.GENERIC
      let errorOmeData: OMEAttrs | null = null
      
      try {
        console.log('Exploring Zarr structure for OME-specific suggestions...')
        const store: zarrita.FetchStore = new zarrita.FetchStore(url)
        
        // Try to open to check OME metadata
        const opened = await zarrita.open(store)
        
        // Check if this is a group with attrs
        if ('attrs' in opened && opened.attrs && opened.attrs.ome) {
          const grp = opened as zarrita.Group<zarrita.FetchStore>
          const omeMetadata = grp.attrs.ome as OMEAttrs
          
          // Case 1: Plate structure detected (even if there was an error)
          if (omeMetadata.plate) {
            console.log('Plate structure detected in OME metadata')
            suggestionType = ZarrStoreSuggestionType.PLATE
            errorOmeData = omeMetadata
            
            // For plate structure, we don't suggest paths here - the UI will handle plate display
            // The plate metadata will be available in the error state
          }
          // Case 1.5: Well structure detected (even if there was an error)
          else if (omeMetadata.well) {
            console.log('Well structure detected in OME metadata')
            suggestionType = ZarrStoreSuggestionType.WELL
            errorOmeData = omeMetadata
            
            // For well structure, we don't suggest paths here - the UI will handle image display
            // The well metadata will be available in the error state
          }
          // Case 2: OME metadata exists but no multiscale - this is invalid, suggest subdirectories
          else if (!omeMetadata.multiscales || omeMetadata.multiscales.length === 0) {
            console.log('OME metadata found but no multiscales - invalid OME-Zarr structure, suggesting subdirectories - hi test')
            suggestionType = ZarrStoreSuggestionType.NO_MULTISCALE
            
            // Try to find common paths that might contain valid OME-Zarr data
            const commonPaths = ['0', '1', '2', '3', '4', '5', 'labels', 'metadata']
            for (const path of commonPaths) {
              console.log(`Testing path: ${path}`)
              const root = zarrita.root(store)
              
              // Check if this has OME metadata
              try {
                const childOpened = await zarrita.open(root.resolve(path))
                
                // Check if it's a group with OME metadata
                if ('attrs' in childOpened && childOpened.attrs) {
                  const hasOme = childOpened.attrs.ome || childOpened.attrs.multiscales
                  
                  suggestedPaths.push({
                    path,
                    isGroup: true,
                    hasOme: !!hasOme
                  })
                } else {
                  // It's an array
                  suggestedPaths.push({
                    path,
                    isGroup: false,
                    hasOme: false
                  })
                }
              } catch {
                // Do nothing - path doesn't exist
              }
            }
          }
        } else {
          // Case 3: No OME metadata - fall back to generic exploration
          console.log('No OME metadata found.')
          suggestionType = ZarrStoreSuggestionType.GENERIC
          // Don't suggest any paths for completely missing OME metadata
        }
        
        // Sort suggestions: OME groups first, then other groups, then arrays
        suggestedPaths.sort((a, b) => {
          if (a.hasOme && !b.hasOme) return -1
          if (!a.hasOme && b.hasOme) return 1
          if (a.isGroup && !b.isGroup) return -1
          if (!a.isGroup && b.isGroup) return 1
          return a.path.localeCompare(b.path)
        })
        
      } catch (explorationError) {
        console.log('Could not explore structure:', explorationError)
        
        // If exploration fails completely, this is likely an invalid or inaccessible URL
        suggestionType = ZarrStoreSuggestionType.GENERIC
        errorMessage = "Could not explore OME-Zarr structure. Please check the URL or ensure it is a valid store."
      }
      
      setState(prev => ({
        ...prev,
        store: null,
        root: null,
        omeData: errorOmeData,
        isLoading: false,
        error: errorMessage,
        infoMessage: null,
        suggestedPaths,
        suggestionType
      }))
    }
  }, [])

  const navigateToSuggestion = useCallback(async (suggestionPath: string) => {
    const currentUrl = state.source
    const baseUrl = currentUrl.endsWith('/') ? currentUrl.slice(0, -1) : currentUrl
    const newUrl = `${baseUrl}/${suggestionPath}`
    
    console.log(`Navigating from ${currentUrl} to ${newUrl}`)
    setSource(newUrl)
    await loadStore(newUrl)
  }, [state.source, loadStore])

  const value: ZarrStoreContextType = {
    ...state,
    loadStore,
    setSource,
    navigateToSuggestion
  }

  return (
    <ZarrStoreContext.Provider value={value}>
      {children}
    </ZarrStoreContext.Provider>
  )
}
