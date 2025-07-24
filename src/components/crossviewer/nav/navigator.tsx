'use client'

import { useState } from 'react'
import type { NavigationControlsProps } from '../../../types/crossviewer'
import Slider from './Slider'

export default function NavigationControls({
  arrayInfo,
  navigationState,
  navigationLimits,
  navigationHandlers,
  channelNames
}: NavigationControlsProps) {
  const { xOffset, yOffset, zSlice, timeSlice, currentChannel, contrastLimits } = navigationState
  const { maxZSlice, maxTimeSlice, numChannels } = navigationLimits
  const { onZSliceChange, onTimeSliceChange, onChannelChange, onContrastLimitsChange } = navigationHandlers
  
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Function to get channel display name
  const getChannelName = (index: number) => {
    if (channelNames && channelNames[index]) {
      return channelNames[index]
    }
    return `Ch ${index}`
  }

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
            

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                Channels:
              </label>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {Array.from({ length: numChannels }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => onChannelChange(i)}
                    style={{
                      backgroundColor: currentChannel === i ? '#28a745' : '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {getChannelName(i)}
                  </button>
                ))}
              </div>
            </div>

            {/* Contrast Limit Selectors */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                Contrast Limits:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Array.from({ length: numChannels }, (_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', minWidth: 40 }}>{getChannelName(i)}</span>
                    <input
                      type="number"
                      value={typeof contrastLimits?.[i]?.[0] === 'number' ? contrastLimits[i][0] : 0}
                      min={0}
                      style={{ width: 60, fontSize: '12px', padding: '2px 4px' }}
                      onChange={e => {
                        const val = Number(e.target.value);
                        const newLimits = contrastLimits ? contrastLimits.map(cl => (Array.isArray(cl) && cl.length === 2 ? [cl[0], cl[1]] : [0, 0])) : [];
                        if (!newLimits[i]) newLimits[i] = [0, 0];
                        newLimits[i][0] = isNaN(val) ? 0 : val;
                        onContrastLimitsChange?.(newLimits as [number, number][]);
                      }}
                      placeholder="Min"
                    />
                    <span style={{ fontSize: '12px' }}>–</span>
                    <input
                      type="number"
                      value={
                        (console.log('Contrast limits:', contrastLimits), typeof contrastLimits?.[i]?.[1] === 'number') ? contrastLimits[i][1] : 65535}
                      min={0}
                      style={{ width: 60, fontSize: '12px', padding: '2px 4px' }}
                      onChange={e => {
                        const val = Number(e.target.value);
                        const newLimits = contrastLimits ? contrastLimits.map(cl => (Array.isArray(cl) && cl.length === 2 ? [cl[0], cl[1]] : [0, 0])) : [];
                        if (!newLimits[i]) newLimits[i] = [0, 0];
                        newLimits[i][1] = isNaN(val) ? 65535 : val;
                        onContrastLimitsChange?.(newLimits as [number, number][]);
                      }}
                      placeholder="Max"
                    />
                  </div>
                ))}
              </div>
            </div>

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
                <div>X: {xOffset} - {Math.min(xOffset + 256, arrayInfo.shape[arrayInfo.shape.length - 1])}</div>
                <div>Y: {yOffset} - {Math.min(yOffset + 256, arrayInfo.shape[arrayInfo.shape.length - 2])}</div>
                <div style={{ marginTop: '5px', fontSize: '11px', color: '#6c757d' }}>
                  Total: {arrayInfo.shape[arrayInfo.shape.length - 1]} × {arrayInfo.shape[arrayInfo.shape.length - 2]}
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
            {/* Collapsed channel indicator */}
            <div 
              style={{ 
                width: '30px', 
                height: '30px', 
                borderRadius: '50%',
                backgroundColor: '#28a745',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold'
              }}
              title={`Channel ${currentChannel}`}
            >
              C{currentChannel}
            </div>
            
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