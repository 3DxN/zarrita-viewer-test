'use client'

import React from 'react'

import CrossViewer from './components/viewer2D'
import Viewer3D from './components/viewer3D'
import StoreLoader from './components/StoreLoader'
import { ZarrStoreProvider } from '../contexts/ZarrStoreContext'
import { Viewer2DDataProvider } from '../contexts/Viewer2DDataContext'


export default function Home() {
  const initialSource = 'http://localhost:600/ThreeChannels_Resolution_Level2V05.zarr'

  return (  
    <ZarrStoreProvider initialSource={initialSource}>
      <StoreLoader/>
      <Viewer2DDataProvider>
        <div className="container" style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          gap: '20px', 
          marginTop: '20px', 
          height: '100vh',
          padding: '0 20px'
        }}>
          {/* 2D Viewer - 60% width */}
          <div style={{ flex: '0 0 60%', minWidth: '400px' }}>
            <CrossViewer />
          </div>
          
          {/* 3D Test Viewer - 40% width */}
          <div style={{ flex: '0 0 40%', minWidth: '500px' }}>
            <Viewer3D />
          </div>
        </div>
      </Viewer2DDataProvider>
    </ZarrStoreProvider>
  )
}