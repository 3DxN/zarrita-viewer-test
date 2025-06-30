import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';


const VolumeRenderer = ({ dataInfo }: { dataInfo: any }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create ALL slice textures from the 3D data
  const allSlices = useMemo(() => {
    if (!dataInfo || !dataInfo.normalizedData) {
      return null;
    }
    
    const { x, y, z, normalizedData } = dataInfo;
        
    try {
      const slices = [];
      const sliceSize = x * y;
      
      // Calculate proper voxel spacing for accurate 3D structure
      const voxelSpacing = 2.0 / Math.max(x, y, z); // Normalize to fit in 2x2x2 space
      const totalZDepth = (z - 1) * voxelSpacing;
      
      console.log(`VolumeRenderer: Voxel spacing: ${voxelSpacing}, Total Z depth: ${totalZDepth}`);
      
      // Create texture for EVERY Z slice
      for (let zi = 0; zi < z; zi++) {
        const sliceStart = zi * sliceSize;
        const sliceData = normalizedData.slice(sliceStart, sliceStart + sliceSize);
        
        console.log(`VolumeRenderer: Creating slice ${zi}/${z}, data length: ${sliceData.length}`);
        
        const tex = new THREE.DataTexture(sliceData, x, y);
        tex.format = THREE.RedFormat;
        tex.type = THREE.FloatType;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        
        // Position slices with exact voxel spacing
        const zPosition = (zi * voxelSpacing) - (totalZDepth / 2);
        
        slices.push({
          texture: tex,
          position: zPosition,
          slice: zi,
          opacity: 0.3
        });
      }
      
      console.log(`VolumeRenderer: Created ${slices.length} slice textures successfully`);
      console.log(`VolumeRenderer: Z positions range from ${slices[0].position} to ${slices[slices.length-1].position}`);
      return slices;
      
    } catch (error) {
      console.error('VolumeRenderer: Failed to create slice textures:', error);
      return null;
    }
  }, [dataInfo]);

  if (!allSlices) {
    console.log('VolumeRenderer: Rendering fallback red wireframe');
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
    );
  }

  console.log(`VolumeRenderer: Rendering ${allSlices.length} slice planes with proper voxel spacing`);
  
  // Render ALL slices as separate transparent planes with proper spacing
  return (
    <group ref={groupRef}>
      {allSlices.map((slice, index) => (
        <mesh key={index} position={[0, 0, slice.position]}>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial 
            map={slice.texture}
            transparent={true}
            opacity={slice.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

export default VolumeRenderer;