'use client'

import { useState } from 'react'
import type { ZarrLoaderProps } from '../../types/crossviewer'

export default function ZarrLoader({ onArrayLoaded, onError, onLoadingChange }: ZarrLoaderProps) {
  const [zarrUrl, setZarrUrl] = useState('http://localhost:5500/test_prostate_s1+crop_v3_fix.ome.zarr')
  const [directory, setDirectory] = useState('0/0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadZarrData = async () => {
    setLoading(true)
    setError(null)
    onLoadingChange(true)
    
    try {
      const zarrita = await import('zarrita')
      
      // Load the store and try to open the array directly
      const store = new zarrita.FetchStore(zarrUrl)
      const root = zarrita.root(store)
      const arr = await zarrita.open(root.resolve(directory), { kind: 'array' })
      
      const arrayInfo = {
        shape: arr.shape,
        dtype: arr.dtype,
        chunks: arr.chunks
      }
      
      onArrayLoaded(arr, arrayInfo)
      
    } catch (err) {
      // If it's not an array, try as group and show simple error
      try {
        const zarrita = await import('zarrita')
        const store = new zarrita.FetchStore(zarrUrl)
        const root = zarrita.root(store)
        await zarrita.open(root.resolve(directory), { kind: 'group' })
        const errorMsg = `Path "${directory}" is a group. Navigate deeper into the directory structure.`
        setError(errorMsg)
        onError(errorMsg)
      } catch (e) {
        const errorMsg = `Error loading path "${directory}": ${err instanceof Error ? err.message : 'Unknown error'}`
        setError(errorMsg)
        onError(errorMsg)
      }
    } finally {
      setLoading(false)
      onLoadingChange(false)
    }
  }

  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Zarr URL:</label>
        <input 
          type="text" 
          value={zarrUrl} 
          onChange={(e) => setZarrUrl(e.target.value)}
          style={{ width: '100%', padding: '5px', marginBottom: '5px' }}
          placeholder="Enter Zarr URL"
        />
      </div>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Path (Resolution):</label>
          <input 
            type="text" 
            value={directory} 
            onChange={(e) => setDirectory(e.target.value)}
            style={{ width: '100%', padding: '5px' }}
            placeholder="0/0"
          />
        </div>
        
        <button 
          onClick={loadZarrData} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            height: 'fit-content'
          }}
        >
          {loading ? 'Loading...' : 'Load Zarr'}
        </button>
      </div>
      
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