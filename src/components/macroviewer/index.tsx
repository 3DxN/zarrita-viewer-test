import React, { FC, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as zarrita from 'zarrita';

import VolumeViewer from './volumeviewer'; // Assuming this is in the same directory
import OMEAttrs from '../../types/ome';
import type { MacroViewerProps } from '../../types/macroviewer';


const MacroViewer: FC<MacroViewerProps> = ({
  height,
  width,
  source,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [dataInfo, setDataInfo] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting data load from:', source);
        
        const store = new zarrita.FetchStore(source);
        const root = zarrita.root(store);
        const grp = await zarrita.open(store, { kind: 'group' });
        
        if (!grp.attrs || !grp.attrs.ome) {
          throw new Error("OME metadata not found in the group.");
        }
        
        const rootAttrs = grp.attrs.ome as OMEAttrs;
        const multiscales = rootAttrs.multiscales ?? null;

        if (!multiscales || !multiscales[0] || !multiscales[0].datasets[0]) {
          throw new Error("Valid multiscale metadata not found.");
        }

        // Get axes information
        const axes = multiscales[0].axes.map(axis => axis.name);
        console.log('Axes found:', axes);

        // Load the lowest resolution for testing
        const lowestResPath = multiscales[0].datasets[multiscales[0].datasets.length - 1].path;
        console.log('Loading path:', lowestResPath);
        
        const arr = await zarrita.open(root.resolve(lowestResPath), { kind: 'array' });
        console.log("Array loaded:", {
          shape: arr.shape,
          dtype: arr.dtype,
          chunks: arr.chunks
        });
        
        // Get a small sample of the data first
        const dataSlice = await zarrita.get(arr);
        const data = dataSlice.data as Uint16Array;
        
        console.log('Data loaded:', {
          dataLength: data.length,
          shape: dataSlice.shape,
          min: Math.min(...Array.from(data.slice(0, 1000))),
          max: Math.max(...Array.from(data.slice(0, 1000))),
          first10Values: Array.from(data.slice(0, 10))
        });

        // Extract dimensions
        const dims: { [key: string]: number } = {};
        axes.forEach((axis, index) => {
          dims[axis] = dataSlice.shape[index];
        });

        console.log('Dimensions extracted:', dims);

        // Get spatial dimensions - handle different axis orders
        let x, y, z;
        if (dims.x !== undefined) {
          x = dims.x;
          y = dims.y;
          z = dims.z;
        } else if (dims.X !== undefined) {
          x = dims.X;
          y = dims.Y;
          z = dims.Z;
        } else {
          // Assume last 3 dimensions are spatial (z, y, x)
          const shape = dataSlice.shape;
          z = shape[shape.length - 3] || 1;
          y = shape[shape.length - 2] || 1;
          x = shape[shape.length - 1] || 1;
        }

        console.log(`Spatial dimensions: X=${x}, Y=${y}, Z=${z}`);

        // Extract just the spatial volume (first channel, first timepoint)
        let volumeData: Uint16Array;
        const volumeSize = x * y * z;
        
        if (data.length === volumeSize) {
          // Already just spatial data
          volumeData = data;
        } else {
          // Take first slice (assuming TCZYX or CZYX order)
          volumeData = data.slice(0, volumeSize);
        }

        console.log(`Using ${volumeData.length} values for ${x}x${y}x${z} volume`);

        // Normalize the data to 0-1 range for better visibility
        const normalizedData = new Float32Array(volumeData.length);
        let min = volumeData[0];
        let max = volumeData[0];
        
        // Find min/max
        for (let i = 0; i < volumeData.length; i++) {
          min = Math.min(min, volumeData[i]);
          max = Math.max(max, volumeData[i]);
        }
        
        console.log(`Data range: ${min} to ${max}`);
        
        // Normalize to 0-1
        const range = max - min || 1;
        for (let i = 0; i < volumeData.length; i++) {
          normalizedData[i] = (volumeData[i] - min) / range;
        }

        console.log('Normalized data created:', {
          length: normalizedData.length,
          sampleValues: Array.from(normalizedData.slice(0, 10))
        });
        
        setDataInfo({ 
          x, y, z, 
          dataLength: volumeData.length, 
          originalShape: dataSlice.shape, 
          min, max,
          normalizedData 
        });

      } catch(e) {
        console.error('Error loading data:', e);
        if(e instanceof Error) setError(e.message);
      }
    };
    loadData();
  }, [source]);

  if(error) return <div style={{color: 'red'}}>Error: {error}</div>
  if(!dataInfo) return <div>Loading volume data...</div>

  return (
    <div style={{ height, width, background: 'black' }}>
      <div style={{ color: 'white', padding: '10px', fontSize: '12px' }}>
        {dataInfo && (
          <div>
            Texture: {dataInfo.x}×{dataInfo.y}×{dataInfo.z} | 
            Data: {dataInfo.dataLength} values | 
            Range: {dataInfo.min} - {dataInfo.max} |
            Original: {dataInfo.originalShape?.join('×')}
          </div>
        )}
      </div>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <VolumeViewer dataInfo={dataInfo} />
      </Canvas>
    </div>
  );
};

export default MacroViewer;