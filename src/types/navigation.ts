/**
 * Navigation state, limits, and handler types for zarr viewer navigation
 */

import type { ChannelMapping, ContrastLimits } from './core'

// Navigation state interface - holds current navigation values
export interface NavigationState {
  xOffset: number
  yOffset: number
  zSlice: number
  timeSlice: number
  channelMap: ChannelMapping
  contrastLimits: ContrastLimits
}

// Navigation limits interface - holds maximum values and constraints
export interface NavigationLimits {
  maxXOffset: number
  maxYOffset: number
  maxZSlice: number
  maxTimeSlice: number
  numChannels: number
  maxContrastLimit: number
}

// Navigation handlers interface - holds all callback functions
export interface NavigationHandlers {
  onXOffsetChange: (value: number) => void
  onYOffsetChange: (value: number) => void
  onZSliceChange: (value: number) => void
  onTimeSliceChange: (value: number) => void
  onChannelChange: (role: keyof ChannelMapping, value: number | null) => void
  onContrastLimitsChange: (limits: ContrastLimits) => void
}
