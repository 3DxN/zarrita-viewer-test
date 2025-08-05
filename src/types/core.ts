/**
 * Core shared types and utilities used across the application
 */

export type AxisKey = 'x' | 'y' | 'z' | 't' | 'c'

export type MultiscaleShape = Partial<Record<AxisKey, number>>

export type ChannelMapping = {
  nucleus: number | null; // Channel index for nucleus, null if not selected
  cytoplasm: number | null; // Channel index for cytoplasm, null if not selected
}

export type ContrastLimits = [number | null, number | null]

export interface IStringAny {
  [key: string]: any
}
