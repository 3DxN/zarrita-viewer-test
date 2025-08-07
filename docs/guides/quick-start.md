# Quick Start Guide

Get your zarr viewer up and running in minutes with this step-by-step guide.

## Prerequisites

- Node.js 18+ and npm/yarn
- Modern browser with WebGL support
- Basic familiarity with React and TypeScript

## Installation

### 1. Clone and Setup

```bash
git clone https://github.com/3DxN/zarrita-viewer-test
cd zarrita-viewer-test
npm ci
```

### 2. Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` to see the viewer.

## Basic Usage

### 1. Load Your First Dataset

```tsx
// src/app/page.tsx
import { ZarrStoreProvider } from '../contexts/ZarrStoreContext'
import { Viewer2DDataProvider } from '../contexts/Viewer2DDataContext'
import Viewer2D from '../components/viewer2D'

export default function Page() {
  return (
    <ZarrStoreProvider initialSource="https://your-data-url.zarr">
      <Viewer2DDataProvider>
        <div style={{ height: '100vh' }}>
          <Viewer2D />
        </div>
      </Viewer2DDataProvider>
    </ZarrStoreProvider>
  )
}
```

### 2. Add Frame Controls

```tsx
import { useViewer2DData } from '../contexts/Viewer2DDataContext'

function SimpleFrameControls() {
  const { frameCenter, frameSize, setFrameCenter, setFrameSize } = useViewer2DData()
  
  return (
    <div>
      <h3>Frame Position: {frameCenter.join(', ')}</h3>
      <h3>Frame Size: {frameSize.join(' × ')}</h3>
      
      <button onClick={() => setFrameSize([200, 200])}>
        Small Frame
      </button>
      <button onClick={() => setFrameSize([400, 400])}>
        Large Frame
      </button>
    </div>
  )
}
```

### 3. Access Frame Data

```tsx
function DataDisplay() {
  const { frameBoundCellposeData, isDataLoading } = useViewer2DData()
  
  if (isDataLoading) return <div>Loading...</div>
  
  if (frameBoundCellposeData) {
    const cellCount = new Set(Array.from(frameBoundCellposeData.data)).size - 1
    return <div>Cells detected: {cellCount}</div>
  }
  
  return <div>No segmentation data</div>
}
```

## Troubleshooting

### Common Issues

**"No OME metadata found"**
- Ensure your zarr store has proper OME-Zarr metadata
- Check the URL is accessible and points to a zarr store
- Look for suggested navigation paths in the console

**"Failed to load data"**
- Verify CORS headers are set on your data server
- Check network connectivity
- Ensure zarr store structure is valid

**Poor performance with large frames**
- Reduce frame size or Z depth for better responsiveness
- Enable data caching in your deployment
- Consider using lower resolution for initial exploration