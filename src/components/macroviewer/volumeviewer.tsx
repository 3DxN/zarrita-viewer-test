import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';


const VolumeRenderer = ({ dataInfo }: { dataInfo: any }) => {
  const mesh = useRef<THREE.Mesh>(null);

  console.log('VolumeRenderer received dataInfo:', dataInfo ? 'YES' : 'NO');

  // Create multiple 2D slice textures from the 3D data
  const sliceTextures = useMemo(() => {
    if (!dataInfo || !dataInfo.normalizedData) {
      console.log('VolumeRenderer: No dataInfo or normalizedData');
      return null;
    }
    
    const { x, y, z, normalizedData } = dataInfo;
    
    console.log(`VolumeRenderer: Creating slice textures from: ${x}x${y}x${z}, ${normalizedData.length} values`);
    
    try {
      // Take middle slice (z/2) for now
      const middleZ = Math.floor(z / 2);
      const sliceSize = x * y;
      const sliceStart = middleZ * sliceSize;
      const sliceData = normalizedData.slice(sliceStart, sliceStart + sliceSize);
      
      console.log(`VolumeRenderer: Using middle slice ${middleZ}, data length: ${sliceData.length}`);
      console.log('VolumeRenderer: Sample values:', Array.from(sliceData.slice(0, 5)));
      
      const tex = new THREE.DataTexture(sliceData, x, y);
      tex.format = THREE.RedFormat;
      tex.type = THREE.FloatType;
      tex.minFilter = THREE.NearestFilter;
      tex.magFilter = THREE.NearestFilter;
      tex.needsUpdate = true;
      
      console.log('VolumeRenderer: 2D slice texture created successfully');
      return tex;
    } catch (error) {
      console.error('VolumeRenderer: Failed to create slice texture:', error);
      return null;
    }
  }, [dataInfo]);

  if (!sliceTextures) {
    console.log('VolumeRenderer: Rendering fallback red wireframe');
    return (
      <mesh ref={mesh}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
    );
  }

  console.log('VolumeRenderer: Rendering textured cube with 2D slice');
  // Use the 2D slice texture on the cube faces
  return (
    <mesh ref={mesh}>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial 
        map={sliceTextures}
        side={THREE.DoubleSide}
        transparent={true} 
        opacity={0.8}
      />
    </mesh>
  );
};

export default VolumeRenderer;