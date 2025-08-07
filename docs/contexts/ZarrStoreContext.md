# ZarrStoreContext

**Source**: [`src/contexts/ZarrStoreContext.tsx`](../../src/contexts/ZarrStoreContext.tsx)

The ZarrStoreContext manages zarr store loading, OME metadata processing, and Cellpose segmentation detection. It serves as the foundation layer for all data access in the viewer.

## Overview

This context handles the complete lifecycle of zarr store management:

- **Store Loading**: Fetches and validates zarr stores from URLs
- **OME Processing**: Parses OME-Zarr metadata for multiscale information
- **Navigation Suggestions**: Provides intelligent path suggestions for complex stores
- **Cellpose Detection**: Automatically discovers segmentation data at `labels/Cellpose`
- **Error Handling**: Comprehensive error states and recovery mechanisms

## API Reference

### Hook Usage

```tsx
import { useZarrStore } from '../contexts/ZarrStoreContext'

function MyComponent() {
  const {
    // Store state
    store, root, msInfo, omeData,
    
    // Cellpose data
    cellposeArray, isCellposeLoading, cellposeError,
    
    // Loading state
    isLoading, error, hasLoadedArray,
    
    // Navigation
    suggestedPaths, suggestionType,
    
    // Actions
    loadStore, setSource, navigateToSuggestion, refreshCellposeData
  } = useZarrStore()
}
```

### State Properties

#### Core Store State

| Property | Type | Description |
|----------|------|-------------|
| `store` | `FetchStore \| null` | Current zarr store instance |
| `root` | `Location<FetchStore> \| null` | Root location within the store |
| `omeData` | `OMEAttrs \| null` | Complete OME metadata object |
| `msInfo` | `IMultiscaleInfo \| null` | Processed multiscale information |

#### Cellpose Integration

| Property | Type | Description |
|----------|------|-------------|
| `cellposeArray` | `ZArray<FetchStore> \| null` | Loaded Cellpose segmentation array |
| `isCellposeLoading` | `boolean` | Cellpose detection in progress |
| `cellposeError` | `string \| null` | Cellpose loading error message |

#### Navigation State

| Property | Type | Description |
|----------|------|-------------|
| `suggestedPaths` | `ZarrStoreSuggestedPath[]` | Available navigation options |
| `suggestionType` | `ZarrStoreSuggestionType` | Type of suggestions offered |
| `hasLoadedArray` | `boolean` | Whether multiscale data is ready |

### Actions

#### loadStore(url: string)

Loads a new zarr store from the provided URL.

```tsx
const { loadStore } = useZarrStore()

// Load from remote URL
await loadStore('https://example.com/data.zarr')

// Load from local development server
await loadStore('http://localhost:8000/local-data.zarr')
```

**Error Handling:**
- Invalid URLs result in `error` state
- Network failures are captured with detailed messages
- Malformed OME metadata triggers suggestion workflow

#### navigateToSuggestion(path: string)

Navigates to a suggested path within the current store.

```tsx
const { suggestedPaths, navigateToSuggestion } = useZarrStore()

// Navigate to first suggestion
if (suggestedPaths.length > 0) {
  await navigateToSuggestion(suggestedPaths[0].path)
}
```

#### refreshCellposeData()

Manually refresh Cellpose detection (automatically called when multiscale data loads).

```tsx
const { refreshCellposeData } = useZarrStore()

// Force refresh Cellpose detection
await refreshCellposeData()
```

## Implementation Details

### Cellpose Detection Strategy

The context automatically searches for Cellpose data at `labels/Cellpose` within the zarr store:

```typescript
// Searches for segmentation data in this order:
// 1. labels/Cellpose/0 (array)
// 2. labels/Cellpose (direct array)
// 3. labels/Cellpose/* (first available array)
```

### OME Metadata Processing

Supports multiple OME-Zarr structures:

- **Multiscales**: Standard OME-Zarr image pyramids
- **Plates/Wells**: High-content screening datasets
- **Image Labels**: Segmentation and annotation layers

### Suggestion System

When direct multiscale data isn't found, the context provides intelligent navigation:

```typescript
enum ZarrStoreSuggestionType {
  PLATE_WELL,      // HCS plate/well structure detected
  NO_MULTISCALE,   // OME present but no multiscales
  CELLPOSE,        // Cellpose-specific suggestions
  NO_OME          // No OME metadata found
}
```

## Usage Examples

### Basic Store Loading

```tsx
import { ZarrStoreProvider, useZarrStore } from '../contexts/ZarrStoreContext'

function StoreLoader() {
  const { loadStore, isLoading, error, hasLoadedArray } = useZarrStore()
  
  const handleLoad = async () => {
    try {
      await loadStore('https://example.com/data.zarr')
    } catch (err) {
      console.error('Failed to load store:', err)
    }
  }
  
  return (
    <div>
      <button onClick={handleLoad} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Load Store'}
      </button>
      {error && <div className="error">{error}</div>}
      {hasLoadedArray && <div>✅ Multiscale data ready!</div>}
    </div>
  )
}

function App() {
  return (
    <ZarrStoreProvider initialSource="">
      <StoreLoader />
    </ZarrStoreProvider>
  )
}
```

### Navigation with Suggestions

```tsx
function NavigationHelper() {
  const { 
    suggestedPaths, 
    suggestionType, 
    navigateToSuggestion,
    hasLoadedArray 
  } = useZarrStore()
  
  if (hasLoadedArray) {
    return <div>✅ Ready to view data</div>
  }
  
  if (suggestedPaths.length === 0) {
    return <div>No navigation options available</div>
  }
  
  return (
    <div>
      <h3>Suggested Paths ({suggestionType}):</h3>
      {suggestedPaths.map((suggestion, i) => (
        <button 
          key={i}
          onClick={() => navigateToSuggestion(suggestion.path)}
        >
          {suggestion.path} {suggestion.isGroup ? '📁' : '📄'}
        </button>
      ))}
    </div>
  )
}
```

### Cellpose Integration

```tsx
function CellposeStatus() {
  const { 
    cellposeArray, 
    isCellposeLoading, 
    cellposeError,
    refreshCellposeData 
  } = useZarrStore()
  
  return (
    <div>
      <h3>Cellpose Status</h3>
      {isCellposeLoading && <div>🔍 Detecting Cellpose data...</div>}
      {cellposeError && (
        <div className="error">
          ❌ Cellpose Error: {cellposeError}
          <button onClick={refreshCellposeData}>Retry</button>
        </div>
      )}
      {cellposeArray && (
        <div>
          ✅ Cellpose data found
          <br />Shape: {cellposeArray.shape.join(' × ')}
          <br />Type: {cellposeArray.dtype}
        </div>
      )}
    </div>
  )
}
```

## Error States and Recovery

The context provides detailed error information for common failure modes:

| Error Type | Trigger | Recovery |
|------------|---------|----------|
| Network Error | Connection failure | Retry with `loadStore()` |
| Invalid OME | Malformed metadata | Check `suggestedPaths` |
| Missing Multiscales | No image pyramid | Navigate to suggested paths |
| Cellpose Failure | Segmentation load error | Use `refreshCellposeData()` |

## Performance Considerations

- **Lazy Loading**: Cellpose detection only occurs after multiscale data loads
- **Caching**: Store metadata is cached for the session
- **Background Processing**: OME parsing doesn't block the UI
- **Error Boundaries**: Failed Cellpose loading doesn't affect main viewer

## Related Documentation

- [Viewer2DDataContext](./Viewer2DDataContext.md) - Frame-level data management
- [Type Definitions](../types.md) - Type reference for ZarrStore
