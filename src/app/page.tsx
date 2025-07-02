'use client'

import React from 'react'

import CrossViewer from '../components/crossviewer'
import MacroViewer from '../components/macroviewer'
import StoreLoader from '../components/common/StoreLoader'
import { ZarrStoreProvider } from '../contexts/ZarrStoreContext'
// import FeatureViewer from '../components/featureviewer' 

export default function Home() {
  const initialSource = 'https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.5/idr0026/3.66.9-6.141020_15-41-29.00.ome.zarr/'

  return (  
    <ZarrStoreProvider initialSource={initialSource}>
      <StoreLoader/>
      
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '20px', marginTop: '20px', height: '100vh' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ flex: '1' }}>
            <h2>Cross Viewer</h2>
            <CrossViewer />
          </div>

          <div style={{ flex: '1' }}>
            <h2>Macro Viewer</h2>
            <MacroViewer height={500} width={500} />
          </div>

        </div>
        
        {/* Right column: Feature viewer (main viewer) */}
        <div>
          <h2>Feature Viewer</h2>
          <p>Coming Soon...</p>
        </div>

      </div>
    </ZarrStoreProvider>
  )
}