import type { ZarrPixelSource } from "@hms-dbmi/viv"
import type { AltZarrPixelSource } from "../ext/AltZarrPixelSource"

export interface VivLoaderConfig {
  source: string
  name?: string
  opacity?: number
  colormap?: string
  tileSize?: number
}

export interface VivCompatibleData {
  loader: (ZarrPixelSource<string[]> | AltZarrPixelSource)[]
  metadata: {
    axis_labels: string[]
    model_matrix: number[][]
    channels: Array<{
      color: [number, number, number]
      window: [number, number]
      label: string
      visible: boolean
    }>
    domains: Record<string, number[]>
    defaults: {
      selection: Record<string, number>
      colormap: string
      opacity: number
    }
    name: string
  }
}