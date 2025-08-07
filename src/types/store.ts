import type { FetchStore, Location, Array as ZArray } from "zarrita"
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
  /**
   * The currently loaded Zarr store
   */
  store: FetchStore | null
  /**
   * The relative path location of the Zarr store that is currently being viewed
   */
  root: Location<FetchStore> | null
  /**
   * Single OME object containing all metadata of that group
   */
  omeData: OMEAttrs | null
  /**
   * Information about the current multiscale group
   */
  msInfo: IMultiscaleInfo | null
  /**
   * Cellpose/segmentation array loaded at store level
   */
  cellposeArray: ZArray<FetchStore> | null
  /**
   * Whether the Cellpose array is currently being loaded
   */
  isCellposeLoading: boolean
  /**
   * Error message if Cellpose loading fails
   */
  cellposeError: string | null
  /**
   * Whether the viewing image data is being loaded
   */
  isLoading: boolean
  /**
   * Error message if loading the store or paths within it fails
   */
  error: string | null
  /**
   * For non-error informational messages (such as further navigation instructions)
   */
  infoMessage: string | null
  /**
   * Current source URL of the Zarr store
   * This is used to reload the store or navigate to a different one
   */
  source: string
  /**
   * Whether the user has successfully loaded a multiscales image array
   * And to initialise the display of the viewer if so.
   */
  hasLoadedArray: boolean
  /**
   * Suggested paths for navigation based on the current store
   * If the current group is not an multiscales group or image
   */
  suggestedPaths: Array<{
    path: string;
    isGroup: boolean;
    hasOme: boolean
  }>
  /**
   * Type of suggestions being offered based on the current store
   * This helps in determining how to present the suggestions to the user
   */
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