'use client'

import { useState } from 'react'
import * as zarrita from 'zarrita'
import { useZarrStore } from '../../contexts/ZarrStoreContext'
import { ZarrLoaderProps } from '../../types/crossviewer'

export default function ZarrLoader({ onArrayLoaded, onError, onLoadingChange }: ZarrLoaderProps) {
  const { source, setSource, store, root, availableResolutions, availableChannels, loadStore, isLoading, error } = useZarrStore()
  const [selectedResolution, setSelectedResolution] = useState('0')
  const [selectedChannel, setSelectedChannel] = useState(0)

  const handleLoadStore = async () => {
    if (!source) return
    await loadStore(source)
  }

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

  return (
    <div style={{ marginBottom: '15px' }}>
      {/* URL Input and Store Loading */}
      <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Zarr Store</h4>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Zarr URL:</label>
          <input 
            type="text" 
            value={source} 
            onChange={(e) => setSource(e.target.value)}
            style={{ width: '100%', padding: '5px', marginBottom: '5px' }}
            placeholder="Enter Zarr URL"
          />
        </div>
        <button 
          onClick={handleLoadStore} 
          disabled={isLoading || !source}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isLoading || !source ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? 'Loading Store...' : 'Load Store'}
        </button>
      </div>

      {/* Resolution and Channel Selection */}
      {store && (
        <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Array Selection</h4>
          
          {/* Resolution Buttons */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Resolution:</label>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {availableResolutions.map((resolution) => (
                <button
                  key={resolution}
                  onClick={() => setSelectedResolution(resolution)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: selectedResolution === resolution ? '#007bff' : '#f8f9fa',
                    color: selectedResolution === resolution ? 'white' : 'black',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {resolution}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Buttons */}
          {availableChannels.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Channel:</label>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {availableChannels.map((channel, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedChannel(index)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: selectedChannel === index ? '#17a2b8' : '#f8f9fa',
                      color: selectedChannel === index ? 'white' : 'black',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <button 
            onClick={loadArrayFromStore} 
            disabled={!selectedResolution}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: !selectedResolution ? 'not-allowed' : 'pointer',
            }}
          >
            Load Array
          </button>
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: '#721c24', 
          backgroundColor: '#f8d7da', 
          padding: '10px', 
          borderRadius: '4px',
          margin: '10px 0' 
        }}>
          {error}
        </div>
      )}
    </div>
  )
}