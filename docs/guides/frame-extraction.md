# Frame Extraction API

**Core Concept**: Real-time extraction of frame-bound data from large zarr arrays

The frame extraction system provides efficient, cached access to spatial subsets of multi-dimensional zarr datasets. It automatically handles dimension mapping, bounds validation, and data type preservation.

## Overview

Frame extraction operates on the principle of **spatial windowing** - selecting a rectangular region from a larger dataset and extracting all data within that region across time and channel dimensions.

### Key Features

- **Real-time Slicing**: Sub-millisecond data extraction for interactive frame manipulation
- **Multi-dimensional Support**: Handles 3D (Z,Y,X), 4D (T,Z,Y,X), and 5D (T,C,Z,Y,X) arrays
- **Automatic Caching**: Intelligent cache management prevents redundant data fetching
- **Type Preservation**: Maintains original zarr data types (uint16, uint32, float32, etc.)
- **Bounds Validation**: Automatic clipping to array boundaries

## Basic Usage

### Accessing Frame Data

```tsx
import { useViewer2DData } from '../contexts/Viewer2DDataContext'

function DataProcessor() {
  const { 
    frameBoundCellposeData,
    frameCenter,
    frameSize,
    isDataLoading,
    dataError 
  } = useViewer2DData()
  
  if (isDataLoading) return <div>Loading...</div>
  if (dataError) return <div>Error: {dataError}</div>
  if (!frameBoundCellposeData) return <div>No data</div>
  
  // Process the extracted data
  const processData = () => {
    const { data, shape, dtype } = frameBoundCellposeData
    console.log(`Data shape: ${shape.join(' × ')}`)
    console.log(`Data type: ${dtype}`)
    console.log(`Array length: ${data.length}`)
    
    // data is a typed array (Uint32Array for Cellpose)
    return Array.from(data)
  }
  
  return <div>{/* Your visualization */}</div>
}
```

### Frame Parameters

The extraction region is defined by frame center and size:

```tsx
// Frame center coordinates [x, y]
const frameCenter: [number, number] = [2500, 1800]

// Frame dimensions [width, height]  
const frameSize: [number, number] = [400, 300]

// Computed bounds
const bounds = {
  left: frameCenter[0] - frameSize[0] / 2,   // 2300
  right: frameCenter[0] + frameSize[0] / 2,  // 2700
  top: frameCenter[1] - frameSize[1] / 2,    // 1650
  bottom: frameCenter[1] + frameSize[1] / 2  // 1950
}
```

## Advanced Usage

### Manual Frame Control

```tsx
function ManualFrameControl() {
  const { setFrameCenter, setFrameSize, getFrameBounds } = useViewer2DData()
  
  // Programmatic frame positioning
  const centerOnRegion = (x: number, y: number, width: number, height: number) => {
    setFrameCenter([x, y])
    setFrameSize([width, height])
  }
  
  // Query current bounds
  const currentBounds = getFrameBounds()
  
  // Animated frame movement
  const animateToPosition = async (targetX: number, targetY: number) => {
    const currentCenter = frameCenter
    const steps = 30
    
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps
      const newX = currentCenter[0] + (targetX - currentCenter[0]) * progress
      const newY = currentCenter[1] + (targetY - currentCenter[1]) * progress
      
      setFrameCenter([newX, newY])
      await new Promise(resolve => setTimeout(resolve, 16)) // 60fps
    }
  }
  
  return (
    <div>
      <button onClick={() => centerOnRegion(1000, 1000, 200, 200)}>
        Small Frame
      </button>
      <button onClick={() => animateToPosition(3000, 2000)}>
        Animate to Position
      </button>
    </div>
  )
}
```

### Multi-dimensional Navigation

```tsx
function MultiDimensionalNavigation() {
  const {
    currentZSlice,
    currentTimeSlice,
    setZSlice,
    setTimeSlice,
    frameBoundCellposeData
  } = useViewer2DData()
  
  // Navigate through Z-stack while maintaining frame
  const nextZSlice = () => setZSlice(currentZSlice + 1)
  const prevZSlice = () => setZSlice(Math.max(0, currentZSlice - 1))
  
  // Time series navigation
  const nextTimePoint = () => setTimeSlice(currentTimeSlice + 1)
  const prevTimePoint = () => setTimeSlice(Math.max(0, currentTimeSlice - 1))
  
  // Data automatically updates when slices change
  useEffect(() => {
    if (frameBoundCellposeData) {
      console.log(`New data for Z=${currentZSlice}, T=${currentTimeSlice}`)
      // Process updated frame data
    }
  }, [frameBoundCellposeData, currentZSlice, currentTimeSlice])
  
  return (
    <div>
      <div>
        <button onClick={prevZSlice}>← Z</button>
        <span>Z: {currentZSlice}</span>
        <button onClick={nextZSlice}>Z →</button>
      </div>
      <div>
        <button onClick={prevTimePoint}>← T</button>
        <span>T: {currentTimeSlice}</span>
        <button onClick={nextTimePoint}>T →</button>
      </div>
    </div>
  )
}
```

## Data Processing Examples

### Cell Segmentation Analysis

```tsx
function CellSegmentationAnalysis() {
  const { frameBoundCellposeData, frameSize } = useViewer2DData()
  
  const cellAnalysis = useMemo(() => {
    if (!frameBoundCellposeData) return null
    
    const data = Array.from(frameBoundCellposeData.data)
    const [height, width] = frameBoundCellposeData.shape
    
    // Count unique labels (cells)
    const labelSet = new Set(data)
    const backgroundLabel = 0
    labelSet.delete(backgroundLabel)
    
    // Calculate cell properties
    const labelFrequency = new Map<number, number>()
    data.forEach(label => {
      if (label !== backgroundLabel) {
        labelFrequency.set(label, (labelFrequency.get(label) || 0) + 1)
      }
    })
    
    const cellSizes = Array.from(labelFrequency.values())
    const totalCellPixels = cellSizes.reduce((sum, size) => sum + size, 0)
    
    return {
      cellCount: labelSet.size,
      averageCellSize: cellSizes.length > 0 ? totalCellPixels / cellSizes.length : 0,
      totalCellArea: totalCellPixels,
      frameArea: width * height,
      cellCoverage: totalCellPixels / (width * height),
      cellDensity: labelSet.size / (width * height) * 10000 // cells per 10k pixels
    }
  }, [frameBoundCellposeData])
  
  return (
    <div>
      <h3>Cell Analysis</h3>
      {cellAnalysis && (
        <table>
          <tr><td>Cell Count:</td><td>{cellAnalysis.cellCount}</td></tr>
          <tr><td>Average Size:</td><td>{cellAnalysis.averageCellSize.toFixed(1)} px</td></tr>
          <tr><td>Coverage:</td><td>{(cellAnalysis.cellCoverage * 100).toFixed(1)}%</td></tr>
          <tr><td>Density:</td><td>{cellAnalysis.cellDensity.toFixed(2)} cells/10k px</td></tr>
        </table>
      )}
    </div>
  )
}
```

### Intensity Measurements

```tsx
function IntensityMeasurements() {
  const { frameBoundArray, frameBoundCellposeData } = useViewer2DData()
  
  const intensityStats = useMemo(() => {
    if (!frameBoundArray || !frameBoundCellposeData) return null
    
    // Assume first channel for intensity measurements
    const intensityData = Array.from(frameBoundArray.data)
    const labelData = Array.from(frameBoundCellposeData.data)
    const [channels, height, width] = frameBoundArray.shape
    
    // Extract first channel (assuming TCHZYX order)
    const channelPixels = intensityData.slice(0, height * width)
    
    // Calculate per-cell intensities
    const cellIntensities = new Map<number, number[]>()
    
    for (let i = 0; i < channelPixels.length; i++) {
      const cellLabel = labelData[i]
      const intensity = channelPixels[i]
      
      if (cellLabel > 0) { // Skip background
        if (!cellIntensities.has(cellLabel)) {
          cellIntensities.set(cellLabel, [])
        }
        cellIntensities.get(cellLabel)!.push(intensity)
      }
    }
    
    // Calculate statistics per cell
    const cellStats = Array.from(cellIntensities.entries()).map(([label, intensities]) => {
      const mean = intensities.reduce((a, b) => a + b, 0) / intensities.length
      const sorted = intensities.sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      const min = sorted[0]
      const max = sorted[sorted.length - 1]
      
      return { label, mean, median, min, max, pixelCount: intensities.length }
    })
    
    return cellStats
  }, [frameBoundArray, frameBoundCellposeData])
  
  return (
    <div>
      <h3>Cell Intensity Statistics</h3>
      {intensityStats && (
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Cell</th>
                <th>Mean</th>
                <th>Median</th>
                <th>Min</th>
                <th>Max</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {intensityStats.map(stat => (
                <tr key={stat.label}>
                  <td>{stat.label}</td>
                  <td>{stat.mean.toFixed(1)}</td>
                  <td>{stat.median}</td>
                  <td>{stat.min}</td>
                  <td>{stat.max}</td>
                  <td>{stat.pixelCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

## Performance Optimization

### Efficient Data Access

```tsx
function OptimizedDataProcessor() {
  const { frameBoundCellposeData } = useViewer2DData()
  
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    if (!frameBoundCellposeData) return null
    
    // Process data only when it changes
    return expensiveDataProcessing(frameBoundCellposeData)
  }, [frameBoundCellposeData])
  
  // Debounce frequent updates
  const [debouncedData, setDebouncedData] = useState(processedData)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedData(processedData)
    }, 100) // 100ms debounce
    
    return () => clearTimeout(timer)
  }, [processedData])
  
  return <div>{/* Use debouncedData for rendering */}</div>
}
```

### Memory Management

```tsx
function MemoryEfficientProcessor() {
  const { frameBoundCellposeData } = useViewer2DData()
  
  // Process data in chunks to avoid memory spikes
  const processInChunks = useCallback((data: Uint32Array, chunkSize = 10000) => {
    const results = []
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      results.push(processChunk(chunk))
    }
    
    return results
  }, [])
  
  // Clean up references when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup any large data structures
    }
  }, [])
  
  return <div>{/* Your component */}</div>
}
```

## Error Handling

### Robust Data Access

```tsx
function RobustDataAccess() {
  const { frameBoundCellposeData, dataError, isDataLoading } = useViewer2DData()
  
  // Handle all possible states
  if (isDataLoading) {
    return <div>Loading frame data...</div>
  }
  
  if (dataError) {
    return (
      <div>
        <p>Error loading data: {dataError}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }
  
  if (!frameBoundCellposeData) {
    return <div>No segmentation data available for current frame</div>
  }
  
  // Validate data integrity
  const { shape, data } = frameBoundCellposeData
  if (shape.length !== 2 || data.length !== shape[0] * shape[1]) {
    return <div>Invalid data format detected</div>
  }
  
  // Safe data processing
  try {
    const processedData = processData(frameBoundCellposeData)
    return <div>{/* Render processed data */}</div>
  } catch (error) {
    console.error('Data processing error:', error)
    return <div>Error processing data</div>
  }
}
```

## Integration Examples

### Custom Frame Extractor

```tsx
// Create a custom hook for specialized frame extraction
function useCustomFrameExtractor(processingFunction: (data: any) => any) {
  const { frameBoundCellposeData, frameCenter, frameSize } = useViewer2DData()
  
  return useMemo(() => {
    if (!frameBoundCellposeData) return null
    
    return {
      rawData: frameBoundCellposeData,
      processedData: processingFunction(frameBoundCellposeData),
      metadata: {
        center: frameCenter,
        size: frameSize,
        extractedAt: new Date().toISOString()
      }
    }
  }, [frameBoundCellposeData, frameCenter, frameSize, processingFunction])
}

// Usage
function CustomAnalysis() {
  const frameData = useCustomFrameExtractor((data) => {
    // Your custom processing logic
    return analyzeSegmentation(data)
  })
  
  return frameData ? (
    <div>
      <h3>Custom Analysis Results</h3>
      <pre>{JSON.stringify(frameData.processedData, null, 2)}</pre>
    </div>
  ) : null
}
```

## Related Documentation

- [Viewer2DDataContext](../contexts/Viewer2DDataContext.md) - Context API reference
- [Performance Guide](./performance.md) - Optimization strategies
- [Type Definitions](../types/viewer2d-context.md) - TypeScript interfaces
- [Zarr Integration](./zarr-integration.md) - Working with zarr arrays
