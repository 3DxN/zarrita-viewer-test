'use client'

import type { NavigationControlsProps } from '../../types/crossviewer'
import Slider from './Slider'

export default function NavigationControls({
  arrayInfo,
  navigationState,
  navigationLimits,
  navigationHandlers
}: NavigationControlsProps) {
  const { xOffset, yOffset, zSlice, timeSlice, currentChannel } = navigationState
  const { maxXOffset, maxYOffset, maxZSlice, maxTimeSlice, numChannels } = navigationLimits
  const { onXOffsetChange, onYOffsetChange, onZSliceChange, onTimeSliceChange, onChannelChange } = navigationHandlers

  return (
    <div style={{ 
      width: '320px',
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '5px',
      flexShrink: 0
    }}>
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
              Ch {i}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation sliders */}
      <div style={{ display: 'grid', gap: '15px', marginBottom: '5px' }}>
        <Slider
          label="X Offset"
          value={xOffset}
          min={0}
          max={maxXOffset}
          onChange={onXOffsetChange}
          valueDisplay={(value, max) => 
            `(${value}-${Math.min(value + 256, arrayInfo.shape[arrayInfo.shape.length - 1])})/${arrayInfo.shape[arrayInfo.shape.length - 1]}`
          }
        />

        <Slider
          label="Y Offset"
          value={yOffset}
          min={0}
          max={maxYOffset}
          onChange={onYOffsetChange}
          valueDisplay={(value, max) => 
            `(${value}-${Math.min(value + 256, arrayInfo.shape[arrayInfo.shape.length - 2])})/${arrayInfo.shape[arrayInfo.shape.length - 2]}`
          }
        />

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
    </div>
  )
}