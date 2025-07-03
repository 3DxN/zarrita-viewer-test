// Navigation state interface - holds current navigation values
export interface NavigationState {
  xOffset: number
  yOffset: number
  zSlice: number
  timeSlice: number
  currentChannel: number
}

// Navigation limits interface - holds maximum values and constraints
export interface NavigationLimits {
  maxXOffset: number
  maxYOffset: number
  maxZSlice: number
  maxTimeSlice: number
  numChannels: number
}

// Navigation handlers interface - holds all callback functions
export interface NavigationHandlers {
  onXOffsetChange: (value: number) => void
  onYOffsetChange: (value: number) => void
  onZSliceChange: (value: number) => void
  onTimeSliceChange: (value: number) => void
  onChannelChange: (value: number) => void
}

// ZarrLoader component props
export interface ZarrLoaderProps {
  onArrayLoaded: (array: any, arrayInfo: any) => void
  onError: (error: string) => void
  onLoadingChange: (loading: boolean) => void
}

// ZarrViewer component props
export interface ZarrViewerProps {
  currentArray: any
  arrayInfo: any
  navigationState: NavigationState
  loading: boolean
  onError: (error: string) => void
}

// NavigationControls component props
export interface NavigationControlsProps {
  arrayInfo: any
  navigationState: NavigationState
  navigationLimits: NavigationLimits
  navigationHandlers: NavigationHandlers
  channelNames?: string[]
  // Resolution control props
  availableResolutions?: string[]
  selectedResolution?: string
  onResolutionChange?: (resolution: string) => void
}

// NavigationSlider component props
export interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  valueDisplay?: string | ((value: number, max: number) => string)
  condition?: boolean
}