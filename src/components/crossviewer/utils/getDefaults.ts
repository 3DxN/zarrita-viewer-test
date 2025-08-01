import type { Array as ZarrArray, DataType } from 'zarrita';
import type { NavigationState, ChannelMapping } from '../../../types/crossviewer';


// Helper to get default contrast limits for dtype
export function getDefaultMaxContrastLimit(dtype: DataType): number {
  let max = 4095
  switch (dtype) {
    case 'uint8':
      max = 255;
      break;
    case 'uint16':
      max = 65535;
      break;
    case 'uint32':
      max = 4294967295;
      break;
    case 'float32':
    case 'float64':
      max = 1.0;
      break;
    default:
      max = 4095; // Default for other types
  }
  return max;
}

// Helper to get default channel map (role -> index)
export function getDefaultChannelMap(availableChannels: string[]): ChannelMapping {
  // Assign first two channels to nucleus/cytoplasm if available, else just index 0, 1
  return {
    nucleus: availableChannels[0] ? 0 : null,
    cytoplasm: availableChannels[1] ? 1 : null
  }
}

// Centralized navigation state initialization
export function getInitialNavigationState(arr: ZarrArray<DataType>, availableChannels: string[]): NavigationState {
  const numChannels = arr.shape.length >= 4
    ? (arr.shape.length === 5 ? arr.shape[1] : arr.shape[0])
    : 1
  const dtype = arr.dtype
  return {
    xOffset: 0,
    yOffset: 0,
    zSlice: arr.shape.length >= 3 ? Math.floor(arr.shape[arr.shape.length - 3] / 2) : 0,
    timeSlice: 0,
    contrastLimits: [getDefaultMaxContrastLimit(dtype), getDefaultMaxContrastLimit(dtype)],
    channelMap: getDefaultChannelMap(availableChannels)
  }
}