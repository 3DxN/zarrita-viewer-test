'use client'

import React from 'react'

import CrossViewer from '../components/crossviewer'
import StoreLoader from '../components/common/StoreLoader'
import { ZarrStoreProvider } from '../contexts/ZarrStoreContext'

export default function Home() {
  const initialSource = 'https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.5/idr0026/3.66.9-6.141020_15-41-29.00.ome.zarr/'

  return (  
    <ZarrStoreProvider initialSource={initialSource}>
      <StoreLoader/>
       <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px', height: '100vh' }}>
        <div style={{ flex: 1 }}>
          <CrossViewer />
        </div>
      </div>
    </ZarrStoreProvider>
  )
}