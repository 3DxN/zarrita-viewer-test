# Viewer2DDataContext

**Source**: [`src/contexts/Viewer2DDataContext.tsx`](../../src/contexts/Viewer2DDataContext.tsx)

The Viewer2DDataContext provides unified state management for frame coordinates, view navigation, and real-time data extraction. It serves as the primary interface for frame-based zarr data access.

## Overview

This context manages the complete frame interaction lifecycle:

- **Frame State**: Coordinates, size, and Z-depth for 3D frame selection
- **View Management**: Current view bounds and navigation controls
- **Data Extraction**: Real-time frame-bound data slicing from zarr arrays
- **Cellpose Integration**: Automatic frame-bound segmentation data
- **Performance**: Optimized re-rendering and data caching

## API Reference

### Hook Usage

```tsx
import { useViewer2DData } from '../contexts/Viewer2DDataContext'

function MyComponent() {
  const {
    // Frame state
    frameCenter, frameSize, frameZDepth,
    setFrameCenter, setFrameSize, setFrameZDepth,
    getFrameBounds,
    
    // View state
    currentViewBounds, currentZSlice, currentTimeSlice,
    setViewBounds, setZSlice, setTimeSlice,
    
    // Navigation integration
    navigationState, setNavigationState,
    vivViewState, setVivViewState,
    
    // Data access
    frameBoundCellposeData,
    isDataLoading, dataError
  } = useViewer2DData()
}
```

### Frame State Management

#### Core Frame Properties

| Property | Type | Description |
|----------|------|-------------|
| `frameCenter` | `[number, number]` | Frame center coordinates [x, y] |
| `frameSize` | `[number, number]` | Frame dimensions [width, height] |
| `frameZDepth` | `number` | Z-stack depth for 3D frame selection |

#### Frame Actions

```tsx
// Move frame to new position
setFrameCenter([2500, 1800])

// Resize frame (maintains center)
setFrameSize([400, 300])

// Set Z-depth for 3D selection
setFrameZDepth(10)

// Get current frame bounds
const bounds = getFrameBounds()
// Returns: { left, right, top, bottom }
```

### View State Management

#### Current View Properties

| Property | Type | Description |
|----------|------|-------------|
| `currentViewBounds` | `ViewBounds \| null` | Current viewport boundaries |
| `currentZSlice` | `number` | Active Z-slice index |
| `currentTimeSlice` | `number` | Active time point index |

#### View Navigation

```tsx
// Set viewport to specific bounds
setViewBounds({ x1: 1000, y1: 800, x2: 2000, y2: 1600 })

// Navigate Z-stack
setZSlice(42)

// Navigate time series
setTimeSlice(15)
```

### Data Access

#### Frame-Bound Data

The context automatically provides frame-bound data that updates when frame parameters change:

```tsx
const { frameBoundCellposeData, isDataLoading, dataError } = useViewer2DData()

if (isDataLoading) {
  return <div>Loading frame data...</div>
}

if (dataError) {
  return <div>Error: {dataError}</div>
}

if (frameBoundCellposeData) {
  // Process segmentation data
  const [height, width] = frameBoundCellposeData.shape
  const data = frameBoundCellposeData.data
  // data is typed as Uint32Array for Cellpose labels
}
```

## Implementation Details

### Automatic Data Updates

Frame-bound data automatically updates when any of these parameters change:

- Frame center or size
- Current Z-slice or time slice
- Navigation state (contrast, channels)

```typescript
// Internal effect manages data lifecycle
useEffect(() => {
  // Only update if dependencies actually changed
  loadFrameBoundCellposeData()
}, [cellposeArray, navigationState, frameCenter, frameSize, currentZSlice, currentTimeSlice])
```

### Frame Bounds Calculation

The `getFrameBounds()` function provides pixel-perfect frame boundaries:

```typescript
const getFrameBounds = () => {
  const [centerX, centerY] = frameCenter
  const [width, height] = frameSize
  const halfWidth = width / 2
  const halfHeight = height / 2

  return {
    left: centerX - halfWidth,
    right: centerX + halfWidth,
    top: centerY - halfHeight,
    bottom: centerY + halfHeight,
  }
}
```

### Data Slicing Strategy

Zarr arrays are sliced using optimized selection arrays:

```typescript
// For Cellpose data (3D: Z, Y, X)
const selection = [
  currentZSlice,                    // Z dimension
  zarrita.slice(y1, y2),           // Y dimension (frame bounds)
  zarrita.slice(x1, x2)            // X dimension (frame bounds)
]

// For multiscale data (5D: T, C, Z, Y, X)
const selection = [
  currentTimeSlice,                // T dimension
  null,                           // C dimension (all channels)
  currentZSlice,                  // Z dimension
  zarrita.slice(y1, y2),         // Y dimension (frame bounds)
  zarrita.slice(x1, x2)          // X dimension (frame bounds)
]
```

## Usage Examples

### Basic Frame Manipulation

```tsx
import { Viewer2DDataProvider, useViewer2DData } from '../contexts/Viewer2DDataContext'

function FrameControls() {
  const { 
    frameCenter, 
    frameSize, 
    setFrameCenter, 
    setFrameSize,
    getFrameBounds 
  } = useViewer2DData()
  
  const moveFrame = (deltaX: number, deltaY: number) => {
    const [x, y] = frameCenter
    setFrameCenter([x + deltaX, y + deltaY])
  }
  
  const resizeFrame = (factor: number) => {
    const [w, h] = frameSize
    setFrameSize([w * factor, h * factor])
  }
  
  const bounds = getFrameBounds()
  
  return (
    <div>
      <h3>Frame Controls</h3>
      <p>Center: {frameCenter.join(', ')}</p>
      <p>Size: {frameSize.join(' × ')}</p>
      <p>Bounds: ({bounds.left}, {bounds.top}) → ({bounds.right}, {bounds.bottom})</p>
      
      <div>
        <button onClick={() => moveFrame(-50, 0)}>← Left</button>
        <button onClick={() => moveFrame(50, 0)}>Right →</button>
        <button onClick={() => moveFrame(0, -50)}>↑ Up</button>
        <button onClick={() => moveFrame(0, 50)}>Down ↓</button>
      </div>
      
      <div>
        <button onClick={() => resizeFrame(0.8)}>Shrink</button>
        <button onClick={() => resizeFrame(1.25)}>Grow</button>
      </div>
    </div>
  )
}
```

### Real-Time Data Processing

```tsx
function CellposeAnalyzer() {
  const { frameBoundCellposeData, frameCenter, frameSize } = useViewer2DData()
  
  const cellStats = useMemo(() => {
    if (!frameBoundCellposeData) return null
    
    const data = Array.from(frameBoundCellposeData.data)
    const uniqueLabels = new Set(data)
    const cellCount = uniqueLabels.size - 1 // Exclude background (0)
    
    return {
      cellCount,
      totalPixels: data.length,
      frameArea: frameSize[0] * frameSize[1],
      density: cellCount / (frameSize[0] * frameSize[1]) * 10000 // cells per 10k pixels
    }
  }, [frameBoundCellposeData, frameSize])
  
  return (
    <div>
      <h3>Live Cell Analysis</h3>
      <p>Frame: {frameCenter.join(', ')} ({frameSize.join(' × ')})</p>
      
      {cellStats && (
        <div>
          <p>Cells Detected: {cellStats.cellCount}</p>
          <p>Cell Density: {cellStats.density.toFixed(2)} cells/10k px</p>
          <p>Frame Coverage: {cellStats.totalPixels} pixels</p>
        </div>
      )}
      
      {!frameBoundCellposeData && <p>No segmentation data available</p>}
    </div>
  )
}
```

### Navigation Integration

```tsx
function NavigationControls() {
  const {
    currentZSlice,
    currentTimeSlice,
    setZSlice,
    setTimeSlice,
    navigationState
  } = useViewer2DData()
  
  const maxZ = navigationState?.maxZSlice ?? 0
  const maxT = navigationState?.maxTimeSlice ?? 0
  
  return (
    <div>
      <h3>Navigation</h3>
      
      <div>
        <label>Z-Slice: {currentZSlice} / {maxZ}</label>
        <input
          type="range"
          min={0}
          max={maxZ}
          value={currentZSlice}
          onChange={(e) => setZSlice(Number(e.target.value))}
        />
      </div>
      
      <div>
        <label>Time Point: {currentTimeSlice} / {maxT}</label>
        <input
          type="range"
          min={0}
          max={maxT}
          value={currentTimeSlice}
          onChange={(e) => setTimeSlice(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
```

### View State Synchronization

```tsx
function ViewControls() {
  const {
    currentViewBounds,
    vivViewState,
    setViewBounds,
    setVivViewState
  } = useViewer2DData()
  
  const centerView = () => {
    if (currentViewBounds) {
      const centerX = (currentViewBounds.x1 + currentViewBounds.x2) / 2
      const centerY = (currentViewBounds.y1 + currentViewBounds.y2) / 2
      
      setVivViewState({
        target: [centerX, centerY, 0],
        zoom: vivViewState?.zoom ?? 0
      })
    }
  }
  
  const fitToFrame = () => {
    const { frameCenter, frameSize } = useViewer2DData()
    const [centerX, centerY] = frameCenter
    const [width, height] = frameSize
    
    setViewBounds({
      x1: centerX - width / 2,
      y1: centerY - height / 2,
      x2: centerX + width / 2,
      y2: centerY + height / 2
    })
  }
  
  return (
    <div>
      <h3>View Controls</h3>
      {currentViewBounds && (
        <p>
          View: ({currentViewBounds.x1.toFixed(0)}, {currentViewBounds.y1.toFixed(0)}) → 
          ({currentViewBounds.x2.toFixed(0)}, {currentViewBounds.y2.toFixed(0)})
        </p>
      )}
      
      <button onClick={centerView}>Center View</button>
      <button onClick={fitToFrame}>Fit to Frame</button>
    </div>
  )
}
```

## Performance Optimizations

### Dependency Management

The context uses careful dependency management to prevent unnecessary re-renders:

```typescript
// Only update when frame parameters actually change
const contextValue = useMemo(() => ({
  frameCenter, frameSize, frameZDepth,
  // ... other values
}), [frameCenter, frameSize, frameZDepth, /* other deps */])
```

### Data Caching

- Frame-bound data is cached and only re-computed when parameters change
- Loading states prevent cascading updates during data fetches
- Error boundaries isolate data loading failures

### Memory Management

- Large zarr chunks are not held in memory longer than necessary
- Automatic cleanup of unused data references
- Efficient typed array handling for segmentation data

## Integration with Other Contexts

### ZarrStoreContext Integration

```tsx
// Viewer2DDataContext automatically consumes ZarrStore data
const { msInfo, cellposeArray } = useZarrStore()

// Frame extraction uses store-provided arrays
useEffect(() => {
  if (cellposeArray && navigationState) {
    extractFrameData(cellposeArray)
  }
}, [cellposeArray, navigationState, frameCenter, frameSize])
```

### Provider Composition

```tsx
function App() {
  return (
    <ZarrStoreProvider initialSource="https://example.com/data.zarr">
      <Viewer2DDataProvider>
        {/* Your viewer components */}
        <FrameControls />
        <CellposeAnalyzer />
        <NavigationControls />
      </Viewer2DDataProvider>
    </ZarrStoreProvider>
  )
}
```

## Error Handling

The context provides comprehensive error handling for data operations:

| Error Type | Cause | Recovery |
|------------|-------|----------|
| `dataError` | Failed zarr slicing | Check frame bounds and array dimensions |
| Loading timeout | Network issues | Retry with smaller frame size |
| Invalid selection | Out-of-bounds frame | Validate frame coordinates |
| Memory error | Frame too large | Reduce frame size or Z-depth |

## Related Documentation

- [ZarrStoreContext](./ZarrStoreContext.md) - Store-level data management
- [Frame Extraction Guide](../guides/frame-extraction.md) - Advanced frame manipulation
- [Type Definitions](../types.md) - TypeScript interfaces
