import React, { FC, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as zarrita from 'zarrita';

import VolumeViewer from './volumeviewer'; // Assuming this is in the same directory
import { useZarrStore } from '../../contexts/ZarrStoreContext';
import type { MacroViewerProps } from '../../types/macroviewer';


const MacroViewer: FC<MacroViewerProps> = ({
  height,
  width,
}) => {
  const { store, root, omeData, availableResolutions, source } = useZarrStore()
  const [error, setError] = useState<string | null>(null);
  const [dataInfo, setDataInfo] = useState<any>(null);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!store || !root || !omeData || availableResolutions.length === 0) {
        console.log('MacroViewer: Store not ready yet');
        return;
      }

      // Add a delay to let CrossViewer load first
      setIsWaiting(true);
      console.log('MacroViewer: Waiting 1 second to give CrossViewer priority...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsWaiting(false);

      try {
        console.log('MacroViewer: Loading lowest resolution for 3D visualization');
        
        const multiscales = omeData.multiscales?.[0];
        if (!multiscales) {
          throw new Error("Valid multiscale metadata not found.");
        }

        // Get axes information
        const axes = multiscales.axes.map(axis => axis.name);
        console.log('MacroViewer: Axes found:', axes);

        // Always use the lowest resolution (last in the list) for 3D view
        const lowestResPath = availableResolutions[availableResolutions.length - 1];
        console.log('MacroViewer: Loading lowest resolution path:', lowestResPath);
        
        const arr = await zarrita.open(root.resolve(lowestResPath));
        if (!(arr instanceof zarrita.Array)) {
          throw new Error(`Expected an Array, but got ${arr.kind}`);
        }

        console.log("MacroViewer: Array loaded:", {
          shape: arr.shape,
          dtype: arr.dtype,
          chunks: arr.chunks
        });
        
        // Get the full data chunk for this low-resolution array
        const dataSlice = await zarrita.get(arr);
        const data = dataSlice.data as Uint16Array;
        
        console.log('MacroViewer: Data loaded:', {
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

        console.log('MacroViewer: Dimensions extracted:', dims);

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

        console.log(`MacroViewer: Spatial dimensions: X=${x}, Y=${y}, Z=${z}`);

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

        console.log(`MacroViewer: Using ${volumeData.length} values for ${x}x${y}x${z} volume`);

        // Normalize the data to 0-1 range for better visibility
        const normalizedData = new Float32Array(volumeData.length);
        let min = volumeData[0];
        let max = volumeData[0];
        
        // Find min/max
        for (let i = 0; i < volumeData.length; i++) {
          min = Math.min(min, volumeData[i]);
          max = Math.max(max, volumeData[i]);
        }
        
        console.log(`MacroViewer: Data range: ${min} to ${max}`);
        
        // Normalize to 0-1
        const range = max - min || 1;
        for (let i = 0; i < volumeData.length; i++) {
          normalizedData[i] = (volumeData[i] - min) / range;
        }

        console.log('MacroViewer: Normalized data created:', {
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
        console.error('MacroViewer: Error loading data:', e);
        if(e instanceof Error) setError(e.message);
      }
    };
    loadData();
  }, [store, root, omeData, availableResolutions]);

  if(error) return <div style={{color: 'red'}}>Error: {error}</div>
  if(isWaiting) return <div style={{color: 'white', padding: '10px'}}>⏳ Waiting for CrossViewer to load first...</div>
  if(!dataInfo) return <div style={{color: 'white', padding: '10px'}}>Loading volume data...</div>

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