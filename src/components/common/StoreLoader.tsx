'use client'

import { useZarrStore } from '../../contexts/ZarrStoreContext'

export default function StoreLoader() {
  const { source, setSource, store, loadStore, isLoading, error } = useZarrStore()

  const handleLoadStore = async () => {
    if (!source) return
    await loadStore(source)
  }

  return (
    <div style={{ 
      marginBottom: '20px', 
      padding: '15px', 
      border: '2px solid #007bff', 
      borderRadius: '8px',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#007bff' }}>Zarr Store Loader</h3>
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Zarr Store URL:
          </label>
          <input 
            type="text" 
            value={source} 
            onChange={(e) => setSource(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px', 
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="Enter Zarr store URL"
          />
        </div>
        
        <button 
          onClick={handleLoadStore} 
          disabled={isLoading || !source}
          style={{ 
            padding: '8px 20px', 
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isLoading || !source ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            minWidth: '120px'
          }}
        >
          {isLoading ? 'Loading...' : 'Load Store'}
        </button>
      </div>

      {/* Store Status */}
      {store && (
        <div style={{ 
          marginTop: '10px', 
          padding: '8px 12px', 
          backgroundColor: '#d4edda', 
          color: '#155724',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          ✅ Store loaded successfully
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: '10px',
          color: '#721c24', 
          backgroundColor: '#f8d7da', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          ❌ {error}
        </div>
      )}
    </div>
  )
}
