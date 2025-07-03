'use client'

import React, { FC, useState, useEffect } from 'react'
import { VolumeViewer } from '@hms-dbmi/viv'

import { useZarrStore } from '../../contexts/ZarrStoreContext'
import { createVivLoader } from '../../lib/viv-omezarr-bridge'
import type { VivCompatibleData } from '../../types/viv'

interface CustomOmeZarrViewerProps {
  height?: number
  width?: number
}

/**
 * Custom OME-Zarr Viewer using our custom data pipeline with central store
 * This component waits for the central ZarrStore to load data, then creates Viv-compatible loaders
 */
const CustomOmeZarrViewer: FC<CustomOmeZarrViewerProps> = ({
  height = 400,
  width = 400
}) => {
  const { store, root, omeData, source, hasLoadedStore, isLoading: storeLoading } = useZarrStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vivData, setVivData] = useState<VivCompatibleData | null>(null)

  useEffect(() => {
    const loadVivData = async () => {
      // Only proceed if central store is loaded and ready
      if (!hasLoadedStore || !store || !root || !omeData || !source) {
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        console.log('🔍 CustomOmeZarrViewer: Creating Viv loader from central store...')
        console.log('📊 Store data:', { source, hasLoadedStore, omeData })
        
        // Use the central store data to create Viv-compatible loaders
        const vivCompatibleData = await createVivLoader({
          source,
          name: 'Custom OME-Zarr Viewer',
          opacity: 1.0
        })
        
        console.log('🎉 Viv data created successfully:', vivCompatibleData)
        setVivData(vivCompatibleData)
        
      } catch (err) {
        console.error('❌ Failed to create Viv data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadVivData()
  }, [hasLoadedStore, store, root, omeData, source])

  const renderDataInfo = () => {
    if (!vivData) return null

    return (
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '12px',
        marginTop: '10px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Viv Data Information</h4>
        <div><strong>Name:</strong> {vivData.metadata.name}</div>
        <div><strong>Axes:</strong> {vivData.metadata.axis_labels.join(', ')}</div>
        <div><strong>Resolution Levels:</strong> {vivData.loader.length}</div>
        <div><strong>Channels:</strong> {vivData.metadata.channels.length}</div>
        <div><strong>Default Selection:</strong> {JSON.stringify(vivData.metadata.defaults.selection)}</div>
        
        {vivData.metadata.channels.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>Channel Info:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              {vivData.metadata.channels.map((channel: any, i: number) => (
                <li key={i}>
                  {channel.label} - Color: rgb({channel.color.join(',')}) - 
                  Window: [{channel.window.join(', ')}] - 
                  Visible: {channel.visible ? 'Yes' : 'No'}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {vivData.loader.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>Viv Loader Info:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              {vivData.loader.map((loader: any, i: number) => (
                <li key={i} style={{ 
                  color: i === vivData.loader.length - 1 ? '#28a745' : 'inherit',
                  fontWeight: i === vivData.loader.length - 1 ? 'bold' : 'normal'
                }}>
                  Resolution {i}: ZarrPixelSource instance 
                  {i === vivData.loader.length - 1 ? ' ✅ (Currently displayed - lowest resolution)' : ' (Available)'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // Show waiting state if central store hasn't loaded yet
  if (!hasLoadedStore) {
    return (
      <div style={{ 
        width: `${width}px`, 
        height: `${height}px`, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fff3cd',
        border: '2px solid #ffc107',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>⏳ Waiting for Central Store...</div>
        <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
          {storeLoading ? 'Store is loading...' : 'Please load a Zarr store first'}
        </div>
      </div>
    )
  }

  // Show loading state while creating Viv data
  if (loading) {
    return (
      <div style={{ 
        width: `${width}px`, 
        height: `${height}px`, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#e3f2fd',
        border: '2px solid #2196f3',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>🔄 Creating Viv Loaders...</div>
        <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
          Converting store data to Viv-compatible format
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        width: `${width}px`, 
        height: `${height}px`, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#ffebee',
        border: '2px solid #f44336',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <div style={{ color: '#d32f2f', fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
          ❌ Viv Loader Error
        </div>
        <div style={{ color: '#666', fontSize: '14px', textAlign: 'center', marginBottom: '15px' }}>
          {error}
        </div>
        <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
          Using source: {source || 'No source available'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      border: '1px solid #dee2e6', 
      padding: '15px', 
      borderRadius: '8px', 
      backgroundColor: 'white' 
    }}>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 5px 0', color: '#28a745' }}>✅ Custom OME-Zarr Viewer</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
          Using central ZarrStore with Viv VolumeViewer
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#007bff' }}>
          Source: {source}
        </p>
      </div>
      
      {vivData && vivData.loader.length > 0 ? (() => {
        
        return (
          <div style={{ 
            width: `${width}px`, 
            height: `${height}px`, 
            position: 'relative',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <VolumeViewer
              contrastLimits={vivData.metadata.channels.length > 0 ? 
                vivData.metadata.channels.map(ch => ch.window) : 
                [[0, 1023]]} // Fallback contrast limits
              colors={vivData.metadata.channels.length > 0 ? 
                vivData.metadata.channels.map(ch => ch.color) : 
                [[255, 255, 255]]} // Fallback to white
              channelsVisible={vivData.metadata.channels.length > 0 ? 
                vivData.metadata.channels.map(ch => ch.visible) : 
                [true]} // Fallback to visible
              selections={[vivData.metadata.defaults.selection || {c: 0}]} // Use default selection or fallback
              width={width}
              height={height}
              loader={vivData.loader} // Use lowest resolution (last in array) wrapped in array
              resolution={[vivData.loader.length - 1]} // Use lowest resolution (last in array)
            />
          </div>
        )
      })() : (
        <div style={{ 
          width: `${width}px`, 
          height: `${height}px`, 
          backgroundColor: '#f8f9fa',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6c757d'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
            <div style={{ fontWeight: 'bold' }}>No Viv Loaders Available</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              Check console for loading errors
            </div>
          </div>
        </div>
      )}
      
      {renderDataInfo()}
    </div>
  )
}

export default CustomOmeZarrViewer
