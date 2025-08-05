'use client'

import React from 'react'

import CrossViewer from './components/crossviewer'
import StoreLoader from './components/StoreLoader'
import { ZarrStoreProvider } from '../contexts/ZarrStoreContext'
import { FrameStateProvider } from '../contexts/FrameStateContext'


export default function Home() {
  const initialSource = 'http://localhost:600/ThreeChannels_Resolution_Level2V05.zarr'

  return (  
    <ZarrStoreProvider initialSource={initialSource}>
      <StoreLoader/>
      <FrameStateProvider>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px', height: '100vh' }}>
          <div style={{ flex: 1 }}>
            <CrossViewer />
          </div>
        </div>
      </FrameStateProvider>
    </ZarrStoreProvider>
  )
}