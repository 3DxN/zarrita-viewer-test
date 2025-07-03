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
 * Now using AltZarrPixelSource for robust dtype handling
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
        
        // Log detailed debug information about the loaders
        if (vivCompatibleData.loader && vivCompatibleData.loader.length > 0) {
          const firstLoader = vivCompatibleData.loader[0]
          console.log('🔍 First loader dtype check:', firstLoader.dtype)
          console.log('📊 First loader shape:', firstLoader.shape)
          console.log('🏷️ First loader labels:', firstLoader.labels)
          
          // Use the lowest resolution (last in array) for performance
          const lowestResLoader = vivCompatibleData.loader[vivCompatibleData.loader.length - 1]
          console.log('🔽 Using lowest resolution loader:', {
            dtype: lowestResLoader.dtype,
            shape: lowestResLoader.shape,
            labels: lowestResLoader.labels
          })
        }
        
      } catch (error) {
        console.error('❌ CustomOmeZarrViewer: Failed to create Viv data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadVivData()
  }, [hasLoadedStore, store, root, omeData, source])

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
  
  console.log('🎬 CustomOmeZarrViewer: Rendering VolumeViewer with:', {
    loaderDtype: loaderToUse.dtype,
    loaderShape: loaderToUse.shape,
    metadata: vivData.metadata
  })

  return (
    <div style={{ height, width, position: 'relative', backgroundColor: '#000' }}>
      {/* Viv VolumeViewer */}
      <div style={{ marginTop: '40px', height: height - 40, width }}>
        <VolumeViewer
          loader={[loaderToUse]}
          contrastLimits={[vivData.metadata.channels[0]?.window || [0, 65535]]}
          colors={[vivData.metadata.channels[0]?.color || [255, 255, 255]]}
          channelsVisible={[true]}
          selections={[{ c: 0, t: 0, z: 0 }]}
          height={height - 40}
          width={width}
        />
      </div>
    </div>
  )
}

export default CustomOmeZarrViewer
