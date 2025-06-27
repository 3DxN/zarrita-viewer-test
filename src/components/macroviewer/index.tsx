'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import * as zarrita from 'zarrita'

export default function MacroViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zarrUrl, setZarrUrl] = useState('http://localhost:5500/test_prostate_s1+crop_v3_fix.ome.zarr')
  const [directory, setDirectory] = useState('0/0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [arrayInfo, setArrayInfo] = useState<any>(null)
  const [currentArray, setCurrentArray] = useState<any>(null)
  
  // Navigation state
  const [xOffset, setXOffset] = useState(0)
  const [yOffset, setYOffset] = useState(0)
  const [zSlice, setZSlice] = useState(0)
  const [timeSlice, setTimeSlice] = useState(0)
  const [currentChannel, setCurrentChannel] = useState(0)
  
  // Navigation limits
  const [maxXOffset, setMaxXOffset] = useState(0)
  const [maxYOffset, setMaxYOffset] = useState(0)
  const [maxZSlice, setMaxZSlice] = useState(0)
  const [maxTimeSlice, setMaxTimeSlice] = useState(0)
  const [numChannels, setNumChannels] = useState(1)

  const renderImageRegion = useCallback(async (arr: any, xOff = 0, yOff = 0, zSl = 0, timeSl = 0, channel = 0) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get array dimensions
    const width = arr.shape[arr.shape.length - 1]
    const height = arr.shape[arr.shape.length - 2]
    
    // Clamp values to valid ranges
    const clampedTimeSlice = Math.min(timeSl, arr.shape.length >= 4 ? arr.shape[0] - 1 : 0)
    const clampedChannel = Math.min(channel, arr.shape.length >= 4 ? 
      (arr.shape.length === 5 ? arr.shape[1] - 1 : arr.shape[0] - 1) : 0)
    const clampedZSlice = Math.min(zSl, arr.shape.length >= 3 ? 
      arr.shape[arr.shape.length - 3] - 1 : 0)
    const clampedXOffset = Math.min(xOff, width - 1)
    const clampedYOffset = Math.min(yOff, height - 1)
    
    // Calculate region size (max 256x256)
    const regionWidth = Math.min(256, width - clampedXOffset)
    const regionHeight = Math.min(256, height - clampedYOffset)

    // Create selection for the region
    const selection = []
    
    // Handle different array shapes
    if (arr.shape.length === 5) {
      // [t, c, z, y, x]
      selection.push(clampedTimeSlice)
      selection.push(clampedChannel)
      selection.push(clampedZSlice)
      selection.push(zarrita.slice(clampedYOffset, clampedYOffset + regionHeight))
      selection.push(zarrita.slice(clampedXOffset, clampedXOffset + regionWidth))
    } else if (arr.shape.length === 4) {
      // [c, z, y, x] or [t, z, y, x]
      selection.push(clampedChannel)
      selection.push(clampedZSlice)
      selection.push(zarrita.slice(clampedYOffset, clampedYOffset + regionHeight))
      selection.push(zarrita.slice(clampedXOffset, clampedXOffset + regionWidth))
    } else if (arr.shape.length === 3) {
      // [z, y, x]
      selection.push(clampedZSlice)
      selection.push(zarrita.slice(clampedYOffset, clampedYOffset + regionHeight))
      selection.push(zarrita.slice(clampedXOffset, clampedXOffset + regionWidth))
    } else {
      // [y, x]
      selection.push(zarrita.slice(clampedYOffset, clampedYOffset + regionHeight))
      selection.push(zarrita.slice(clampedXOffset, clampedXOffset + regionWidth))
    }

    const imageData = await zarrita.get(arr, selection)
    const { data, shape } = imageData
    
    // Get actual dimensions from the slice result
    const actualHeight = shape[shape.length - 2]
    const actualWidth = shape[shape.length - 1]
    
    canvas.width = actualWidth
    canvas.height = actualHeight

    const imageDataCanvas = ctx.createImageData(actualWidth, actualHeight)
    
    // Normalize data to 0-255 range
    const dataArray = Array.from(data as ArrayLike<number>)
    const min = Math.min(...dataArray)
    const max = Math.max(...dataArray)
    const range = max - min || 1
    
    // Convert to grayscale RGBA
    for (let i = 0; i < dataArray.length && i < actualWidth * actualHeight; i++) {
      const normalized = Math.floor(((dataArray[i] - min) / range) * 255)
      const pixelIndex = i * 4
      
      imageDataCanvas.data[pixelIndex] = normalized     // R
      imageDataCanvas.data[pixelIndex + 1] = normalized // G
      imageDataCanvas.data[pixelIndex + 2] = normalized // B
      imageDataCanvas.data[pixelIndex + 3] = 255        // A
    }
    
    ctx.putImageData(imageDataCanvas, 0, 0)
  }, [])

  const setupNavigationControls = useCallback((arr: any) => {
    const width = arr.shape[arr.shape.length - 1]
    const height = arr.shape[arr.shape.length - 2]
    
    // Set max offsets (allowing for 256x256 region)
    setMaxXOffset(Math.max(0, width - 256))
    setMaxYOffset(Math.max(0, height - 256))
    
    // Determine number of channels based on array shape
    let channels = 1
    if (arr.shape.length >= 4) {
      // For 5D arrays [t, c, z, y, x], channels are at index 1
      // For 4D arrays, we assume first dimension could be channels if it's small
      if (arr.shape.length === 5) {
        channels = arr.shape[1]
      } else if (arr.shape.length === 4) {
        // Assume channel dimension is the one that's typically small (< 10)
        channels = arr.shape[0] <= 10 ? arr.shape[0] : 1
      }
    }
    setNumChannels(channels)
    
    // Set Z slice range
    if (arr.shape.length >= 3) {
      const zDim = arr.shape.length - 3
      setMaxZSlice(Math.max(0, arr.shape[zDim] - 1))
    } else {
      setMaxZSlice(0)
    }
    
    // Set time slice range
    if (arr.shape.length >= 4) {
      let timeDim = 0
      if (arr.shape.length === 5) {
        // Standard OME-Zarr: [t, c, z, y, x]
        timeDim = 0
      } else if (arr.shape.length === 4) {
        // Could be [t, z, y, x] or [c, z, y, x]
        timeDim = 0
      }
      setMaxTimeSlice(Math.max(0, arr.shape[timeDim] - 1))
    } else {
      setMaxTimeSlice(0)
    }
    
    // Reset navigation values
    setXOffset(0)
    setYOffset(0)
    setZSlice(arr.shape.length >= 3 ? Math.floor(arr.shape[arr.shape.length - 3] / 2) : 0)
    setTimeSlice(0)
    setCurrentChannel(0)
  }, [])

  const updateImage = useCallback(async () => {
    if (!currentArray) return
    
    try {
      await renderImageRegion(currentArray, xOffset, yOffset, zSlice, timeSlice, currentChannel)
    } catch (err) {
      setError(`Error updating image: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [currentArray, xOffset, yOffset, zSlice, timeSlice, currentChannel, renderImageRegion])

  const loadZarrData = async () => {
    setLoading(true)
    setError(null)
    setArrayInfo(null)
    setCurrentArray(null)
    
    try {
      // Load the store and try to open the array directly
      const store = new zarrita.FetchStore(zarrUrl)
      const root = zarrita.root(store)
      const arr = await zarrita.open(root.resolve(directory), { kind: 'array' })
      
      setCurrentArray(arr)
      setArrayInfo({
        shape: arr.shape,
        dtype: arr.dtype,
        chunks: arr.chunks
      })
      
      // Setup navigation controls based on array shape
      setupNavigationControls(arr)
      
      // Render initial image
      await renderImageRegion(arr, 0, 0, 
        arr.shape.length >= 3 ? Math.floor(arr.shape[arr.shape.length - 3] / 2) : 0, 
        0, 0)
      
    } catch (err) {
      // If it's not an array, try as group and show simple error
      try {
        const store = new zarrita.FetchStore(zarrUrl)
        const root = zarrita.root(store)
        await zarrita.open(root.resolve(directory), { kind: 'group' })
        setError(`Path "${directory}" is a group. Navigate deeper into the directory structure.`)
      } catch (e) {
        setError(`Error loading path "${directory}": ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Add useEffect to update image when navigation state changes
  useEffect(() => {
    updateImage()
  }, [updateImage])

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
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
      
      {arrayInfo && (
        <div style={{ 
          fontSize: '12px', 
          margin: '10px 0',
          backgroundColor: '#e9ecef',
          padding: '10px',
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          Array Info:<br/>
          Shape: [{arrayInfo.shape.join(', ')}]<br/>
          Type: {arrayInfo.dtype}<br/>
          Chunks: [{arrayInfo.chunks.join(', ')}]
        </div>
      )}

      {arrayInfo && (
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          alignItems: 'flex-start',
        }}>
          <canvas 
            ref={canvasRef}
            style={{ 
              minWidth: '20%', 
              border: '1px solid #ddd',
              display: loading ? 'none' : 'block',
              backgroundColor: '#f9f9f9'
            }}
          />

          <div style={{ 
            width: '320px',
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '5px',
            flexShrink: 0
          }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                Channels:
              </label>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {Array.from({ length: numChannels }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentChannel(i)}
                    style={{
                      backgroundColor: currentChannel === i ? '#28a745' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Ch {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation sliders */}
            <div style={{ display: 'grid', gap: '15px', marginBottom: '5px', }}>
              {/* X Offset */}
              <div>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
                    X Offset:
                  </label>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                  ({xOffset}-{Math.min(xOffset + 256, arrayInfo.shape[arrayInfo.shape.length - 1])})/{arrayInfo.shape[arrayInfo.shape.length - 1]}
                </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxXOffset}
                  value={xOffset}
                  onChange={(e) => setXOffset(parseInt(e.target.value))}
                  style={{ width: '100%', marginBottom: '5px' }}
                />
              </div>

              {/* Y Offset */}
              <div>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
                    Y Offset:
                  </label>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    ({yOffset}-{Math.min(yOffset + 256, arrayInfo.shape[arrayInfo.shape.length - 2])})/{arrayInfo.shape[arrayInfo.shape.length - 2]}
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxYOffset}
                  value={yOffset}
                  onChange={(e) => setYOffset(parseInt(e.target.value))}
                  style={{ width: '100%', marginBottom: '5px' }}
                />
              </div>

              {/* Z Slice */}
              {arrayInfo.shape.length >= 3 && (
                <div>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
                      Z Slice:
                    </label>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {zSlice}/{maxZSlice}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxZSlice}
                    value={zSlice}
                    onChange={(e) => setZSlice(parseInt(e.target.value))}
                    style={{ width: '100%', marginBottom: '5px' }}
                  />
                </div>
              )}

              {/* Time Slice */}
              {arrayInfo.shape.length >= 4 && maxTimeSlice > 0 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                    Time:
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={maxTimeSlice}
                    value={timeSlice}
                    onChange={(e) => setTimeSlice(parseInt(e.target.value))}
                    style={{ width: '100%', marginBottom: '5px' }}
                  />
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    {timeSlice}/{maxTimeSlice}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show canvas even when no array info for initial state */}
      {!arrayInfo && (
        <canvas 
          ref={canvasRef}
          style={{ 
            maxWidth: '100%', 
            border: '1px solid #ddd',
            display: loading ? 'none' : 'block',
            backgroundColor: '#f9f9f9'
          }}
        />
      )}
    </div>
  )
}