'use client'

import { SliderProps } from '../../../types/crossviewer'

export default function Slider({
  label,
  value,
  min,
  max,
  onChange,
  valueDisplay,
  condition = true
}: SliderProps) {
  
  if (!condition) return null

  const getDisplayValue = () => {
    if (typeof valueDisplay === 'function') {
      return valueDisplay(value, max)
    }
    return valueDisplay || `${value}/${max}`
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>
          {label}:
        </label>
        <div style={{ fontSize: '11px', color: '#666' }}>
          {getDisplayValue()}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{ width: '100%', marginBottom: '5px' }}
      />
    </div>
  )
}
