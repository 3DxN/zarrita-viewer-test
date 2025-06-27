'use client'

import MacroViewer from '../components/macroviewer'
// import FeatureViewer from '../components/featureviewer' 
// import CrossViewer from '../components/crossviewer'

export default function Home() {
  return (
    <div className="container">      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div>
          <h2>Macro Viewer</h2>
          <MacroViewer />
        </div>
        
        <div>
          <h2>Feature Viewer</h2>
          <p>Coming Soon...</p>
          {/* <FeatureViewer /> */}
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Cross Viewer</h2>
        <p>Coming Soon...</p>
        {/* <CrossViewer /> */}
      </div>
    </div>
  )
}