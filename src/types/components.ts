/**
 * Component props type definitions
 */

// ArrayLoader component props
export interface ArrayLoaderProps {
  onArrayLoaded: (arr: any, arrayInfo: any) => void
  onError: (error: string) => void
  onLoadingChange: (loading: boolean) => void
}
