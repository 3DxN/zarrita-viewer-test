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
    omeData,
    navigateToSuggestion,
    hasLoadedStore
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

  const renderPlateInterface = () => {
    if (!omeData?.plate) return null

    const { rows, columns, wells } = omeData.plate

    return (
      <div style={{
        marginTop: '15px',
        padding: '15px',
        backgroundColor: '#e8f4f8',
        borderRadius: '6px',
        border: '1px solid #17a2b8'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '10px',
          color: '#17a2b8',
          fontSize: '16px'
        }}>
          📊 OME-Zarr Plate Structure Detected
        </div>
        
        {omeData.plate.name && (
          <div style={{ marginBottom: '10px', fontSize: '14px' }}>
            <strong>Plate:</strong> {omeData.plate.name}
          </div>
        )}
        
        <div style={{ marginBottom: '15px', fontSize: '14px' }}>
          <strong>Dimensions:</strong> {rows.length} rows × {columns.length} columns ({wells.length} wells)
        </div>

        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
          Select a well to view:
        </div>

        {/* Plate grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: `40px repeat(${columns.length}, 1fr)`,
          gap: '2px',
          fontSize: '12px',
          maxWidth: '100%',
          overflow: 'auto'
        }}>
          {/* Column headers */}
          <div></div>
          {columns.map((col, colIndex) => (
            <div key={colIndex} style={{ 
              textAlign: 'center', 
              fontWeight: 'bold',
              padding: '4px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6'
            }}>
              {col.name}
            </div>
          ))}

          {/* Rows with wells */}
          {rows.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {/* Row header */}
              <div style={{ 
                textAlign: 'center', 
                fontWeight: 'bold',
                padding: '4px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {row.name}
              </div>
              
              {/* Wells for this row */}
              {columns.map((col, colIndex) => {
                const well = wells.find(w => w.rowIndex === rowIndex && w.columnIndex === colIndex)
                
                return (
                  <div key={`${rowIndex}-${colIndex}`} style={{
                    border: '1px solid #dee2e6',
                    minHeight: '40px'
                  }}>
                    {well ? (
                      <button
                        onClick={() => navigateToSuggestion(well.path)}
                        style={{
                          width: '100%',
                          height: '100%',
                          minHeight: '40px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '10px',
                          padding: '2px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#218838'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#28a745'
                        }}
                        title={`Well ${row.name}${col.name}: ${well.path}`}
                      >
                        {row.name}{col.name}
                      </button>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '40px',
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6c757d'
                      }}>
                        -
                      </div>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>

        <div style={{ 
          fontSize: '11px', 
          marginTop: '10px', 
          color: '#6c757d',
          textAlign: 'center'
        }}>
          Click on a well to load that location
        </div>
      </div>
    )
  }

  const renderWellInterface = () => {
    if (!omeData?.well) return null

    const { images } = omeData.well

    return (
      <div style={{
        marginTop: '15px',
        padding: '15px',
        backgroundColor: '#f0f8ff',
        borderRadius: '6px',
        border: '1px solid #007bff'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '10px',
          color: '#007bff',
          fontSize: '16px',
          textAlign: 'center'
        }}>
          🖼️ OME-Zarr Well Images Detected
        </div>
        
        <div style={{ marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>
          <strong>Available Images:</strong> {images.length} images found in this well
        </div>

        <div style={{ marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>
          Select an image to view:
        </div>

        {/* Images grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
          maxWidth: '100%'
        }}>
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => navigateToSuggestion(image.path)}
              style={{
                padding: '15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                textAlign: 'center',
                minHeight: '60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0056b3'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#007bff'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              title={`Load image: ${image.path}`}
            >
              <div style={{ fontSize: '20px', marginBottom: '5px' }}>🖼️</div>
              <div>Image {image.path}</div>
            </button>
          ))}
        </div>

        <div style={{ 
          fontSize: '11px', 
          marginTop: '10px', 
          color: '#6c757d',
          textAlign: 'center'
        }}>
          Click on an image to load that location
        </div>
      </div>
    )
  }

  const renderSuggestions = () => {
    if (suggestionType === ZarrStoreSuggestionType.PLATE && omeData?.plate) {
      return renderPlateInterface()
    }

    if (suggestionType === ZarrStoreSuggestionType.WELL && omeData?.well) {
      return renderWellInterface()
    }

    // For no-multiscale case, show error message and suggestions if available
    if (suggestionType === ZarrStoreSuggestionType.NO_MULTISCALE) {
      return (
        <div style={{ 
          marginTop: '15px',
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '6px',
          border: '1px solid #f5c6cb',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
            ❌ Invalid OME-Zarr Structure
          </div>
          <div style={{ fontSize: '14px', marginBottom: suggestedPaths.length > 0 ? '15px' : '0' }}>
            OME metadata was found but no multiscale data is present.<br/>
            {suggestedPaths.length > 0 && 'Try these subdirectories instead:'}
          </div>
          
          {/* Show suggestions for no-multiscale case */}
          {suggestedPaths.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
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
                  {suggestion.hasOme && '🔬 '}
                  {suggestion.isGroup && !suggestion.hasOme && '📁 '}
                  {!suggestion.isGroup && '📊 '}
                  {suggestion.path}
                </button>
              ))}
            </div>
          )}
          
          {suggestedPaths.length > 0 && (
            <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.8 }}>
              🔬 = OME metadata, 📁 = Group, 📊 = Array<br/>
              Click a path to load that location
            </div>
          )}
        </div>
      )
    }

    if (suggestedPaths.length === 0) return null

    let suggestionTitle = ''
    let suggestionDescription = ''

    switch (suggestionType) {
      case ZarrStoreSuggestionType.PLATE:
        suggestionTitle = '📊 Plate structure detected'
        suggestionDescription = 'Select a well from the plate above:'
        break
      case ZarrStoreSuggestionType.WELL:
        suggestionTitle = '🖼️ Well images detected'
        suggestionDescription = 'Select an image from the well above:'
        break
      case ZarrStoreSuggestionType.GENERIC:
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
        borderRadius: '4px',
        border: '1px solid #ffeaa7'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          {suggestionTitle}
        </div>
        {suggestionDescription && (
          <div style={{ marginBottom: '10px', fontSize: '14px' }}>
            {suggestionDescription}
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
              {suggestion.hasOme && '🔬 '}
              {suggestion.isGroup && !suggestion.hasOme && '📁 '}
              {!suggestion.isGroup && '📊 '}
              {suggestion.path}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.8 }}>
          🔬 = OME metadata, 📁 = Group, 📊 = Array<br/>
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
            🔬 AIDA OME-Zarr Loader
          </h2>
          <p style={{ 
            margin: 0, 
            color: '#6c757d',
            fontSize: '16px'
          }}>
            Please load an OME-Zarr store to begin exploring your data
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
              Zarr Store URL:
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
        
        {error && !hasLoadedStore && (
          <div style={{ 
            marginTop: '15px',
            color: (suggestionType === ZarrStoreSuggestionType.PLATE || suggestionType === ZarrStoreSuggestionType.WELL) ? '#856404' : '#721c24', 
            backgroundColor: (suggestionType === ZarrStoreSuggestionType.PLATE || suggestionType === ZarrStoreSuggestionType.WELL) ? '#fff3cd' : '#f8d7da', 
            padding: '15px', 
            borderRadius: '6px',
            fontSize: '16px',
            textAlign: 'center',
            border: (suggestionType === ZarrStoreSuggestionType.PLATE || suggestionType === ZarrStoreSuggestionType.WELL) ? '1px solid #ffeaa7' : 'none'
          }}>
            {suggestionType === ZarrStoreSuggestionType.PLATE ? (
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <strong>📊 Plate Structure Detected</strong>
              </div>
            ) : suggestionType === ZarrStoreSuggestionType.WELL ? (
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <strong>🖼️ Well Images Detected</strong>
              </div>
            ) : (
              <>❌ {error}</>
            )}
            
            {/* Show OME-Zarr specific suggestions */}
            {renderSuggestions()}
          </div>
        )}

        {/* Show info message for well/plate selection */}
        {infoMessage && !hasLoadedStore && (
          <div style={{ 
            marginTop: '15px',
            color: '#856404',
            backgroundColor: '#fff3cd',
            padding: '15px', 
            borderRadius: '6px',
            fontSize: '16px',
            textAlign: 'center',
            border: '1px solid #ffeaa7'
          }}>
            <div style={{ marginBottom: '8px' }}>
              {suggestionType === ZarrStoreSuggestionType.PLATE ? (
                <strong>📊 OME-Zarr Plate Detected</strong>
              ) : suggestionType === ZarrStoreSuggestionType.WELL ? (
                <strong>🖼️ OME-Zarr Well Detected</strong>
              ) : (
                <strong>💡 Info</strong>
              )}
            </div>
            <div>{infoMessage}</div>
          </div>
        )}

        {/* Show interfaces when plate/well is detected (either error or info) */}
        {((!error && !infoMessage) || (infoMessage && suggestionType === ZarrStoreSuggestionType.PLATE)) && omeData?.plate && (
          <div>
            {renderPlateInterface()}
          </div>
        )}

        {((!error && !infoMessage) || (infoMessage && suggestionType === ZarrStoreSuggestionType.WELL)) && omeData?.well && (
          <div>
            {renderWellInterface()}
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
            <strong>💡 Tip:</strong> You can use the sample URL above or paste your own OME-Zarr store URL
          </div>
        )}

        {store && (
          <div style={{ 
            marginTop: '20px', 
            textAlign: 'center',
            fontSize: '14px',
            color: '#6c757d'
          }}>
            Store loaded successfully! You can now use the viewers.
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
