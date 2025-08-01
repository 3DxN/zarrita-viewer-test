import type { Array, DataType } from "zarrita"

import type { IArrayInfo } from "./loader"


// ArrayLoader component props
export interface ArrayLoaderProps {
  onArrayLoaded: (arr: Array<DataType>, arrayInfo: IArrayInfo) => void
  onError: (error: string) => void
  onLoadingChange: (loading: boolean) => void
  // Optional external resolution control
  externalResolution?: string
  onResolutionUsed?: (resolution: string) => void
}
