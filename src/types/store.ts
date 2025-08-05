import type { FetchStore, Group } from "zarrita"
import type { ReactNode } from "react"

import type OMEAttrs from "./ome"
import type { IMultiscaleInfo } from "./loader"


export enum ZarrStoreSuggestionType {
  /**
   * OME Plate metadata found
   */
  PLATE,
  /**
   * OME Well metadata found
   */
  WELL,
  /**
   * Generic OME metadata found, but not multiscales
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
  GENERIC
}

export interface ZarrStoreSuggestedPath {
  path: string
  isGroup: boolean
  hasOme: boolean
}

export interface ZarrStoreState {
  store: FetchStore | null
  root: Group<any> | null
  omeData: OMEAttrs | null // Single OME object containing all metadata (plate, well, multiscales, etc.)
  msInfo: IMultiscaleInfo | null // Current array info
  isLoading: boolean
  error: string | null
  infoMessage: string | null // For non-error informational messages (like well/plate selection)
  source: string
  hasLoadedStore: boolean // Track if user has successfully loaded a store
  suggestedPaths: Array<{ path: string; isGroup: boolean; hasOme: boolean }> // Suggested navigation paths
  suggestionType: ZarrStoreSuggestionType // Type of suggestions being offered
}

export interface ZarrStoreContextType extends ZarrStoreState {
  loadStore: (url: string) => Promise<void>
  setSource: (url: string) => void
  navigateToSuggestion: (suggestionPath: string) => void
}

export interface ZarrStoreProviderProps {
  children: ReactNode
  initialSource?: string
}