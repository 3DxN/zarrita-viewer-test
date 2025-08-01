import type { Array, DataType } from "zarrita"

import type { IMultiscaleInfo } from "./loader"


// ArrayLoader component props
export interface ArrayLoaderProps {
  onArrayLoaded: (arr: Array<DataType>, arrayInfo: IMultiscaleInfo) => void
  onError: (error: string) => void
  onLoadingChange: (loading: boolean) => void
}
