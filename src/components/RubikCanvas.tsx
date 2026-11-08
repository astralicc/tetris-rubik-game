import { Canvas } from '@react-three/fiber';
import { RubikCube } from './RubikCube';

export function RubikCanvas() {
  return (
    <>
      {/* Dynamic Directional SVG Motion Blur Filter Definition */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="rubik-motion-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur id="rubik-motion-blur-fe" in="SourceGraphic" stdDeviation="0 0" />
          </filter>
        </defs>
      </svg>

      <div
        id="rubik-canvas-wrapper"
        className="absolute inset-0 pointer-events-none z-10"
        style={{ willChange: 'filter' }}
      >
        <Canvas
          camera={{
            position: [0, 0, 26.05],
            fov: 42,
            near: 0.1,
            far: 100,
          }}
          gl={{ antialias: true, alpha: true }}
        >
          {/* High-contrast studio lighting matching the Blender 3D concept */}
          <ambientLight intensity={1.15} />
          <directionalLight position={[6, 12, 10]} intensity={2.2} castShadow />
          <directionalLight position={[-8, -4, -6]} intensity={0.5} />
          <directionalLight position={[0, 0, 15]} intensity={0.6} />

          <RubikCube />
        </Canvas>
      </div>
    </>
  );
}
