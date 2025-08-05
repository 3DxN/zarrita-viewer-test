/**
 * Component prop types for React components
 */

import type { Array, DataType } from "zarrita"
import type { IMultiscaleInfo } from "./loader"
import type { NavigationState, NavigationLimits, NavigationHandlers } from "./navigation"
import type { ChannelMapping, ContrastLimits } from "./core"

// Array loader component props
export interface ArrayLoaderProps {
  onArrayLoaded: (arr: Array<DataType>, arrayInfo: IMultiscaleInfo) => void
  onError: (error: string) => void
  onLoadingChange: (loading: boolean) => void
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

// Channel mapper component props
export interface ChannelMapperProps {
  channelNames: string[];
  channelMap: ChannelMapping;
  onChannelChange: (role: keyof ChannelMapping, value: number | null) => void;
}

// Contrast limits component props
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

// MacroViewer component props
export interface MacroViewerProps {
  height: number;
  width: number;
}
