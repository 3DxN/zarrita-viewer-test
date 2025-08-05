import type { VivView } from "@hms-dbmi/viv"
import type { Layer, View } from "deck.gl"
import type { AltZarrPixelSource } from "../ext/AltZarrPixelSource"
import type { IMultiscaleInfo } from "./loader"


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

export interface VivViewerState {
  vivLoaders: AltZarrPixelSource[]
  containerDimensions: { width: number; height: number }
  detailViewDrag: VivDetailViewState
  controlledDetailViewState: VivViewState | null
  isManuallyPanning: boolean
  detailViewStateRef: React.RefObject<VivViewState | null>
  containerRef: React.RefObject<HTMLDivElement | null>
}

export interface VivViewerComputed {
  selections: Record<string, number>[]
  colors: number[][]
  overview: {
    height: number
    width: number
    zoom: number
    backgroundColor: number[]
  }
  views: (VivView | View)[]
  viewStates: VivViewState[]
  layerProps: VivLayerProps[]
}

export interface VivLayerProps {
  loader: AltZarrPixelSource[];
  selections: Record<string, number>[];
  colors: number[][];
  contrastLimits: [number, number][];
  channelsVisible: boolean[];
  frameOverlayLayers?: Layer[]; // Optional for frame view
}

export interface VivViewerActions {
  setContainerDimensions: (dimensions: { width: number; height: number }) => void
  setDetailViewDrag: (drag: VivDetailViewState) => void
  setControlledDetailViewState: (state: VivViewState | null) => void
  setIsManuallyPanning: (panning: boolean) => void
  updateDimensions: () => void
  handleViewStateChange: ({ viewId, viewState }: {
    viewId: string
    viewState: VivViewState
    oldViewState: VivViewState
  }) => void
  createLayerProps: (frameOverlayLayers?: Layer[]) => VivLayerProps[]
}