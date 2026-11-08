import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

export function TwistParticles() {
  const particles = useGameStore((state) => state.particles);
  const clearParticles = useGameStore((state) => state.clearParticles);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current || particles.length === 0) return;

    let allDead = true;
    groupRef.current.children.forEach((child, idx) => {
      const p = particles[idx];
      if (!p) return;

      if (p.life > 0) {
        allDead = false;
        p.life -= delta * 3.5;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.z += p.vz * delta;
        p.vy -= 9.8 * delta * 0.5; // slight gravity

        child.position.set(p.x, p.y, p.z);
        child.scale.setScalar(Math.max(0.01, p.size * p.life));
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          (mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life);
        }
      } else {
        child.visible = false;
      }
    });

    if (allDead) {
      clearParticles();
    }
  });

  if (particles.length === 0) return null;

  return (
    <group ref={groupRef}>
      {particles.map((p) => (
        <mesh key={p.id} position={[p.x, p.y, p.z]}>
          <planeGeometry args={[0.2, 0.2]} />
          <meshBasicMaterial
            color={p.color}
            transparent
            opacity={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

