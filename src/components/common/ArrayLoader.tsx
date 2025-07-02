'use client'

import { useState } from 'react'
import * as zarrita from 'zarrita'
import { useZarrStore } from '../../contexts/ZarrStoreContext'
import { ArrayLoaderProps } from '../../types/components'

export default function ArrayLoader({ onArrayLoaded, onError, onLoadingChange }: ArrayLoaderProps) {
  const { store, root, availableResolutions, availableChannels } = useZarrStore()
  const [selectedResolution, setSelectedResolution] = useState('0')
  const [selectedChannel, setSelectedChannel] = useState(0)

  const loadArrayFromStore = async () => {
    if (!store || !root) {
      onError('No store loaded. Please load a Zarr store first.')
      return
    }

    onLoadingChange(true)
    
    try {      
      const arr = await zarrita.open(root.resolve(selectedResolution))
      if (!(arr instanceof zarrita.Array)) {
        throw new Error(`Expected an Array, but got ${arr.kind}`)
      }
      
      const arrayInfo = {
        shape: arr.shape,
        dtype: arr.dtype,
        chunks: arr.chunks,
        resolution: selectedResolution,
        channel: selectedChannel
      }
      
      onArrayLoaded(arr, arrayInfo)
      
    } catch (err) {
      const errorMsg = `Error loading array at resolution "${selectedResolution}": ${err instanceof Error ? err.message : 'Unknown error'}`
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Resolution:
            </label>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {availableResolutions.map((resolution) => (
                <button
                  key={resolution}
                  onClick={() => setSelectedResolution(resolution)}
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
          
          <button 
            onClick={loadArrayFromStore} 
            disabled={!selectedResolution}
            style={{ 
              padding: '8px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: !selectedResolution ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              minWidth: '120px'
            }}
          >
            Load Array
          </button>
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
                onClick={() => setSelectedChannel(index)}
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
