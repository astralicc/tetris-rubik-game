import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

export function SliceGlow() {
  const sliceGlow = useGameStore((state) => state.sliceGlow);
  const meshRef = useRef<THREE.LineSegments>(null);

  useFrame(() => {
    if (!meshRef.current || !sliceGlow) return;
    const elapsed = Date.now() - sliceGlow.timestamp;
    const duration = 250; // ms
    if (elapsed > duration) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;
    const opacity = 1 - elapsed / duration;
    (meshRef.current.material as THREE.LineBasicMaterial).opacity = opacity;
  });

  if (!sliceGlow) return null;

  // Compute bounding box dimensions for the slice
  const isWide = Boolean(sliceGlow.isWide);
  const layerThickness = isWide ? 2.05 : 1.05;

  const size: [number, number, number] = [
    sliceGlow.axis === 'x' ? layerThickness : 3.1,
    sliceGlow.axis === 'y' ? layerThickness : 3.1,
    sliceGlow.axis === 'z' ? layerThickness : 3.1,
  ];

  const pos: [number, number, number] = [
    sliceGlow.axis === 'x' ? sliceGlow.sliceCoord : 0,
    sliceGlow.axis === 'y' ? sliceGlow.sliceCoord : 0,
    sliceGlow.axis === 'z' ? sliceGlow.sliceCoord : 0,
  ];

  return (
    <lineSegments ref={meshRef} position={pos}>
      <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
      <lineBasicMaterial
        color="#00FFFF"
        transparent
        opacity={1}
        linewidth={3}
      />
    </lineSegments>
  );
}

