import type { DataType } from "zarrita"


export interface IArrayInfo {
  shape: number[],
  dtype: DataType,
  chunks: number[],
  resolution: string,
  channel: number
}