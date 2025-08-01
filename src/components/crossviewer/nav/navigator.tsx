'use client'

import { useState } from 'react'
import type { NavigationControlsProps } from '../../../types/crossviewer'
import Slider from './Slider'
import ChannelSelector from './ChannelSelector'
import ContrastLimitsSelector from './ContrastLimitsSelector'

export default function NavigationControls({
  arrayInfo,
  navigationState,
  navigationLimits,
  navigationHandlers,
  channelNames
}: NavigationControlsProps) {
  const { zSlice, timeSlice, channelMap, contrastLimits } = navigationState
  const { maxZSlice, maxTimeSlice, maxContrastLimit } = navigationLimits
  const { onZSliceChange, onTimeSliceChange, onChannelChange, onContrastLimitsChange } = navigationHandlers
  
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div 
      className="navigation-sidebar"
      style={{ 
        width: isCollapsed ? '50px' : '320px',
        backgroundColor: '#f8f9fa',
        borderLeft: '1px solid #dee2e6',
        position: 'relative',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          position: 'absolute',
          top: '10px',
          left: isCollapsed ? '10px' : '280px',
          zIndex: 10,
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          border: '1px solid #dee2e6',
          backgroundColor: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#6c757d',
          transition: 'left 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? '←' : '→'}
      </button>

      {/* Sidebar Content */}
      <div 
        style={{ 
          padding: isCollapsed ? '10px 5px' : '15px',
          overflow: 'hidden',
          flex: 1,
          paddingTop: '50px' // Space for collapse button
        }}
      >
        {!isCollapsed && (
          <>
            <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>
              Navigation Controls
            </h4>

            <ChannelSelector
              channelNames={channelNames}
              channelMap={channelMap}
              onChannelChange={onChannelChange}
            />

            <ContrastLimitsSelector
              contrastLimitsProps={{
                contrastLimits,
                maxContrastLimit,
                onContrastLimitsChange
              }}
              channelMap={channelMap}
            />

            {/* Current Coordinates Display */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                Current View:
              </label>
              <div style={{ 
                padding: '10px', 
                backgroundColor: '#e9ecef', 
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                <div style={{ marginTop: '5px', fontSize: '11px', color: '#6c757d' }}>
                  Total: {arrayInfo.shape[arrayInfo.shape.length - 1]} x {arrayInfo.shape[arrayInfo.shape.length - 2]}
                </div>
              </div>
            </div>

            {/* Navigation sliders */}
            <div style={{ display: 'grid', gap: '15px', marginBottom: '5px' }}>
              <Slider
                label="Z Slice"
                value={zSlice}
                min={0}
                max={maxZSlice}
                onChange={onZSliceChange}
                condition={arrayInfo.shape.length >= 3}
              />

              <Slider
                label="Time"
                value={timeSlice}
                min={0}
                max={maxTimeSlice}
                onChange={onTimeSliceChange}
                condition={arrayInfo.shape.length >= 4 && maxTimeSlice > 0}
              />
            </div>
          </>
        )}

        {/* Collapsed State - Show minimal controls */}
        {isCollapsed && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px',
            alignItems: 'center'
          }}>
            
            {/* Collapsed Z slice indicator */}
            {arrayInfo.shape.length >= 3 && (
              <div 
                style={{ 
                  width: '30px', 
                  height: '30px', 
                  borderRadius: '50%',
                  backgroundColor: '#007bff',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
                title={`Z Slice ${zSlice}`}
              >
                Z{zSlice}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}