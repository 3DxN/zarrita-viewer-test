import { IMultiscaleInfo } from "./loader"

// Navigation state interface - holds current navigation values
export interface NavigationState {
  xOffset: number
  yOffset: number
  zSlice: number
  timeSlice: number
  channelMap: ChannelMapping
  contrastLimits: ContrastLimits;
}

// Navigation limits interface - holds maximum values and constraints
export interface NavigationLimits {
  maxXOffset: number
  maxYOffset: number
  maxZSlice: number
  maxTimeSlice: number
  numChannels: number
  maxContrastLimit: number;
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
  msInfo: IMultiscaleInfo
  navigationState: NavigationState
  navigationLimits: NavigationLimits
  navigationHandlers: NavigationHandlers
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

export interface ChannelMapperProps {
  channelNames: string[];
  channelMap: ChannelMapping;
  onChannelChange: (role: keyof ChannelMapping, value: number | null) => void;
}

export interface ChannelMapping {
  nucleus: number | null; // Channel index for nucleus, null if not selected
  cytoplasm: number | null; // Channel index for cytoplasm, null if not selected
}

export interface ContrastLimitsProps {
  /**
   * Current contrast limit for each channel
   */
  contrastLimits: ContrastLimits;
  /**
   * Maximum contrast limit (for all channels)
   */
  maxContrastLimit: number;
  /**
   * Callback when contrast limits change
   */
  onContrastLimitsChange: (limits: ContrastLimits) => void;
}

export type ContrastLimits = [number | null, number | null];

export interface VivViewState {
  target: [number, number, number];
  zoom: number;
  [key: string]: any; // Viv may add more properties
}

export interface VivDetailViewState {
  isDragging: boolean,
  startPos: [number, number],
  startTarget: [number, number, number] // [x, y, zoom]
}