'use client'

import { useState, useEffect } from 'react'
import * as zarrita from 'zarrita'
import { useZarrStore } from '../../contexts/ZarrStoreContext'
import { ArrayLoaderProps } from '../../types/components'

export default function ArrayLoader({ onArrayLoaded, onError, onLoadingChange }: ArrayLoaderProps) {
  const { store, root, availableResolutions, availableChannels } = useZarrStore()
  const [selectedResolution, setSelectedResolution] = useState('0')
  const [selectedChannel, setSelectedChannel] = useState(0)

  // Auto-load lowest resolution when store is loaded - prioritize fast loading
  useEffect(() => {
    const loadLowestRes = async () => {
      if (store && availableResolutions.length > 0) {
        // Get the lowest resolution (highest index in the array)
        const lowestResolution = availableResolutions[availableResolutions.length - 1]
        setSelectedResolution(lowestResolution)
        // Auto-load immediately - CrossViewer priority
        console.log('ArrayLoader: Loading lowest resolution immediately for CrossViewer')
        await loadArrayFromStore(lowestResolution, selectedChannel)
      }
    }
    
    // Use a very short delay to ensure the store context is fully ready
    if (store) {
      setTimeout(loadLowestRes, 100)
    }
  }, [store, availableResolutions])

  // Auto-load when resolution is changed
  const handleResolutionChange = (resolution: string) => {
    setSelectedResolution(resolution)
    loadArrayFromStore(resolution, selectedChannel)
  }

  // Auto-load when channel is changed
  const handleChannelChange = (channelIndex: number) => {
    setSelectedChannel(channelIndex)
    loadArrayFromStore(selectedResolution, channelIndex)
  }

  const loadArrayFromStore = async (resolution?: string, channel?: number) => {
    const resolutionToLoad = resolution || selectedResolution
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

  return (
    <div style={{ marginBottom: '15px' }}>
      {/* Resolution Selection */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
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
      </div>

      {/* Channel Selection */}
      {availableChannels.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Channel:
          </label>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {availableChannels.map((channel, index) => (
              <button
                key={index}
                onClick={() => handleChannelChange(index)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: selectedChannel === index ? '#17a2b8' : '#f8f9fa',
                  color: selectedChannel === index ? 'white' : 'black',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: selectedChannel === index ? 'bold' : 'normal'
                }}
              >
                {channel}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
