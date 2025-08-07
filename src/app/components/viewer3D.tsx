'use client'

import React from 'react'
import { useViewer2DData } from '../../contexts/Viewer2DDataContext'

export default function Viewer3D() {
  const {
    frameCenter,
    frameSize,
    setFrameCenter,
    setFrameSize,
    getFrameBounds,
    currentZSlice,
    currentTimeSlice,
    setZSlice,
    setTimeSlice,
    frameBoundArray,
    frameBoundCellposeData,
    isDataLoading,
    dataError
  } = useViewer2DData()

  // Test functions for frame manipulation
  const moveFrameRandomly = () => {
    const newX = frameCenter[0] + (Math.random() - 0.5) * 200
    const newY = frameCenter[1] + (Math.random() - 0.5) * 200
    setFrameCenter([newX, newY])
  }

  const resizeFrameRandomly = () => {
    const newWidth = Math.max(100, frameSize[0] + (Math.random() - 0.5) * 200)
    const newHeight = Math.max(100, frameSize[1] + (Math.random() - 0.5) * 200)
    setFrameSize([newWidth, newHeight])
  }

  const resetFrame = () => {
    setFrameCenter([500, 500])
    setFrameSize([400, 400])
  }

  const bounds = getFrameBounds()

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      height: '100%',
      overflow: 'auto'
    }}>
      <h2 style={{ marginTop: 0, color: '#333' }}>🧪 3D Viewer Test Lab</h2>
      
      {/* Frame Controls */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: 'white', 
        borderRadius: '6px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0, color: '#007bff' }}>Frame Controls</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '15px' }}>
          <div>
            <strong>Center:</strong> [{frameCenter[0].toFixed(1)}, {frameCenter[1].toFixed(1)}]
          </div>
          <div>
            <strong>Size:</strong> [{frameSize[0].toFixed(1)} × {frameSize[1].toFixed(1)}]
          </div>
          <div>
            <strong>Z Slice:</strong> {currentZSlice}
          </div>
          <div>
            <strong>Time:</strong> {currentTimeSlice}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={moveFrameRandomly}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🎲 Random Move
          </button>
          <button 
            onClick={resizeFrameRandomly}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#ffc107', 
              color: 'black', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📏 Random Resize
          </button>
          <button 
            onClick={resetFrame}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Reset Frame
          </button>
        </div>
      </div>

      {/* Frame Bounds Info */}
      <div style={{ 
        padding: '15px', 
        backgroundColor: 'white', 
        marginBottom: '20px',
        borderRadius: '6px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0, color: '#007bff' }}>Frame Bounds</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          <div><strong>Left:</strong> {bounds.left.toFixed(1)}</div>
          <div><strong>Right:</strong> {bounds.right.toFixed(1)}</div>
          <div><strong>Top:</strong> {bounds.top.toFixed(1)}</div>
          <div><strong>Bottom:</strong> {bounds.bottom.toFixed(1)}</div>
        </div>
        
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#6c757d' }}>
          <strong>Area:</strong> {((bounds.right - bounds.left) * (bounds.bottom - bounds.top)).toFixed(1)} pixels²
        </div>
      </div>

      {/* Z/T Slice Controls */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: 'white', 
        borderRadius: '6px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0, color: '#007bff' }}>Slice Controls</h3>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label><strong>Z:</strong></label>
            <input 
              type="number" 
              value={currentZSlice} 
              onChange={(e) => setZSlice(parseInt(e.target.value) || 0)}
              min="0"
              max="10"
              style={{ 
                width: '80px', 
                padding: '4px 8px', 
                border: '1px solid #ccc', 
                borderRadius: '4px' 
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label><strong>Time:</strong></label>
            <input 
              type="number" 
              value={currentTimeSlice} 
              onChange={(e) => setTimeSlice(parseInt(e.target.value) || 0)}
              min="0"
              max="10"
              style={{ 
                width: '80px', 
                padding: '4px 8px', 
                border: '1px solid #ccc', 
                borderRadius: '4px' 
              }}
            />
          </div>
        </div>
      </div>

      {/* Auto-Updated Data Display */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: 'white', 
        borderRadius: '6px',
        border: '1px solid #ddd'
      }}>
        <h3 style={{ marginTop: 0, color: '#007bff' }}>Auto-Updated Frame Data</h3>
        
        {isDataLoading && (
          <div style={{ color: '#007bff', marginBottom: '10px' }}>
            🔄 Loading frame-bound data...
          </div>
        )}

        {dataError && (
          <div style={{ color: '#dc3545', marginBottom: '10px' }}>
            ❌ {dataError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          <div>
            <h4 style={{ marginTop: 0, color: '#17a2b8' }}>Main Array Data</h4>
            {frameBoundArray ? (
              <div style={{ fontSize: '14px', fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                <div><strong>Shape:</strong> {JSON.stringify(frameBoundArray.shape)}</div>
                <div><strong>Data type:</strong> {frameBoundArray.data.constructor.name}</div>
                <div><strong>Size:</strong> {frameBoundArray.data.length.toLocaleString()} elements</div>
                {(() => {
                  const dataArray = Array.from(frameBoundArray.data as ArrayLike<number>)
                  return (
                    <>
                      <div>Hello</div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div style={{ color: '#6c757d' }}>No main data loaded yet</div>
            )}
          </div>

          <div>
            <h4 style={{ marginTop: 0, color: '#28a745' }}>Cellpose Data</h4>
            {frameBoundCellposeData ? (
              <div style={{ fontSize: '14px', fontFamily: 'monospace', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                <div><strong>Shape:</strong> {JSON.stringify(frameBoundCellposeData.shape)}</div>
                <div><strong>Data type:</strong> {frameBoundCellposeData.data.constructor.name}</div>
                <div><strong>Size:</strong> {frameBoundCellposeData.data.length.toLocaleString()} elements</div>
                {(() => {
                  const dataArray = Array.from(frameBoundCellposeData.data as ArrayLike<number>)
                  const uniqueValues = new Set(dataArray)
                  return (
                    <>
                      <div><strong>Unique values:</strong> {uniqueValues.size} labels</div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div style={{ color: '#6c757d' }}>No Cellpose data loaded yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

