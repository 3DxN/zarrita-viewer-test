'use client'

import React, { FC, useState, useEffect } from 'react';
import { VolumeViewer, loadOmeZarr } from '@hms-dbmi/viv';

interface FeatureViewerProps {
  height?: number;
  width?: number;
}

/**
 * FeatureViewer using VolumeViewer to test Viv 0.17.3 functionality
 * This component tests if the latest Viv version can load OME-Zarr data properly
 */
const FeatureViewer: FC<FeatureViewerProps> = ({
  height = 400,
  width = 400,
}) => {

  const [imgLoaded, setImgLoaded] = useState(false);
  const [src, setSrc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load the OME-Zarr data when the component mounts
    const loadData = async () => {
      try {
        console.log('FeatureViewer: Starting OME-Zarr data load...');
        const loader = await loadOmeZarr('https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.5/idr0051/180712_H2B_22ss_Courtney1_20180712-163837_p00_c00_preview.zarr/0/0', { type: 'multiscales' });
        console.log('FeatureViewer: OME-Zarr data loaded, checking type...');
        setSrc(loader.data);
        setImgLoaded(true);
        setError(null);
        console.log('FeatureViewer: OME-Zarr data loaded successfully, data_type:', loader.data);
      } catch (error) {
        console.error('FeatureViewer: Error loading OME-Zarr data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error loading data');
        setImgLoaded(false);
      }
    };

    loadData();
  }, []);

  if (error) {
    return (
      <div style={{ 
        width: `${width}px`, 
        height: `${height}px`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>❌ Viv Loading Error</div>
          <div style={{ fontSize: '14px' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      border: '1px solid #dee2e6', 
      padding: '15px', 
      borderRadius: '8px', 
      backgroundColor: 'white' 
    }}>
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 5px 0', color: '#007bff' }}>Viv VolumeViewer Test</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#6c757d' }}>
          Testing Viv 0.17.3 with VolumeViewer component
        </p>
      </div>
      
      {imgLoaded ? (
        <div style={{ 
          width: `${width}px`, 
          height: `${height}px`, 
          position: 'relative',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <VolumeViewer
            contrastLimits={[[0, 1023], [0, 1023]]} // Example contrast limits
            colors={[[0, 255, 0], [0, 0, 0]]}
            channelsVisible={[true, true]} // Example channel, can be dynamic
            selections={[{c: 0}]} // Example selections
            width={width}
            height={height}
            loader={src}
          />
        </div>
      ) : (
        <div style={{ 
          width: `${width}px`, 
          height: `${height}px`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#e3f2fd',
          border: '1px solid #90caf9',
          borderRadius: '4px',
          color: '#1976d2'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>🔄</div>
            <div style={{ fontWeight: 'bold' }}>Loading Viv VolumeViewer...</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>Testing OME-Zarr compatibility</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureViewer;
