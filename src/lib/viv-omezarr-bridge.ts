import { ZarrPixelSource } from '@hms-dbmi/viv'

import { loadOmeZarrData } from './ome-zarr-loader'
import { AltZarrPixelSource } from '../ext/AltZarrPixelSource'
import type { VivCompatibleData, VivLoaderConfig } from '../types/viv'


/**
 * Create Viv-compatible ZarrPixelSource instances from OME-Zarr data
 */
export async function createVivLoader(config: VivLoaderConfig): Promise<VivCompatibleData> {
  console.log('🔗 VivOmeZarrBridge: Creating Viv loader for', config.source)
  
  try {
    // Load raw OME-Zarr data using our custom loader
    const sourceData = await loadOmeZarrData(config.source, {
      name: config.name,
      opacity: config.opacity,
      colormap: config.colormap
    })
    
    console.log('📊 VivOmeZarrBridge: Source data loaded:', sourceData)
    
    // Convert raw zarr arrays to AltZarrPixelSource instances
    const vivLoaders: AltZarrPixelSource[] = []
    
    for (const [index, loaderData] of sourceData.loader.entries()) {
      try {
        console.log(`🔍 VivOmeZarrBridge: Processing resolution level ${index}`)
        console.log('📊 Array dtype:', loaderData.data.dtype, 'shape:', loaderData.data.shape)
        console.log('🏷️ Original labels:', loaderData.labels)
        
        // Check and log dtype compatibility 
        const dtype = loaderData.data.dtype
        console.log('🔄 Checking dtype compatibility:', dtype)
        
        // Log supported dtypes for debugging
        const vivSupportedDtypes = ['<u1', '>u1', '|u1', '<u2', '>u2', '<f4', '>f4', 'uint8', 'uint16', 'float32']
        const isSupported = vivSupportedDtypes.some(supported => dtype.includes(supported.replace(/[<>|]/g, '')))
        console.log('🎯 Dtype supported by Viv:', isSupported, 'Raw dtype:', dtype)
        
        // Create Viv-compatible labels
        const vivLabels = createVivCompatibleLabels(loaderData.labels)
        console.log('🏷️ Viv labels:', vivLabels)
        
        // Create AltZarrPixelSource with proper configuration and robust dtype handling
        const pixelSource = new AltZarrPixelSource(
          loaderData.data, 
          {
            labels: vivLabels as any, // Type assertion needed for Viv's complex label typing
            tileSize: config.tileSize || loaderData.tileSize || 512
          }
        )
        
        vivLoaders.push(pixelSource)
        console.log(`✅ VivOmeZarrBridge: Created AltZarrPixelSource for resolution level ${index}`)
      } catch (error) {
        console.error(`❌ VivOmeZarrBridge: Failed to create AltZarrPixelSource for level ${index}:`, error)
        throw error
      }
    }
    
    return {
      loader: vivLoaders,
      metadata: {
        axis_labels: sourceData.axis_labels,
        model_matrix: sourceData.model_matrix,
        channels: sourceData.channels,
        domains: sourceData.domains,
        defaults: sourceData.defaults,
        name: sourceData.name
      }
    }
    
  } catch (error) {
    console.error('❌ VivOmeZarrBridge: Failed to create Viv loader:', error)
    throw error
  }
}

export async function createVivPixelSources(
  source: string, 
  options: { tileSize?: number } = {}
): Promise<(ZarrPixelSource<string[]> | AltZarrPixelSource)[]> {
  const vivData = await createVivLoader({ 
    source, 
    tileSize: options.tileSize 
  })
  return vivData.loader
}

export async function getOmeZarrMetadata(source: string) {
  const sourceData = await loadOmeZarrData(source)
  return {
    name: sourceData.name,
    channels: sourceData.channels,
    domains: sourceData.domains,
    axis_labels: sourceData.axis_labels,
    defaults: sourceData.defaults
  }
}


export function createVivSelection(
  channelIndex: number = 0,
  timeIndex: number = 0,
  zIndex: number = 0
): Record<string, number> {
  return {
    c: channelIndex,
    t: timeIndex,
    z: zIndex
  }
}


export function channelToVivColor(channel: any): [number, number, number] {
  if (channel.color && Array.isArray(channel.color)) {
    return [channel.color[0] || 255, channel.color[1] || 255, channel.color[2] || 255]
  }
  
  // Default colors for common channel patterns
  const defaultColors: Record<string, [number, number, number]> = {
    red: [255, 0, 0],
    green: [0, 255, 0],
    blue: [0, 0, 255],
    cyan: [0, 255, 255],
    magenta: [255, 0, 255],
    yellow: [255, 255, 0],
    white: [255, 255, 255]
  }
  
  const label = channel.label?.toLowerCase() || ''
  for (const [colorName, rgb] of Object.entries(defaultColors)) {
    if (label.includes(colorName)) {
      return rgb
    }
  }
  
  // Default to white if no match
  return [255, 255, 255]
}

export function channelToContrastLimits(channel: any): [number, number] {
  if (channel.window && Array.isArray(channel.window) && channel.window.length >= 2) {
    return [channel.window[0], channel.window[1]]
  }
  
  // Default contrast range if not specified
  return [0, 65535]
}

function createVivCompatibleLabels(omeLabels: string[]): string[] {
  // Map common OME axis names to Viv expected format
  const labelMap: Record<string, string> = {
    'x': 'x',
    'y': 'y', 
    'c': 'c',
    'channel': 'c',
    'z': 'z',
    't': 't',
    'time': 't'
  }
  
  return omeLabels.map(label => labelMap[label.toLowerCase()] || label)
}
