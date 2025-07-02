import type { FetchStore, Group } from "zarrita"
import type { ReactNode } from "react"

import type OMEAttrs from "./ome"


export enum ZarrStoreSuggestionType {
  PLATE, // OME Plate
  WELL, // OME Well
  NO_MULTISCALE, // OME metadata found, without multiscale data
  GENERIC // NO OME metadata found - do not suggest anything
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
  availableResolutions: string[]
  availableChannels: string[]
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