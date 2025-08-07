# Component Architecture

**Source**: [`src/app/components/`](../../src/app/components/)

The component layer provides interactive UI elements for zarr data visualization and manipulation, built on top of the context APIs.

## Overview

The component architecture is organized into specialized modules:

- **[Viewer2D](./viewer2D/)** - Main 2D viewer with frame selection
- **[Viewer3D](./viewer3D.md)** - Debug and analysis interface
- **Navigation Controls** - Z/T slice and channel management
- **Frame Interaction** - Drag-and-drop frame manipulation

## Component Hierarchy

```
App Layout
├── ZarrStoreProvider (Context)
│   └── Viewer2DDataProvider (Context)
│       ├── Viewer2D
│       │   ├── VivViewerWrapper
│       │   │   ├── DetailView
│       │   │   ├── OverviewView
│       │   │   └── FrameView (overlay)
│       │   └── Navigation Controls
│       │       ├── ChannelSelector
│       │       ├── ContrastLimitsSelector
│       │       └── Slider (Z/T navigation)
│       └── Viewer3D
│           ├── Frame Controls
│           ├── Data Analysis
│           └── Debug Information
```

## Core Components

### Viewer2D

**Source**: [`src/app/components/viewer2D/index.tsx`](../../src/app/components/viewer2D/index.tsx)

Main 2D viewer component integrating Viv for multi-resolution zarr visualization with interactive frame selection.

```tsx
import Viewer2D from './components/viewer2D'

function App() {
  return (
    <Viewer2DDataProvider>
      <Viewer2D />
    </Viewer2DDataProvider>
  )
}
```

**Key Features:**
- Multi-resolution image display with Viv
- Interactive frame selection with visual overlay
- Real-time navigation controls
- Channel and contrast management

### VivViewerWrapper

**Source**: [`src/app/components/viewer2D/map/VivViewerWrapper.tsx`](../../src/app/components/viewer2D/map/VivViewerWrapper.tsx)

High-performance wrapper around Viv's DeckGL-based viewer with custom frame overlay support.

```tsx
<VivViewerWrapper
  frameOverlayLayers={frameOverlayLayers}
  onFrameInteraction={handleFrameInteraction}
  containerDimensions={{ width: 800, height: 600 }}
/>
```

### FrameView

**Source**: [`src/app/components/viewer2D/map/FrameView.tsx`](../../src/app/components/viewer2D/map/FrameView.tsx)

Specialized view for rendering interactive frame selection overlays with resize handles.

```tsx
import { createFrameOverlayLayers, FrameView } from './map/FrameView'

const frameOverlayLayers = createFrameOverlayLayers(
  frameCenter,
  frameSize,
  viewportId,
  {
    showHandles: true,
    hoveredHandle: currentHoveredHandle
  }
)
```

**Frame Constraints:**
- Minimum size: 30×30 pixels
- Maximum size: 500×500 pixels  
- Real-time bounds validation
- Smooth resize with handle feedback

### Viewer3D

**Source**: [`src/app/components/viewer3D.tsx`](../../src/app/components/viewer3D.tsx)

Debug and analysis interface for frame-bound data visualization and real-time statistics.

```tsx
function Viewer3D() {
  const { frameBoundCellposeData, frameCenter, frameSize } = useViewer2DData()
  
  // Real-time cell analysis
  const cellStats = useMemo(() => {
    if (!frameBoundCellposeData) return null
    return analyzeCellposeData(frameBoundCellposeData)
  }, [frameBoundCellposeData])
  
  return (
    <div>
      <FrameControls />
      <DataAnalysis stats={cellStats} />
      <DebugInfo />
    </div>
  )
}
```

## Navigation Components

### ChannelSelector

**Source**: [`src/app/components/viewer2D/nav/ChannelSelector.tsx`](../../src/app/components/viewer2D/nav/ChannelSelector.tsx)

Multi-channel management with role-based channel mapping (nucleus, cytoplasm, etc.).

```tsx
<ChannelSelector
  channels={channelNames}
  channelMap={navigationState.channelMap}
  onChannelChange={(role, channelIndex) => {
    setNavigationState({
      ...navigationState,
      channelMap: { ...navigationState.channelMap, [role]: channelIndex }
    })
  }}
/>
```

### ContrastLimitsSelector

**Source**: [`src/app/components/viewer2D/nav/ContrastLimitsSelector.tsx`](../../src/app/components/viewer2D/nav/ContrastLimitsSelector.tsx)

Per-channel contrast adjustment with real-time preview.

```tsx
<ContrastLimitsSelector
  contrastLimits={navigationState.contrastLimits}
  maxContrastLimit={65535}
  onContrastLimitsChange={(limits) => {
    setNavigationState({
      ...navigationState,
      contrastLimits: limits
    })
  }}
/>
```

### Slider

**Source**: [`src/app/components/viewer2D/nav/Slider.tsx`](../../src/app/components/viewer2D/nav/Slider.tsx)

Reusable slider component for Z-slice and time navigation.

```tsx
<Slider
  label="Z-Slice"
  value={currentZSlice}
  min={0}
  max={maxZSlice}
  onChange={setZSlice}
  valueDisplay={(value, max) => `${value + 1} / ${max + 1}`}
/>
```

## Frame Interaction System

### Frame State Management

Frame interactions are managed through a combination of context state and local component state:

```tsx
// Global frame state (Viewer2DDataContext)
const { frameCenter, frameSize, setFrameCenter, setFrameSize } = useViewer2DData()

// Local interaction state (component-level)
const [dragState, setDragState] = useState<FrameInteractionState>({
  isDragging: false,
  dragMode: 'none',
  startPos: [0, 0],
  startFrameCenter: [0, 0],
  startFrameSize: [0, 0]
})
```

### Drag Modes

The frame system supports multiple interaction modes:

| Mode | Cursor | Description |
|------|--------|-------------|
| `move` | `move` | Drag entire frame to new position |
| `resize-nw` | `nw-resize` | Resize from northwest corner |
| `resize-ne` | `ne-resize` | Resize from northeast corner |
| `resize-sw` | `sw-resize` | Resize from southwest corner |
| `resize-se` | `se-resize` | Resize from southeast corner |
| `resize-n` | `n-resize` | Resize from north edge |
| `resize-s` | `s-resize` | Resize from south edge |
| `resize-e` | `e-resize` | Resize from east edge |
| `resize-w` | `w-resize` | Resize from west edge |

### Frame Calculation

Frame resize operations use precise edge-based calculations with bounds enforcement:

```typescript
function calculateFrameResize(
  dragMode: DragMode,
  startFrameCenter: [number, number],
  startFrameSize: [number, number],
  deltaX: number,
  deltaY: number
) {
  const MIN_FRAME_SIZE = 30
  const MAX_FRAME_SIZE = 500
  
  // Calculate new edges with delta
  let left = startCenterX - startWidth / 2
  let right = startCenterX + startWidth / 2
  // ... apply delta based on drag mode
  
  // Enforce size constraints
  if (right - left < MIN_FRAME_SIZE) {
    // Clamp to minimum
  }
  if (right - left > MAX_FRAME_SIZE) {
    // Clamp to maximum  
  }
  
  return {
    center: [(left + right) / 2, (top + bottom) / 2],
    size: [right - left, bottom - top]
  }
}
```

## Performance Considerations

### Rendering Optimization

- **WebGL Acceleration**: Viv leverages DeckGL for GPU-accelerated rendering
- **Viewport Culling**: Only visible tiles are loaded and rendered
- **Layer Composition**: Frame overlays use separate rendering layers
- **Memory Management**: Automatic texture cleanup and garbage collection

### State Management

- **Memoized Calculations**: Expensive computations cached with `useMemo`
- **Debounced Updates**: Frame interactions debounced to prevent excessive API calls
- **Selective Re-renders**: Component updates isolated to affected regions

### Data Loading

- **Progressive Loading**: Multi-resolution tiles loaded on demand
- **Background Fetching**: Higher resolutions pre-loaded in background
- **Cache Management**: Intelligent tile caching with LRU eviction

## Usage Examples

### Basic Viewer Setup

```tsx
import { ZarrStoreProvider } from '../contexts/ZarrStoreContext'
import { Viewer2DDataProvider } from '../contexts/Viewer2DDataContext'
import Viewer2D from '../components/viewer2D'
import Viewer3D from '../components/viewer3D'

function App() {
  return (
    <ZarrStoreProvider initialSource="https://example.com/data.zarr">
      <Viewer2DDataProvider>
        <div style={{ display: 'flex', height: '100vh' }}>
          <div style={{ width: '60%' }}>
            <Viewer2D />
          </div>
          <div style={{ width: '40%' }}>
            <Viewer3D />
          </div>
        </div>
      </Viewer2DDataProvider>
    </ZarrStoreProvider>
  )
}
```

### Custom Frame Handler

```tsx
function CustomFrameHandler() {
  const { frameCenter, frameSize, setFrameCenter, setFrameSize } = useViewer2DData()
  
  const handleDoubleClick = (event: MouseEvent) => {
    const clickX = event.clientX
    const clickY = event.clientY
    
    // Convert screen coordinates to data coordinates
    const dataCoords = screenToDataCoords(clickX, clickY)
    
    // Center frame on clicked position
    setFrameCenter([dataCoords.x, dataCoords.y])
  }
  
  const handleKeyboardResize = (event: KeyboardEvent) => {
    const [width, height] = frameSize
    const scaleFactor = event.shiftKey ? 1.1 : 0.9
    
    if (event.key === '=' || event.key === '+') {
      setFrameSize([width * scaleFactor, height * scaleFactor])
    } else if (event.key === '-') {
      setFrameSize([width / scaleFactor, height / scaleFactor])
    }
  }
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardResize)
    return () => window.removeEventListener('keydown', handleKeyboardResize)
  }, [frameSize])
  
  return <div onDoubleClick={handleDoubleClick}>/* viewer content */</div>
}
```

### Advanced Data Analysis

```tsx
function AdvancedCellAnalysis() {
  const { frameBoundCellposeData, frameCenter, frameSize } = useViewer2DData()
  
  const analysis = useMemo(() => {
    if (!frameBoundCellposeData) return null
    
    const data = Array.from(frameBoundCellposeData.data)
    const labelFrequency = new Map<number, number>()
    
    // Count pixels per label
    data.forEach(label => {
      labelFrequency.set(label, (labelFrequency.get(label) || 0) + 1)
    })
    
    // Remove background (label 0)
    labelFrequency.delete(0)
    
    const cellSizes = Array.from(labelFrequency.values())
    const avgCellSize = cellSizes.reduce((a, b) => a + b, 0) / cellSizes.length
    
    return {
      cellCount: labelFrequency.size,
      avgCellSize,
      totalCellArea: cellSizes.reduce((a, b) => a + b, 0),
      frameArea: frameSize[0] * frameSize[1],
      density: labelFrequency.size / (frameSize[0] * frameSize[1]) * 10000
    }
  }, [frameBoundCellposeData, frameSize])
  
  return (
    <div>
      <h3>Cell Analysis</h3>
      {analysis && (
        <div>
          <p>Cells: {analysis.cellCount}</p>
          <p>Avg Size: {analysis.avgCellSize.toFixed(1)} px</p>
          <p>Coverage: {(analysis.totalCellArea / analysis.frameArea * 100).toFixed(1)}%</p>
          <p>Density: {analysis.density.toFixed(2)} cells/10k px</p>
        </div>
      )}
    </div>
  )
}
```

## Related Documentation

- [Viewer2DDataContext](./Viewer2DDataContext.md) - Data context integration
- [Frame Extraction Guide](./guides/frame-extraction.md) - Advanced frame manipulation