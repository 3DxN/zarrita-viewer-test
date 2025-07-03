import * as zarrita from 'zarrita'

import * as utils from '../utils/ome-utils'
import type { 
  ImageLayerConfig, 
  VivSourceData, 
  OmeZarrAttrs,
  OmePlate,
  OmeWell,
  OmeMultiscale,
  OmeroMetadata
} from '../types/ome'
import { ZarrStoreSuggestionType } from '../types/store'

/**
 * Custom OME-Zarr Data Pipeline for Viv
 * Loads OME-Zarr data and prepares it for visualization
 */

export class OmeZarrLoader {
  private source: string
  private config: ImageLayerConfig

  constructor(source: string, config: Partial<ImageLayerConfig> = {}) {
    this.source = source
    this.config = {
      source,
      name: config.name || 'OME-Zarr Data',
      opacity: config.opacity || 1,
      colormap: config.colormap || '',
      ...config
    }
  }

  /**
   * Main loading function - determines data type and loads appropriately
   */
  async load(): Promise<VivSourceData> {
    try {
      console.log(`🔍 OmeZarrLoader: Loading from ${this.source}`)
      
      const node = await utils.open(this.source)
      
      if (!(node instanceof zarrita.Group)) {
        throw new Error('Expected zarr Group at root level')
      }

      const attrs = (node.attrs.ome ?? node.attrs) as OmeZarrAttrs
      console.log('📊 OmeZarrLoader: Root attributes:', attrs)

      // Route to appropriate loader based on metadata
      if (utils.isOmePlate(attrs)) {
        console.log('🧪 OmeZarrLoader: Detected plate structure')
        return this.loadPlate(node, attrs.plate!)
      }

      if (utils.isOmeWell(attrs)) {
        console.log('🔬 OmeZarrLoader: Detected well structure') 
        return this.loadWell(node, attrs.well!)
      }

      if (utils.isOmeMultiscales(attrs)) {
        console.log('📈 OmeZarrLoader: Detected multiscales structure')
        return this.loadOmeMultiscales(node, attrs)
      }

      throw new Error('No supported OME-Zarr structure found in metadata')

    } catch (error) {
      console.error('❌ OmeZarrLoader: Failed to load data:', error)
      throw error
    }
  }

  /**
   * Load OME-Zarr multiscales data (most common case)
   */
  private async loadOmeMultiscales(
    grp: zarrita.Group<zarrita.Readable>,
    attrs: { multiscales: OmeMultiscale[], omero?: OmeroMetadata }
  ): Promise<VivSourceData> {
    const { name, opacity = 1, colormap = '' } = this.config

    // Load multiscale arrays
    const data = await utils.loadMultiscales(grp, attrs.multiscales)
    console.log(`📊 Loaded ${data.length} resolution levels`)

    // Extract metadata
    const axes = utils.getNgffAxes(attrs.multiscales)
    const axis_labels = utils.getNgffAxisLabels(axes)
    const meta = utils.parseOmeroMeta(attrs.omero, axes)
    
    // Create tile size hint
    const tileSize = utils.guessTileSize(data[0])
    console.log(`🔲 Using tile size: ${tileSize}x${tileSize}`)

    // Store arrays directly for now (ZarrPixelSource creation will be handled by the consumer)
    const loader = data.map((arr, index) => ({
      data: arr,
      labels: axis_labels,
      tileSize,
      index
    }))

    return {
      loader,
      axis_labels: meta.axis_labels,
      model_matrix: this.config.model_matrix 
        ? utils.parseMatrix(this.config.model_matrix)
        : utils.coordinateTransformationsToMatrix(attrs.multiscales),
      defaults: {
        selection: meta.defaultSelection,
        colormap,
        opacity,
      },
      channels: meta.channels,
      domains: meta.domains,
      name: meta.name || name || 'OME-Zarr Data',
      labels: [], // Labels loading simplified for now
    }
  }

  /**
   * Load OME-Zarr plate data
   */
  private async loadPlate(
    grp: zarrita.Group<zarrita.Readable>,
    plateAttrs: OmePlate
  ): Promise<VivSourceData> {
    // For now, load the first well as an example
    const firstWell = plateAttrs.wells[0]
    if (!firstWell) {
      throw new Error('No wells found in plate')
    }

    console.log(`🧪 Loading first well from plate: ${firstWell.path}`)
    const wellGroup = grp.resolve(firstWell.path)
    const wellNode = await zarrita.open(wellGroup)
    
    if (!(wellNode instanceof zarrita.Group)) {
      throw new Error(`Expected Group at well path ${firstWell.path}`)
    }

    const wellAttrs = wellNode.attrs as { well?: OmeWell }
    if (!wellAttrs.well) {
      throw new Error('Well metadata not found')
    }

    return this.loadWell(wellNode, wellAttrs.well)
  }

  /**
   * Load OME-Zarr well data
   */
  private async loadWell(
    grp: zarrita.Group<zarrita.Readable>,
    wellAttrs: OmeWell
  ): Promise<VivSourceData> {
    // Load the first image from the well
    const firstImage = wellAttrs.images[0]
    if (!firstImage) {
      throw new Error('No images found in well')
    }

    console.log(`🔬 Loading first image from well: ${firstImage.path}`)
    const imageGroup = grp.resolve(firstImage.path)
    const imageNode = await zarrita.open(imageGroup)
    
    if (!(imageNode instanceof zarrita.Group)) {
      throw new Error(`Expected Group at image path ${firstImage.path}`)
    }

    const imageAttrs = imageNode.attrs as { multiscales?: OmeMultiscale[], omero?: OmeroMetadata }
    if (!imageAttrs.multiscales) {
      throw new Error('Multiscales metadata not found in image')
    }

    return this.loadOmeMultiscales(imageNode, {
      multiscales: imageAttrs.multiscales,
      omero: imageAttrs.omero
    })
  }
}

/**
 * Convenience function to create a loader and load data
 */
export async function loadOmeZarrData(
  source: string, 
  config?: Partial<ImageLayerConfig>
): Promise<VivSourceData> {
  const loader = new OmeZarrLoader(source, config)
  return loader.load()
}

/**
 * Simple function to check if a URL contains OME-Zarr data
 */
export async function probeOmeZarrSource(source: string): Promise<{
  isValid: boolean
  type?: ZarrStoreSuggestionType
  error?: string
}> {
  try {
    const node = await utils.open(source)
    
    if (!(node instanceof zarrita.Group)) {
      return { isValid: false, error: 'Not a zarr Group' }
    }

    const attrs = node.attrs as OmeZarrAttrs

    if (utils.isOmePlate(attrs)) {
      return { isValid: true, type: ZarrStoreSuggestionType.PLATE }
    }

    if (utils.isOmeWell(attrs)) {
      return { isValid: true, type: ZarrStoreSuggestionType.WELL }
    }

    if (utils.isOmeMultiscales(attrs)) {
      return { isValid: true, type: ZarrStoreSuggestionType.NO_MULTISCALE }
    }

    return { isValid: false, error: 'No OME-Zarr metadata found' }

  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
