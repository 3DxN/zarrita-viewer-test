# Zarr Viewer Documentation

A Next.js-based interactive viewer for OME-Zarr datasets with real-time frame extraction and Cellpose segmentation visualization.

## Overview

This project provides a comprehensive 2D/3D viewer for OME-Zarr microscopy data with the following key features:

- **Real-time Frame Extraction**: Interactive frame selection with live data slicing from zarr arrays
- **Cellpose Integration**: Automatic detection and visualization of Cellpose segmentation data
- **Multi-resolution Support**: Seamless navigation across different resolution levels
- **Interactive Frame Manipulation**: Drag-and-drop frame positioning with resize handles
- **Performance Optimization**: React-Query based caching and efficient data loading

## Architecture

The viewer is built around three main contexts that provide unified state management:

1. **[ZarrStoreContext](./contexts/ZarrStoreContext.md)** - Manages zarr store loading and OME metadata
2. **[Viewer2DDataContext](./contexts/Viewer2DDataContext.md)** - Handles frame state and data extraction
3. **Component Layer** - Interactive UI components for visualization and control

## Quick Start

```tsx
import { ZarrStoreProvider } from './contexts/ZarrStoreContext'
import { Viewer2DDataProvider } from './contexts/Viewer2DDataContext'
import Viewer2D from './components/viewer2D'

function App() {
  return (
    <ZarrStoreProvider initialSource="https://example.com/data.zarr">
      <Viewer2DDataProvider>
        <Viewer2D />
      </Viewer2DDataProvider>
    </ZarrStoreProvider>
  )
}
```

## Documentation Structure

### Core Systems
- [Contexts](./contexts/) - State management and data flow
- [Components](./components.md) - UI components and viewers
- [Types](./types.md) - TypeScript type definitions
- [Hooks](./hooks.md) - Reusable logic and state management
- [Utils](./utils.md) - Utility functions and helpers

### Integration Guides
- [Frame Extraction API](./guides/frame-extraction.md) - Working with frame-bound data


## Core Concepts

### Frame-Based Data Extraction

The viewer's primary innovation is real-time frame extraction from large zarr arrays:

```tsx
const { frameBoundCellposeData, frameCenter, frameSize } = useViewer2DData()

// Frame automatically updates when user moves/resizes the selection
// Data is cached and only re-fetched when frame parameters change
```

### Multi-Context Architecture

State is organized across specialized contexts:

- **Store-level**: Zarr loading, OME metadata, Cellpose detection
- **Viewer-level**: Frame coordinates, view state, navigation
- **Component-level**: UI interactions, event handling

### Performance Strategy

- Minimal re-renders through optimized dependency management
- Efficient zarr slicing with proper dimension handling
- Background Cellpose detection without blocking main viewer

## Getting Started

See the [Quick Start Guide](./guides/quick-start.md) for detailed setup instructions and your first viewer implementation.
