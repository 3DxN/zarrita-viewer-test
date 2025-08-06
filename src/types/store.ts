import type { FetchStore, Location } from "zarrita"
import type { ReactNode } from "react"

import type OMEAttrs from "./ome"
import type { IMultiscaleInfo } from "./loader"


export enum ZarrStoreSuggestionType {
  /**
   * OME Plate or Well metadata found
   */
  PLATE_WELL,
  /**
   * Generic OME Metadata found, but is not multiscales
   */
  NO_MULTISCALE,
  /**
   * CellPose segmentation metadata found
   * This is a special case where we suggest CellPose-specific paths
   * even if no OME metadata is present.
   */
  CELLPOSE,
  /**
   * No OME metadata found
   * This is the default state when no suggestions are available.
   */
  NO_OME
}

export interface ZarrStoreSuggestedPath {
  path: string
  isGroup: boolean
  hasOme: boolean
}

export interface ZarrStoreState {
  store: FetchStore | null
  root: Location<FetchStore> | null
  omeData: OMEAttrs | null // Single OME object containing all metadata (plate, well, multiscales, etc.)
  msInfo: IMultiscaleInfo | null // Current array info
  cellposeArray: any | null // Cellpose/segmentation array (loaded at store level)
  isCellposeLoading: boolean
  cellposeError: string | null
  isLoading: boolean
  error: string | null
  infoMessage: string | null // For non-error informational messages (like well/plate selection)
  source: string
  hasLoadedArray: boolean // Track if user has successfully loaded a store
  suggestedPaths: Array<{ path: string; isGroup: boolean; hasOme: boolean }> // Suggested navigation paths
  suggestionType: ZarrStoreSuggestionType // Type of suggestions being offered
}

export interface ZarrStoreContextType extends ZarrStoreState {
  loadStore: (url: string) => Promise<void>
  setSource: (url: string) => void
  navigateToSuggestion: (suggestionPath: string) => void
  refreshCellposeData: () => Promise<void>
}

export interface ZarrStoreProviderProps {
  children: ReactNode
  initialSource?: string
}