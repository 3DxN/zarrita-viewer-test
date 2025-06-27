'use client'

import { useRef, useCallback, useEffect } from 'react'
import type { NavigationState, ZarrViewerProps } from '../../types/crossviewer'

export default function ZarrViewer({
  currentArray,
  arrayInfo,
  navigationState,
  loading,
  onError
}: ZarrViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const renderImageRegion = useCallback(async (arr: any, navState: NavigationState) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      const zarrita = await import('zarrita')

      // Get array dimensions
      const width = arr.shape[arr.shape.length - 1]
      const height = arr.shape[arr.shape.length - 2]
      
      // Clamp values to valid ranges
      const clampedTimeSlice = Math.min(navState.timeSlice, arr.shape.length >= 4 ? arr.shape[0] - 1 : 0)
      const clampedChannel = Math.min(navState.currentChannel, arr.shape.length >= 4 ? 
        (arr.shape.length === 5 ? arr.shape[1] - 1 : arr.shape[0] - 1) : 0)
      const clampedZSlice = Math.min(navState.zSlice, arr.shape.length >= 3 ? 
        arr.shape[arr.shape.length - 3] - 1 : 0)
      const clampedXOffset = Math.min(navState.xOffset, width - 1)
      const clampedYOffset = Math.min(navState.yOffset, height - 1)
      
      // Calculate region size (max 256x256)
      const regionWidth = Math.min(256, width - clampedXOffset)
      const regionHeight = Math.min(256, height - clampedYOffset)

      // Create selection for the region
      const selection = []
      
      // Handle different array shapes
      if (arr.shape.length === 5) {
        selection.push(clampedTimeSlice)
        selection.push(clampedChannel)
        selection.push(clampedZSlice)
        selection.push(zarrita.slice(clampedYOffset, clampedYOffset + regionHeight))
        selection.push(zarrita.slice(clampedXOffset, clampedXOffset + regionWidth))
      } else if (arr.shape.length === 4) {
        selection.push(clampedChannel)
        selection.push(clampedZSlice)
        selection.push(zarrita.slice(clampedYOffset, clampedYOffset + regionHeight))
        selection.push(zarrita.slice(clampedXOffset, clampedXOffset + regionWidth))
      } else if (arr.shape.length === 3) {
        selection.push(clampedZSlice)
        selection.push(zarrita.slice(clampedYOffset, clampedYOffset + regionHeight))
        selection.push(zarrita.slice(clampedXOffset, clampedXOffset + regionWidth))
      } else {
        selection.push(zarrita.slice(clampedYOffset, clampedYOffset + regionHeight))
        selection.push(zarrita.slice(clampedXOffset, clampedXOffset + regionWidth))
      }

      const imageData = await zarrita.get(arr, selection)
      const { data, shape } = imageData
      
      // Get actual dimensions from the slice result
      const actualHeight = shape[shape.length - 2]
      const actualWidth = shape[shape.length - 1]
      
      canvas.width = actualWidth
      canvas.height = actualHeight

      const imageDataCanvas = ctx.createImageData(actualWidth, actualHeight)
      
      // Normalize data to 0-255 range
      const dataArray = Array.from(data as ArrayLike<number>)
      const min = Math.min(...dataArray)
      const max = Math.max(...dataArray)
      const range = max - min || 1
      
      // Convert to grayscale RGBA
      for (let i = 0; i < dataArray.length && i < actualWidth * actualHeight; i++) {
        const normalized = Math.floor(((dataArray[i] - min) / range) * 255)
        const pixelIndex = i * 4
        
        imageDataCanvas.data[pixelIndex] = normalized
        imageDataCanvas.data[pixelIndex + 1] = normalized
        imageDataCanvas.data[pixelIndex + 2] = normalized
        imageDataCanvas.data[pixelIndex + 3] = 255
      }
      
      ctx.putImageData(imageDataCanvas, 0, 0)
    } catch (err) {
      onError(`Error rendering image: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [onError])

  // Update image when navigation parameters change
  useEffect(() => {
    if (currentArray) {
      renderImageRegion(currentArray, navigationState)
    }
  }, [currentArray, navigationState, renderImageRegion])

  // Log array info to console when it changes
  useEffect(() => {
    if (arrayInfo) {
      console.log('Array Info:', {
        shape: arrayInfo.shape,
        dtype: arrayInfo.dtype,
        chunks: arrayInfo.chunks
      })
    }
  }, [arrayInfo])

  return (
    <canvas 
      ref={canvasRef}
      style={{ 
        maxWidth: arrayInfo ? '100%' : '256px',
        minHeight: arrayInfo ? 'auto' : '256px',
        border: '1px solid #ddd',
        display: loading ? 'none' : 'block',
        backgroundColor: '#f9f9f9'
      }}
    />
  )
}