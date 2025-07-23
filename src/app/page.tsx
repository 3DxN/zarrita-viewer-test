'use client'

import React from 'react'

import CrossViewer from '../components/crossviewer'
import StoreLoader from '../components/loader/StoreLoader'
import { ZarrStoreProvider } from '../contexts/ZarrStoreContext'

export default function Home() {
  const initialSource = 'http://localhost:600/ZarrV05WithCPmap/ThreeChannels_Resolution_Level4v05_3D.zarr'

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