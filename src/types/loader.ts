/**
 * Data loader types for zarr array metadata and multiscale information
 */

import type { DataType } from "zarrita"
import type { AxisKey, MultiscaleShape } from "./core"

export interface IMultiscaleInfo {
  /**
   * Shape of the highest resolution array. 
   * Tells information such as number of channels and z/t slices.
   */
  shape: Partial<Record<AxisKey, number>>;
  /**
   * Core Datatype of array.
   */
  dtype: DataType,
  /**
   * Available resolution paths
   */
  resolutions: string[],
  /**
   * Channel names/identifiers
   */
  channels: string[]
}

export { type AxisKey, type MultiscaleShape } from "./core"