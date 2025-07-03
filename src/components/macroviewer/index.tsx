'use client'

import React, { FC, useState, useEffect } from 'react'
import { VolumeViewer } from '@hms-dbmi/viv'

import { useZarrStore } from '../../contexts/ZarrStoreContext'
import { createVivLoader } from '../../lib/viv-omezarr-bridge'
import type { VivCompatibleData } from '../../types/viv'
import type { MacroViewerProps } from '../../types/macroviewer'

/**
 * MacroViewer component using custom OME-Zarr pipeline with AltZarrPixelSource
 * Provides fast, robust visualization of OME-Zarr data using Viv's VolumeViewer
 */
const MacroViewer: FC<MacroViewerProps> = ({
  height = 400,
  width = 400
}) => {
  const { store, root, omeData, source, hasLoadedStore, isLoading: storeLoading } = useZarrStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vivData, setVivData] = useState<VivCompatibleData | null>(null)

  useEffect(() => {
    const loadVivData = async () => {
      if (!hasLoadedStore || !store || !root || !omeData || !source) {
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        const vivCompatibleData = await createVivLoader({
          source,
          name: 'MacroViewer',
          opacity: 1.0
        })
        
        setVivData(vivCompatibleData)
        
      } catch (error) {
        console.error('MacroViewer: Failed to load data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadVivData()
  }, [hasLoadedStore, store, root, omeData, source])

  // Calculate better contrast limits based on data type
  const getContrastLimits = () => {
    if (!vivData?.metadata.channels[0]) return [0, 65535]
    
    const channel = vivData.metadata.channels[0]
    if (channel.window) {
      return channel.window
    }
    
    // Auto-adjust based on dtype of the loader
    const loaderToUse = vivData.loader[vivData.loader.length - 1]
    switch (loaderToUse.dtype) {
      case 'Uint8':
        return [0, 255]
      case 'Uint16':
        return [0, 4095] // Much lower than max 65535 for better visibility
      case 'Float32':
        return [0.0, 1.0]
      default:
        return [0, 1000]
    }
  }

  const getChannelColor = () => {
    const channel = vivData?.metadata.channels[0]
    if (channel?.color) {
      return channel.color
    }
    return [0, 255, 0] // Bright green for good visibility
  }

  // Handle loading states
  if (storeLoading || loading) {
    return (
      <div style={{ height, width, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: 'white' }}>
        <div>
          <div>⏳ Loading OME-Zarr data...</div>
          {storeLoading && <div style={{ fontSize: '0.8em', marginTop: '8px' }}>Loading store...</div>}
          {loading && <div style={{ fontSize: '0.8em', marginTop: '8px' }}>Creating Viv loaders...</div>}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ height, width, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a1a1a', color: '#ff6b6b' }}>
        <div>
          <div>❌ Error loading data</div>
          <div style={{ fontSize: '0.8em', marginTop: '8px' }}>{error}</div>
        </div>
      </div>
    )
  }

  if (!hasLoadedStore) {
    return (
      <div style={{ height, width, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: 'white' }}>
        <div>
          <div>📂 Waiting for store to load...</div>
          <div style={{ fontSize: '0.8em', marginTop: '8px' }}>Please load a valid OME-Zarr store first</div>
        </div>
      </div>
    )
  }

  if (!vivData) {
    return (
      <div style={{ height, width, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', color: 'white' }}>
        <div>
          <div>⚠️ No Viv data available</div>
          <div style={{ fontSize: '0.8em', marginTop: '8px' }}>Unable to create Viv loaders from store data</div>
        </div>
      </div>
    )
  }

  // Use the lowest resolution loader for VolumeViewer (better performance)
  const loaderToUse = vivData.loader[vivData.loader.length - 1]
  const contrastLimits = getContrastLimits()
  const channelColor = getChannelColor()

  return (
    <div style={{ height, width, position: 'relative', backgroundColor: '#000' }}>
      <div style={{ marginTop: '40px', height: height - 40, width }}>
        <VolumeViewer
          loader={[loaderToUse]}
          contrastLimits={[contrastLimits]}
          colors={[channelColor]}
          channelsVisible={[true]}
          selections={[{ c: 0, t: 0, z: 0 }]}
          height={height - 40}
          width={width}
        />
      </div>
    </div>
  )
}

export default MacroViewer