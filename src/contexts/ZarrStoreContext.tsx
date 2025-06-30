'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import * as zarrita from 'zarrita'
import OMEAttrs from '../types/ome'

export interface ZarrStoreState {
  store: zarrita.FetchStore | null
  root: zarrita.Group<zarrita.FetchStore> | null
  omeMetadata: OMEAttrs | null
  availableResolutions: string[]
  availableChannels: string[]
  isLoading: boolean
  error: string | null
  source: string
}

export interface ZarrStoreContextType extends ZarrStoreState {
  loadStore: (url: string) => Promise<void>
  setSource: (url: string) => void
}

const ZarrStoreContext = createContext<ZarrStoreContextType | null>(null)

export function useZarrStore() {
  const context = useContext(ZarrStoreContext)
  if (!context) {
    throw new Error('useZarrStore must be used within a ZarrStoreProvider')
  }
  return context
}

interface ZarrStoreProviderProps {
  children: ReactNode
  initialSource?: string
}

export function ZarrStoreProvider({ children, initialSource = '' }: ZarrStoreProviderProps) {
  const [state, setState] = useState<ZarrStoreState>({
    store: null,
    root: null,
    omeMetadata: null,
    availableResolutions: [],
    availableChannels: [],
    isLoading: false,
    error: null,
    source: initialSource
  })

  const setSource = useCallback((url: string) => {
    setState(prev => ({ ...prev, source: url }))
  }, [])

  const loadStore = useCallback(async (url: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      console.log('Loading Zarr store from:', url)
      
      const store = new zarrita.FetchStore(url)
      const root = zarrita.root(store)
      const grp = await zarrita.open(store, { kind: 'group' })
      
      if (!grp.attrs || !grp.attrs.ome) {
        throw new Error("OME metadata not found in the group.")
      }
      
      const omeMetadata = grp.attrs.ome as OMEAttrs
      const multiscales = omeMetadata.multiscales?.[0]
      
      if (!multiscales) {
        throw new Error("Valid multiscale metadata not found.")
      }
      
      // Extract available resolutions
      const availableResolutions = multiscales.datasets.map(dataset => dataset.path)
      
      // Extract available channels (if present)
      let availableChannels: string[] = []
      if (omeMetadata.images?.[0]?.pixels?.channels) {
        availableChannels = omeMetadata.images[0].pixels.channels.map((ch: any, idx: number) => 
          ch.label || `Channel ${idx}`
        )
      }
      
      console.log('Store loaded successfully:', {
        resolutions: availableResolutions,
        channels: availableChannels,
        axes: multiscales.axes?.map(axis => axis.name)
      })
      
      setState(prev => ({
        ...prev,
        store,
        root: grp,
        omeMetadata,
        availableResolutions,
        availableChannels,
        isLoading: false,
        error: null,
        source: url
      }))
      
    } catch (error) {
      console.error('Error loading Zarr store:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setState(prev => ({
        ...prev,
        store: null,
        root: null,
        omeMetadata: null,
        availableResolutions: [],
        availableChannels: [],
        isLoading: false,
        error: errorMessage
      }))
    }
  }, [])

  const value: ZarrStoreContextType = {
    ...state,
    loadStore,
    setSource
  }

  return (
    <ZarrStoreContext.Provider value={value}>
      {children}
    </ZarrStoreContext.Provider>
  )
}
