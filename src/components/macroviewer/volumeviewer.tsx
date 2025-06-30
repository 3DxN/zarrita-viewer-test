import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';


const VolumeRenderer = ({ dataInfo }: { dataInfo: any }) => {
  const mesh = useRef<THREE.Mesh>(null);

  // Create a 3D texture using the same approach as 2D
  const texture3D = useMemo(() => {
    if (!dataInfo || !dataInfo.normalizedData) return null;
    
    const { x, y, z, normalizedData } = dataInfo;
    
    console.log(`Creating 3D texture: ${x}x${y}x${z}, ${normalizedData.length} values`);
    
    // Create 3D texture exactly like 2D but with all dimensions
    const tex = new THREE.Data3DTexture(normalizedData, x, y, z);
    tex.format = THREE.RedFormat;
    tex.type = THREE.FloatType;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.wrapR = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    
    return tex;
  }, [dataInfo]);

  if (!texture3D) {
    return (
      <mesh ref={mesh}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
    );
  }

  // Use basic material with the 3D texture - let Three.js handle it
  return (
    <mesh ref={mesh}>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial 
        map={texture3D}
        side={THREE.DoubleSide}
        transparent={true} 
        opacity={0.8}
      />
    </mesh>
  );
};

export default VolumeRenderer;