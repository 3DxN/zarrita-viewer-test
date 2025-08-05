import React from 'react'
import { VivViewer } from '@hms-dbmi/viv'

import { useZarrStore } from '../../../contexts/ZarrStoreContext'
import { useFrameState } from '../../../contexts/FrameStateContext'
import { useFrameInteraction } from '../../../hooks/useFrameInteraction'
import useVivViewer from '../../../hooks/useVivViewer'
import { useFrameInitialization } from '../../../hooks/useFrameInitialization'

import type { NavigationState } from '../../../types/crossviewer'
import type { IMultiscaleInfo } from '../../../types/loader'


const VivViewerWrapper: React.FC<{
  msInfo: IMultiscaleInfo
  navigationState: NavigationState
}> = ({
  msInfo,
  navigationState,
}) => {
  const { root } = useZarrStore()
  const { frameCenter, frameSize, setFrameCenter, setFrameSize } = useFrameState()
  
  // Use the comprehensive Viv viewer hook first 
  const {
    vivLoaders,
    containerDimensions,
    detailViewDrag,
    controlledDetailViewState,
    detailViewStateRef,
    containerRef,
    views,
    viewStates,
    setDetailViewDrag,
    setControlledDetailViewState,
    setIsManuallyPanning,
    handleViewStateChange,
    createLayerProps
  } = useVivViewer(msInfo, navigationState, root)
  
  // Use frame interaction hook with proper refs
  const {
    handleHover,
    getCursor,
    frameOverlayLayers,
    onDragStart,
    onDrag,
    onDragEnd,
    onClick
  } = useFrameInteraction(
    frameCenter, 
    frameSize, 
    setFrameCenter, 
    setFrameSize, 
    msInfo,
    detailViewStateRef,
    setIsManuallyPanning,
    setDetailViewDrag,
    detailViewDrag,
    setControlledDetailViewState,
  )

  // Generate final layer props with frame overlays
  const finalLayerProps = createLayerProps(frameOverlayLayers)

  // Initialize frame when data is loaded
  useFrameInitialization(
    msInfo,
    vivLoaders,
    containerDimensions,
    controlledDetailViewState,
    setFrameCenter,
    setFrameSize,
    setControlledDetailViewState,
    detailViewStateRef
  )

  // Loading state
  if (!msInfo || vivLoaders.length === 0 || views.length === 0) {
    return (
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '400px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f9f9f9'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>No data loaded</div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Load a Zarr array to begin viewing</div>
        </div>
      </div>
    )
  }

  // Main viewer render
  return (
    <div 
      ref={containerRef}
      className="viv-viewer-container"
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px',
        position: 'relative',
        overflow: 'hidden'
      }}
      tabIndex={0}
    >
      <VivViewer
        views={views}
        layerProps={finalLayerProps}
        viewStates={viewStates}
        // @ts-expect-error Incomplete viv type definitions
        onViewStateChange={handleViewStateChange}
        deckProps={{
          style: { backgroundColor: 'black' },
          controller: {
            dragPan: true,
            scrollZoom: true,
            doubleClickZoom: true,
            touchZoom: true,
            dragRotate: false,
            touchRotate: false,
            keyboard: true
          },
          pickingRadius: 15,
          onDragStart,
          onDrag,
          onDragEnd,
          onClick,
          onHover: handleHover,
          getCursor
        }}
      />
    </div>
  )
}

export default VivViewerWrapper;