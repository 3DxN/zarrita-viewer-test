# Type Definitions Reference

**Source**: [`src/types/`](../../src/types/)

Comprehensive TypeScript type definitions for the zarr viewer ecosystem.

## Overview

The type system is organized into logical modules that correspond to different aspects of the viewer:

- **[Core Types](#core-types)** - Base types and utilities
- **[Context Types](#context-types)** - React context interfaces
- **[Component Types](#component-types)** - Component prop interfaces  
- **[Data Types](#data-types)** - Zarr and OME data structures
- **[Interaction Types](#interaction-types)** - User interaction and navigation
- **[Viewer Types](#viewer-types)** - Viv integration and rendering

## Core Types

**Source**: [`src/types/core.ts`](../../src/types/core.ts)

### AxisKey
```typescript
type AxisKey = 'x' | 'y' | 'z' | 't' | 'c'
```
Defines the standard microscopy dimensions.

### MultiscaleShape
```typescript
type MultiscaleShape = Partial<Record<AxisKey, number>>
```
Shape information for multiscale arrays with optional dimensions.

### ChannelMapping
```typescript
type ChannelMapping = {
  nucleus: number | null
  cytoplasm: number | null
}
```
Maps biological structures to channel indices.

### ContrastLimits
```typescript
type ContrastLimits = [number | null, number | null]
```
Min/max values for image contrast adjustment.

## Context Types

### ZarrStoreContextType

**Source**: [`src/types/store.ts`](../../src/types/store.ts)

```typescript
interface ZarrStoreContextType {
  // Store state
  store: FetchStore | null
  root: Location<FetchStore> | null
  omeData: OMEAttrs | null
  msInfo: IMultiscaleInfo | null
  
  // Cellpose integration
  cellposeArray: ZArray<FetchStore> | null
  isCellposeLoading: boolean
  cellposeError: string | null
  
  // Loading state
  isLoading: boolean
  error: string | null
  hasLoadedArray: boolean
  
  // Navigation
  suggestedPaths: ZarrStoreSuggestedPath[]
  suggestionType: ZarrStoreSuggestionType
  
  // Actions
  loadStore: (url: string) => Promise<void>
  setSource: (url: string) => void
  navigateToSuggestion: (path: string) => void
  refreshCellposeData: () => Promise<void>
}
```

### Viewer2DDataContextType

**Source**: [`src/types/viewer2d-context.ts`](../../src/types/viewer2d-context.ts)

```typescript
interface Viewer2DDataContextType {
  // Frame state
  frameCenter: [number, number]
  frameSize: [number, number]
  frameZDepth: number
  setFrameCenter: (center: [number, number]) => void
  setFrameSize: (size: [number, number]) => void
  setFrameZDepth: (depth: number) => void
  getFrameBounds: () => FrameBounds
  
  // View state
  currentViewBounds: ViewBounds | null
  currentZSlice: number
  currentTimeSlice: number
  setViewBounds: (bounds: ViewBounds) => void
  setZSlice: (z: number) => void
  setTimeSlice: (t: number) => void
  
  // Navigation integration
  navigationState: NavigationState | null
  setNavigationState: (state: NavigationState) => void
  
  // Viv integration
  vivViewState: VivViewState | null
  setVivViewState: (state: VivViewState) => void
  
  // Data access
  frameBoundCellposeData: zarrita.Chunk<zarrita.DataType> | null
  isDataLoading: boolean
  dataError: string | null
}
```

## Data Types

### IMultiscaleInfo

**Source**: [`src/types/loader.ts`](../../src/types/loader.ts)

```typescript
interface IMultiscaleInfo {
  shape: Partial<Record<AxisKey, number>>
  dtype: DataType
  resolutions: string[]
  channels: string[]
}
```

Describes a multiscale zarr array with dimension information.

### NavigationState

**Source**: [`src/types/navigation.ts`](../../src/types/navigation.ts)

```typescript
interface NavigationState {
  xOffset: number
  yOffset: number
  zSlice: number
  timeSlice: number
  channelMap: ChannelMapping
  contrastLimits: ContrastLimits
}
```

Complete navigation state for the viewer.

### OME Metadata Types

**Source**: [`src/types/ome.ts`](../../src/types/ome.ts)

```typescript
// Core OME structures
interface OMEMultiscales {
  version?: string
  name?: string
  axes: OMEAxes[]
  datasets: OMEdataset[]
  coordinateTransformations?: OMECoordinateTransformation[]
}

interface OMEAxes {
  name: string
  type: 'time' | 'channel' | 'space' | string
  unit?: string
}

interface OMEdataset {
  path: string
  coordinateTransformations: OMECoordinateTransformation[]
}

// Complete OME attributes
interface OMEAttrs {
  multiscales?: OMEMultiscales[]
  omero?: OMEROMetadata
  plate?: OMEPlate
  well?: OMEWellMetadata
  'image-label'?: OMEImageLabel
  [key: string]: any
}
```

## Interaction Types

### Frame Interaction

**Source**: [`src/types/frame.ts`](../../src/types/frame.ts)

```typescript
type DragMode = 
  | 'none' 
  | 'move' 
  | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se'
  | 'resize-n' | 'resize-s' | 'resize-e' | 'resize-w'

interface FrameInteractionState {
  isDragging: boolean
  dragMode: DragMode
  startPos: [number, number]
  startFrameCenter: [number, number]
  startFrameSize: [number, number]
}

type FrameState = {
  center: [number, number]
  size: [number, number]
}
```

## Viewer Types

### Viv Integration

**Source**: [`src/types/viv-viewer.ts`](../../src/types/viv-viewer.ts)

```typescript
interface VivViewState {
  target: [number, number, number]
  zoom: number
  [key: string]: any
}

interface VivViewerState {
  vivLoaders: AltZarrPixelSource[]
  containerDimensions: { width: number; height: number }
  detailViewDrag: VivDetailViewState
  controlledDetailViewState: VivViewState | null
  isManuallyPanning: boolean
}

interface VivLayerProps {
  loader: AltZarrPixelSource[]
  selections: Record<string, number>[]
  colors: number[][]
  contrastLimits: [number, number][]
  channelsVisible: boolean[]
  frameOverlayLayers?: Layer[]
}
```

## Component Props

### Navigation Components

**Source**: [`src/types/components.ts`](../../src/types/components.ts)

```typescript
interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  valueDisplay?: string | ((value: number, max: number) => string)
  condition?: boolean
}

interface ChannelMapperProps {
  channelNames: string[]
  channelMap: ChannelMapping
  onChannelChange: (role: keyof ChannelMapping, value: number | null) => void
}

interface ContrastLimitsProps {
  contrastLimits: ContrastLimits
  maxContrastLimit: number
  onContrastLimitsChange: (limits: ContrastLimits) => void
}
```

## Store Types

### ZarrStore State Management

```typescript
enum ZarrStoreSuggestionType {
  PLATE_WELL = 'PLATE_WELL',
  NO_MULTISCALE = 'NO_MULTISCALE', 
  CELLPOSE = 'CELLPOSE',
  NO_OME = 'NO_OME'
}

interface ZarrStoreSuggestedPath {
  path: string
  isGroup: boolean
  hasOme: boolean
}

interface ZarrStoreState {
  store: FetchStore | null
  root: Location<FetchStore> | null
  omeData: OMEAttrs | null
  msInfo: IMultiscaleInfo | null
  cellposeArray: ZArray<FetchStore> | null
  isCellposeLoading: boolean
  cellposeError: string | null
  isLoading: boolean
  error: string | null
  infoMessage: string | null
  source: string
  hasLoadedArray: boolean
  suggestedPaths: ZarrStoreSuggestedPath[]
  suggestionType: ZarrStoreSuggestionType
}
```

## Usage Examples

### Type-Safe Component Development

```tsx
import type { 
  Viewer2DDataContextType, 
  NavigationState, 
  FrameInteractionState 
} from '../types/viewer2D'

function TypeSafeComponent() {
  const context: Viewer2DDataContextType = useViewer2DData()
  
  const [frameState, setFrameState] = useState<FrameInteractionState>({
    isDragging: false,
    dragMode: 'none',
    startPos: [0, 0],
    startFrameCenter: [0, 0],
    startFrameSize: [0, 0]
  })
  
  const handleNavigationChange = (newState: NavigationState) => {
    context.setNavigationState(newState)
  }
  
  return <div>{/* Component implementation */}</div>
}
```

### Custom Hook with Types

```tsx
import type { IMultiscaleInfo, ChannelMapping } from '../types/loader'

function useChannelManager(msInfo: IMultiscaleInfo | null) {
  const [channelMap, setChannelMap] = useState<ChannelMapping>({
    nucleus: null,
    cytoplasm: null
  })
  
  const updateChannelMapping = (
    role: keyof ChannelMapping, 
    channelIndex: number | null
  ) => {
    setChannelMap(prev => ({
      ...prev,
      [role]: channelIndex
    }))
  }
  
  return { channelMap, updateChannelMapping }
}
```

### OME Metadata Processing

```tsx
import type { OMEAttrs, OMEMultiscales } from '../types/ome'

function processOMEMetadata(attrs: OMEAttrs): IMultiscaleInfo | null {
  const multiscales: OMEMultiscales[] = attrs.multiscales || []
  
  if (multiscales.length === 0) {
    return null
  }
  
  const ms = multiscales[0]
  const shape: Partial<Record<AxisKey, number>> = {}
  
  // Process axes to build shape
  ms.axes.forEach((axis, index) => {
    if (axis.name in ['x', 'y', 'z', 't', 'c']) {
      shape[axis.name as AxisKey] = getAxisSize(axis, index)
    }
  })
  
  return {
    shape,
    dtype: inferDataType(attrs),
    resolutions: ms.datasets.map(d => d.path),
    channels: extractChannelNames(attrs)
  }
}
```

## Type Guards and Utilities

### Runtime Type Checking

```typescript
// Type guards for safe runtime checking
export function isValidNavigationState(obj: any): obj is NavigationState {
  return obj && 
    typeof obj.xOffset === 'number' &&
    typeof obj.yOffset === 'number' &&
    typeof obj.zSlice === 'number' &&
    typeof obj.timeSlice === 'number' &&
    isValidChannelMapping(obj.channelMap) &&
    isValidContrastLimits(obj.contrastLimits)
}

export function isValidChannelMapping(obj: any): obj is ChannelMapping {
  return obj &&
    (obj.nucleus === null || typeof obj.nucleus === 'number') &&
    (obj.cytoplasm === null || typeof obj.cytoplasm === 'number')
}

export function isValidFrameState(obj: any): obj is FrameState {
  return obj &&
    Array.isArray(obj.center) && obj.center.length === 2 &&
    Array.isArray(obj.size) && obj.size.length === 2 &&
    obj.center.every((n: any) => typeof n === 'number') &&
    obj.size.every((n: any) => typeof n === 'number')
}
```

### Type Utilities

```typescript
// Utility types for common patterns
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Frame bounds calculation
export type FrameBounds = {
  left: number
  right: number
  top: number
  bottom: number
}

export type ViewBounds = {
  x1: number
  y1: number
  x2: number
  y2: number
}

// Data extraction types
export type ExtractedFrameData = {
  data: zarrita.Chunk<zarrita.DataType>
  metadata: {
    center: [number, number]
    size: [number, number]
    bounds: FrameBounds
    extractedAt: string
  }
}
```

## Migration Guide

### From Legacy Types

If migrating from older versions:

```typescript
// Old approach
interface OldFrameState {
  x: number
  y: number
  width: number
  height: number
}

// New approach  
interface NewFrameState {
  center: [number, number]
  size: [number, number]
}

// Migration helper
function migrateFrameState(old: OldFrameState): NewFrameState {
  return {
    center: [old.x + old.width / 2, old.y + old.height / 2],
    size: [old.width, old.height]
  }
}
```

## Related Documentation

- [Context APIs](./contexts/) - Using types with React contexts
- [Component Props](./components.md) - Component-specific type usage
- [Frame Extraction](./guides/frame-extraction.md) - Data type handling
- [OME Specification](https://ngff.openmicroscopy.org/) - OME-Zarr standard reference
