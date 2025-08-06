'use client'

import React, { useEffect, useState } from 'react'

import { useZarrStore } from '../../contexts/ZarrStoreContext'
import { ZarrStoreSuggestionType } from '../../types/store'


export default function StoreLoader() {
  const { 
    source, 
    setSource, 
    store, 
    loadStore, 
    isLoading, 
    error, 
    infoMessage,
    suggestedPaths, 
    suggestionType,
    navigateToSuggestion,
    hasLoadedArray: hasLoadedStore
  } = useZarrStore()
  
  const [showSuccess, setShowSuccess] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isClosing, setIsClosing] = useState(false)

  // Handle modal auto-close when store loads
  useEffect(() => {
    if (hasLoadedStore && !isClosing) {
      // Show success message first
      setShowSuccess(true)
      
      // Start closing/fading after a brief success display
      setTimeout(() => {
        setIsClosing(true)
      }, 500)
      
      // Remove completely after fade-out animation (1 second)
      setTimeout(() => {
        setIsVisible(false)
      }, 1500) // 500ms success display + 1000ms fade-out
    }
  }, [hasLoadedStore, isClosing])

  const handleLoadStore = async () => {
    if (!source) return
    await loadStore(source)
  }

  // Don't render modal if it's been hidden
  if (!isVisible) {
    return null
  }

  const renderSuggestions = () => {
    let suggestionTitle = ''
    let suggestionDescription = ''

    switch (suggestionType) {
      case ZarrStoreSuggestionType.PLATE_WELL:
        suggestionTitle = '📊 OME-Plate/Well structure detected'
        suggestionDescription = 'OME-Plate/Wells are not supported for direct viewing.'
        break
      default:
        suggestionTitle = '💡 Try these paths'
        suggestionDescription = 'Click to load these potential OME-Zarr locations:'
        break
    }

    return (
      <div style={{ 
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#fff3cd',
        color: '#856404',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          {suggestionTitle}
        </div>
        {suggestionDescription && (
          <div style={{ marginBottom: '10px', fontSize: '14px' }}>
            {suggestionDescription}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
          {suggestedPaths.length === 0 && (
            <div style={{ textAlign: 'center', width: '100%' }}>
              No suggested paths found.
            </div>
          )}
          {suggestedPaths.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', width: '100%' }}>
              {suggestedPaths.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => navigateToSuggestion(suggestion.path)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: suggestion.hasOme ? '#28a745' : suggestion.isGroup ? '#17a2b8' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    const btn = e.target as HTMLButtonElement
                    btn.style.opacity = '0.8'
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.target as HTMLButtonElement
                    btn.style.opacity = '1'
                  }}
                  title={
                    suggestion.hasOme 
                      ? 'OME-Zarr group - click to load' 
                      : suggestion.isGroup 
                        ? 'Zarr group - click to load' 
                        : 'Zarr array - click to load'
                  }
                >
                  {suggestion.path}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.8 }}>
          Click a path to load that location
        </div>
      </div>
    )
  }

  const modalOpacity = isClosing ? 0 : 1
  const modalTransform = isClosing ? 'scale(0.95)' : 'scale(1)'

  const containerStyle = {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) ${modalTransform}`,
    zIndex: 1000,
    width: '90%',
    maxWidth: '600px',
    backgroundColor: 'white',
    boxShadow: `0 8px 32px rgba(0, 0, 0, ${0.3 * modalOpacity})`,
    borderRadius: '12px',
    padding: '30px',
    border: '3px solid #007bff',
    opacity: modalOpacity,
    transition: 'all 1s ease-out'
  }

  const overlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `rgba(0, 0, 0, ${0.7 * modalOpacity})`,
    zIndex: 999,
    backdropFilter: `blur(${3 * modalOpacity}px)`,
    transition: 'all 1s ease-out',
    opacity: modalOpacity,
    pointerEvents: isClosing ? 'none' as const : 'auto' as const
  }

  return (
    <>
      {/* Modal Overlay */}
      <div style={overlayStyle} />

      {/* StoreLoader Content */}
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h2 style={{ 
            margin: '0 0 10px 0', 
            color: '#007bff',
            fontSize: '24px'
          }}>
            🔬 AIDA Image Loader
          </h2>
          <p style={{ 
            margin: 0, 
            color: '#6c757d',
            fontSize: '16px'
          }}>
            Load an OME-Zarr, DeepZoom or TIFF store to begin exploring your data
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div style={{ flexGrow: 1, flexShrink: 1, minWidth: '0' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              fontSize: '16px',
              color: '#333'
            }}>
              Store URL:
            </label>
            <input 
              type="text" 
              value={source} 
              onChange={(e) => setSource(e.target.value)}
              disabled={isClosing}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s, opacity 1s ease-out',
                opacity: isClosing ? 0.3 : 1
              }}
              placeholder="Enter Zarr store URL"
              onFocus={(e) => !isClosing && (e.target.style.borderColor = '#007bff')}
              onBlur={(e) => !isClosing && (e.target.style.borderColor = '#ced4da')}
            />
          </div>
          
          <button 
            onClick={handleLoadStore} 
            disabled={isLoading || !source || isClosing}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: isLoading ? '#6c757d' : '#007bff',
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: isLoading || !source || isClosing ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              transition: 'background-color 0.2s, opacity 1s ease-out',
              boxShadow: '0 2px 10px rgba(0, 123, 255, 0.3)',
              opacity: isClosing ? 0.3 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoading && source && !isClosing) {
                (e.target as HTMLButtonElement).style.backgroundColor = '#0056b3'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && source && !isClosing) {
                (e.target as HTMLButtonElement).style.backgroundColor = '#007bff'
              }
            }}
          >
            {isLoading ? 'Loading...' : 'Load Store'}
          </button>
        </div>

        {/* Success message when store is loaded */}
        {showSuccess && (
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            backgroundColor: '#d4edda', 
            color: '#155724',
            borderRadius: '6px',
            fontSize: '16px',
            textAlign: 'center',
            fontWeight: 'bold',
            opacity: isClosing ? 0 : 1,
            transition: 'opacity 1s ease-out'
          }}>
            ✅ Store loaded successfully! Opening viewers...
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !hasLoadedStore && (
          <div style={{ 
            marginTop: '15px',
            textAlign: 'center',
            padding: '15px',
            backgroundColor: '#e3f2fd',
            borderRadius: '6px',
            color: '#1976d2',
            fontSize: '14px'
          }}>
            <div style={{ marginBottom: '10px' }}>🔄 Loading Zarr store...</div>
            <div style={{ 
              width: '100%', 
              height: '4px', 
              backgroundColor: '#bbdefb', 
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '30%',
                height: '100%',
                backgroundColor: '#2196f3',
                animation: 'loading 1.5s ease-in-out infinite'
              }} />
            </div>
          </div>
        )}
        
        {(infoMessage || error) && !hasLoadedStore && (
          <div style={{ 
            marginTop: '15px',
            color: ([ZarrStoreSuggestionType.PLATE_WELL, ZarrStoreSuggestionType.NO_MULTISCALE]
              .includes(suggestionType)) ? '#856404' : '#721c24', 
            backgroundColor: ([ZarrStoreSuggestionType.PLATE_WELL, ZarrStoreSuggestionType.NO_MULTISCALE]
              .includes(suggestionType)) ? '#fff3cd' : '#f8d7da', 
            padding: '15px', 
            borderRadius: '6px',
            fontSize: '16px',
            textAlign: 'center',
            border: ([ZarrStoreSuggestionType.PLATE_WELL, ZarrStoreSuggestionType.NO_MULTISCALE]
              .includes(suggestionType)) ? '1px solid #ffeaa7' : 'none'
          }}>
            {suggestionType === ZarrStoreSuggestionType.PLATE_WELL ? (
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <strong>📊 OME-Plate/Well Structure Detected</strong>
              </div>
            ) : infoMessage ? (
              <>ℹ️ {infoMessage}</>
            ) : (
              <>❌ {error}</>
            )}
            
            {/* Show OME-Zarr specific suggestions */}
            {renderSuggestions()}
          </div>
        )}

        {!hasLoadedStore && !isLoading && !showSuccess && (
          <div style={{ 
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#6c757d'
          }}>
            <strong>💡 Tip:</strong> You can use the sample OME-Zarr URL above or paste your own store URL
          </div>
        )}
      </div>
      
      {/* CSS animations */}
      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(-100%); }
        }
        
        @keyframes fadeInSuccess {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
