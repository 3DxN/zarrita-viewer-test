'use client'

import { useState, useEffect } from 'react'
import * as zarrita from 'zarrita'
import { useZarrStore } from '../../contexts/ZarrStoreContext'
import { ArrayLoaderProps } from '../../types/components'

export default function ArrayLoader({ 
  onArrayLoaded, 
  onError, 
  onLoadingChange, 
  externalResolution, 
  onResolutionUsed 
}: ArrayLoaderProps) {
  const { store, root, availableResolutions } = useZarrStore()
  const [selectedResolution, setSelectedResolution] = useState('0')
  const [selectedChannel, setSelectedChannel] = useState(0)

  // Use external resolution if provided
  const effectiveResolution = externalResolution || selectedResolution

  // Auto-load lowest resolution when store is loaded - prioritize fast loading
  useEffect(() => {
    const loadLowestRes = async () => {
      if (store && availableResolutions.length > 0) {
        // Get the lowest resolution (highest index in the array)
        const lowestResolution = availableResolutions[availableResolutions.length - 1]
        const resolutionToUse = externalResolution || lowestResolution
        
        if (!externalResolution) {
          setSelectedResolution(resolutionToUse)
        }
        
        // Auto-load immediately - CrossViewer priority
        console.log('ArrayLoader: Loading resolution', resolutionToUse, 'immediately for CrossViewer')
        await loadArrayFromStore(resolutionToUse, selectedChannel)
        
        // Notify parent of resolution being used
        onResolutionUsed?.(resolutionToUse)
      }
    }
    
    // Use a very short delay to ensure the store context is fully ready
    if (store) {
      setTimeout(loadLowestRes, 100)
    }
  }, [store, availableResolutions, externalResolution])

  // Load when external resolution changes
  useEffect(() => {
    if (externalResolution && store) {
      loadArrayFromStore(externalResolution, selectedChannel)
      onResolutionUsed?.(externalResolution)
    }
  }, [externalResolution, store])

  // Auto-load when resolution is changed
  const handleResolutionChange = (resolution: string) => {
    setSelectedResolution(resolution)
    loadArrayFromStore(resolution, selectedChannel)
  }

  const loadArrayFromStore = async (resolution?: string, channel?: number) => {
    const resolutionToLoad = resolution || effectiveResolution
    const channelToLoad = channel !== undefined ? channel : selectedChannel
    
    if (!store || !root) {
      onError('No store loaded. Please load a Zarr store first.')
      return
    }

    onLoadingChange(true)
    
    try {      
      const arr = await zarrita.open(root.resolve(resolutionToLoad))
      if (!(arr instanceof zarrita.Array)) {
        throw new Error(`Expected an Array, but got ${arr.kind}`)
      }
      
      const arrayInfo = {
        shape: arr.shape,
        dtype: arr.dtype,
        chunks: arr.chunks,
        resolution: resolutionToLoad,
        channel: channelToLoad
      }
      
      onArrayLoaded(arr, arrayInfo)
      
    } catch (err) {
      const errorMsg = `Error loading array at resolution "${resolutionToLoad}": ${err instanceof Error ? err.message : 'Unknown error'}`
      onError(errorMsg)
    } finally {
      onLoadingChange(false)
    }
  }

  if (!store) {
    return <></>
  }

  // When using external resolution control, don't render any UI
  if (externalResolution) {
    return <></>
  }

  // Only show resolution buttons when not externally controlled (for backward compatibility)
  return (
    <div style={{ marginBottom: '15px', flex: 1 }}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
        Resolution:
      </label>
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        {availableResolutions.map((resolution) => (
          <button
            key={resolution}
            onClick={() => handleResolutionChange(resolution)}
            style={{
              padding: '6px 12px',
              backgroundColor: selectedResolution === resolution ? '#007bff' : '#f8f9fa',
              color: selectedResolution === resolution ? 'white' : 'black',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: selectedResolution === resolution ? 'bold' : 'normal'
            }}
          >
            {resolution}
          </button>
        ))}
      </div>
    </div>
  )
}
