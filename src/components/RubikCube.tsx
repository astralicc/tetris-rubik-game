import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';
import { getShapeBounds, getTwistRotation, isCubieInFaceSlice, RUBIK_COLORS } from '../utils/rubik';
import type { RotationAxis } from '../types/game';
import { sound } from '../utils/audio';
import { SliceGlow } from './SliceGlow';
import { TwistParticles } from './TwistParticles';

const CHASSIS_SIZE = 0.94;
const STICKER_SIZE = 0.84;
const STICKER_OFFSET = CHASSIS_SIZE / 2 + 0.002; // 0.472

const CHASSIS_GEO = new THREE.BoxGeometry(CHASSIS_SIZE, CHASSIS_SIZE, CHASSIS_SIZE);
const STICKER_GEO = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);

const CHASSIS_MAT = new THREE.MeshStandardMaterial({
  color: '#0d0e12',
  roughness: 0.65,
  metalness: 0.1,
});

const FACE_CONFIGS: {
  pos: [number, number, number];
  rot: [number, number, number];
}[] = [
  { pos: [STICKER_OFFSET, 0, 0], rot: [0, Math.PI / 2, 0] },     // 0: +X Right
  { pos: [-STICKER_OFFSET, 0, 0], rot: [0, -Math.PI / 2, 0] },   // 1: -X Left
  { pos: [0, STICKER_OFFSET, 0], rot: [-Math.PI / 2, 0, 0] },    // 2: +Y Top
  { pos: [0, -STICKER_OFFSET, 0], rot: [Math.PI / 2, 0, 0] },    // 3: -Y Bottom
  { pos: [0, 0, STICKER_OFFSET], rot: [0, 0, 0] },               // 4: +Z Front
  { pos: [0, 0, -STICKER_OFFSET], rot: [0, Math.PI, 0] },        // 5: -Z Back
];

// Exact isometric arcade view angles matching the Blender 3D concept video
// Pitch: +18.3 deg (+0.32 rad) looking down onto top face
// Yaw: +11.5 deg (+0.20 rad) revealing the isometric side face on the left
// Roll: 0.00 deg strictly upright - vertical edges stay 100% 90.00° parallel to 2D grid columns!
const PITCH = 0.32;
const YAW = 0.20;
const ROLL = 0.0;
const CUBE_SCALE = 0.86;
const CAM_Z = 26.05;

const BLENDER_VIDEO_ROTATION = new THREE.Euler(PITCH, YAW, ROLL, 'YXZ');
const ROTATION_MAT = new THREE.Matrix4().makeRotationFromEuler(BLENDER_VIDEO_ROTATION);

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function RubikCube() {
  const cubePosition = useGameStore((state) => state.cubePosition);
  const cubiesData = useGameStore((state) => state.cubies);
  const currentShape = useGameStore((state) => state.currentShape);
  const activeTwist = useGameStore((state) => state.activeTwist);
  const finishTwist = useGameStore((state) => state.finishTwist);
  const activeGlobalRotation = useGameStore((state) => state.activeGlobalRotation);
  const finishGlobalRotation = useGameStore((state) => state.finishGlobalRotation);

  const isHardDropping = useGameStore((state) => state.isHardDropping);
  const hardDropTargetY = useGameStore((state) => state.hardDropTargetY);
  const finishHardDrop = useGameStore((state) => state.finishHardDrop);
  const triggerScreenShake = useGameStore((state) => state.triggerScreenShake);
  const spawnImpactParticles = useGameStore((state) => state.spawnImpactParticles);

  const outerGroupRef = useRef<THREE.Group>(null);
  const mainGroupRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const cubieRefs = useRef<Map<number, THREE.Group>>(new Map());

  // Dynamic bounds calculation
  const bounds = useMemo(() => getShapeBounds(cubiesData), [cubiesData]);

  const centerOffsetX = (bounds.minX + bounds.maxX) / 2;
  const centerOffsetY = (bounds.minY + bounds.maxY) / 2;
  const centerOffsetZ = (bounds.minZ + bounds.maxZ) / 2;

  // Exact front-face alignment compensation:
  // In local space, the front face (+Z) center is at zFrontLocal
  const zFrontLocal = ((bounds.depth - 1) / 2 + STICKER_OFFSET) * CUBE_SCALE;
  const frontOffsetRot = useMemo(() => {
    const v = new THREE.Vector3(0, 0, zFrontLocal);
    v.applyMatrix4(ROTATION_MAT);
    return v;
  }, [zFrontLocal]);

  // Target on 2D grid
  const targetGridX = cubePosition.x + bounds.width / 2 - 5;
  const targetGridY = 10 - (cubePosition.y + bounds.height / 2);

  // Perspective foreshortening factor for the front face
  const zFrontWorld = frontOffsetRot.z;
  const perspScale = (CAM_Z - zFrontWorld) / CAM_Z;

  // Group position that places front face center directly over targetGridX and targetGridY
  const unconstrainedWorldX = targetGridX * perspScale - frontOffsetRot.x;
  const targetWorldY = targetGridY * perspScale - frontOffsetRot.y;

  // Boundary confinement: guarantee the entire 3D chassis never clips outside [-4.92, +4.92]
  const targetWorldX = useMemo(() => {
    const halfSize = (CHASSIS_SIZE / 2) * CUBE_SCALE;
    let minProjX = Infinity;
    let maxProjX = -Infinity;

    for (const cubie of cubiesData) {
      const localX = (cubie.currentPos[0] - centerOffsetX) * CUBE_SCALE;
      const localY = (cubie.currentPos[1] - centerOffsetY) * CUBE_SCALE;
      const localZ = (cubie.currentPos[2] - centerOffsetZ) * CUBE_SCALE;

      // Check 8 corners of each cubie
      for (const dx of [-halfSize, halfSize]) {
        for (const dy of [-halfSize, halfSize]) {
          for (const dz of [-halfSize, halfSize]) {
            const rx =
              ROTATION_MAT.elements[0] * (localX + dx) +
              ROTATION_MAT.elements[4] * (localY + dy) +
              ROTATION_MAT.elements[8] * (localZ + dz);
            const rz =
              ROTATION_MAT.elements[2] * (localX + dx) +
              ROTATION_MAT.elements[6] * (localY + dy) +
              ROTATION_MAT.elements[10] * (localZ + dz);
            const worldX = rx + unconstrainedWorldX;
            const worldZ = rz;
            const projX = (worldX * CAM_Z) / (CAM_Z - worldZ);
            if (projX < minProjX) minProjX = projX;
            if (projX > maxProjX) maxProjX = projX;
          }
        }
      }
    }

    let clampedX = unconstrainedWorldX;
    if (minProjX < -4.92) {
      clampedX += -4.92 - minProjX;
    } else if (maxProjX > 4.92) {
      clampedX -= maxProjX - 4.92;
    }
    return clampedX;
  }, [cubiesData, centerOffsetX, centerOffsetY, centerOffsetZ, unconstrainedWorldX]);

  // Smooth position damping and squash/stretch physics refs
  const renderedPos = useRef<{ x: number; y: number }>({ x: targetWorldX, y: targetWorldY });
  const squashScale = useRef<{ x: number; y: number; z: number }>({ x: 1, y: 1, z: 1 });
  const lastShapeRef = useRef<string>(currentShape);

  // Velocity and dynamic directional motion blur refs
  const prevPosRef = useRef<{ x: number; y: number }>({ x: targetWorldX, y: targetWorldY });
  const currentBlurRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hard drop transition and elastic bounce state
  const dropAnimRef = useRef<{
    startY: number;
    targetY: number;
    startTime: number;
    dropDuration: number;
    bounceStartTime?: number;
    bounceDuration: number;
  } | null>(null);

  const twistAnimRef = useRef<{
    startTime: number;
    duration: number;
    axis: THREE.Vector3;
    targetAngle: number;
    attachedCubieIds: number[];
  } | null>(null);

  const globalRotAnimRef = useRef<{
    startTime: number;
    duration: number;
    axis: THREE.Vector3;
    axisName: RotationAxis;
    targetAngle: number;
  } | null>(null);

  // Instantly align position when a new piece spawns at the top
  useEffect(() => {
    if (cubePosition.y === 0 || lastShapeRef.current !== currentShape) {
      lastShapeRef.current = currentShape;
      renderedPos.current.x = targetWorldX;
      renderedPos.current.y = targetWorldY;
      prevPosRef.current.x = targetWorldX;
      prevPosRef.current.y = targetWorldY;
      currentBlurRef.current = { x: 0, y: 0 };
      squashScale.current = { x: 1, y: 1, z: 1 };
      dropAnimRef.current = null;

      const feBlur = document.getElementById('rubik-motion-blur-fe');
      const canvasWrapper = document.getElementById('rubik-canvas-wrapper');
      if (feBlur && canvasWrapper) {
        feBlur.setAttribute('stdDeviation', '0 0');
        canvasWrapper.style.filter = 'none';
      }
    }
  }, [currentShape, cubePosition.y, targetWorldX, targetWorldY]);

  // Trigger high-speed downward plunge & elastic impact bounce on Hard Drop
  useEffect(() => {
    if (isHardDropping && hardDropTargetY !== null) {
      const rawTargetY = 10 - (hardDropTargetY + bounds.height / 2);
      const targetY = rawTargetY * perspScale - frontOffsetRot.y;
      dropAnimRef.current = {
        startY: renderedPos.current.y,
        targetY,
        startTime: performance.now(),
        dropDuration: 125, // 125ms snappy downward plunge
        bounceDuration: 135, // 135ms elastic impact bounce & squash
      };
    }
  }, [isHardDropping, hardDropTargetY, bounds.height, perspScale, frontOffsetRot.y]);

  // Handle beginning of layer twist
  useEffect(() => {
    if (!activeTwist || !pivotRef.current || !mainGroupRef.current) return;

    const { axis, angle } = getTwistRotation(
      activeTwist.face,
      activeTwist.direction,
      currentShape
    );

    const attachedIds: number[] = [];
    cubiesData.forEach((cubie) => {
      if (isCubieInFaceSlice(cubie, activeTwist.face, bounds, currentShape)) {
        attachedIds.push(cubie.id);
        const group = cubieRefs.current.get(cubie.id);
        if (group && pivotRef.current) {
          pivotRef.current.attach(group);
        }
      }
    });

    twistAnimRef.current = {
      startTime: performance.now(),
      duration: 150,
      axis,
      targetAngle: angle,
      attachedCubieIds: attachedIds,
    };
  }, [activeTwist, cubiesData, bounds, currentShape]);

  // Handle beginning of whole cube rotation (pitch, yaw, roll)
  useEffect(() => {
    if (!activeGlobalRotation || !mainGroupRef.current) return;

    const vAxis =
      activeGlobalRotation.axis === 'x'
        ? new THREE.Vector3(1, 0, 0)
        : activeGlobalRotation.axis === 'y'
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(0, 0, 1);
    const targetAngle = activeGlobalRotation.direction * (Math.PI / 2);

    globalRotAnimRef.current = {
      startTime: performance.now(),
      duration: 135, // 135ms snappy rotation (~4 frames at 30fps)
      axis: vAxis,
      axisName: activeGlobalRotation.axis,
      targetAngle,
    };
  }, [activeGlobalRotation]);

  // Frame loop driving smooth damping, layer twists, and downward drop physics
  useFrame((_, delta) => {
    const now = performance.now();

    // 1. Hard Drop Downward Slam & Elastic Bounce Physics
    const dropAnim = dropAnimRef.current;
    if (dropAnim) {
      const elapsedDrop = now - dropAnim.startTime;
      const dropProgress = Math.min(1, elapsedDrop / dropAnim.dropDuration);

      if (dropProgress < 1) {
        // Phase 1: High speed downward acceleration with kinetic stretch
        const eased = dropProgress * dropProgress; // Ease-in quad
        renderedPos.current.y = dropAnim.startY + (dropAnim.targetY - dropAnim.startY) * eased;
        squashScale.current.y = 1 + 0.16 * dropProgress;
        squashScale.current.x = 1 - 0.08 * dropProgress;
        squashScale.current.z = 1 - 0.08 * dropProgress;
      } else {
        // Ground reached: trigger impact sound, screen shake, and retro dust particles on impact
        if (!dropAnim.bounceStartTime) {
          dropAnim.bounceStartTime = now;
          renderedPos.current.y = dropAnim.targetY;
          sound.playDrop();
          triggerScreenShake(2.5);
          spawnImpactParticles(cubiesData[0]?.faceColors[4] || '#FACC15');
        }

        const elapsedBounce = now - dropAnim.bounceStartTime;
        const bounceProgress = Math.min(1, elapsedBounce / dropAnim.bounceDuration);

        if (bounceProgress < 1) {
          // Phase 2: Elastic impact bounce & squash
          const bounceCurve = Math.sin(Math.PI * bounceProgress) * (1 - bounceProgress);
          renderedPos.current.y = dropAnim.targetY + bounceCurve * 0.24;

          // Squash compresses on contact then smoothly springs back
          const squashCurve = Math.sin(Math.PI * (1 - bounceProgress)) * 0.16 * (1 - bounceProgress);
          squashScale.current.y = 1 - squashCurve;
          squashScale.current.x = 1 + squashCurve * 0.5;
          squashScale.current.z = 1 + squashCurve * 0.5;
        } else {
          // Drop sequence completed
          renderedPos.current.y = dropAnim.targetY;
          squashScale.current = { x: 1, y: 1, z: 1 };
          dropAnimRef.current = null;
          finishHardDrop();
        }
      }

      // Smoothly follow lateral X during fall
      renderedPos.current.x = THREE.MathUtils.damp(renderedPos.current.x, targetWorldX, 28, delta);
    } else {
      // Normal gameplay: snappy tactile damping for lateral moves (A/D) and soft drop (S/Down)
      renderedPos.current.x = THREE.MathUtils.damp(renderedPos.current.x, targetWorldX, 28, delta);
      renderedPos.current.y = THREE.MathUtils.damp(renderedPos.current.y, targetWorldY, 24, delta);
    }

    // Velocity & Motion Blur Calculation
    const prevX = prevPosRef.current.x;
    const prevY = prevPosRef.current.y;
    const curX = renderedPos.current.x;
    const curY = renderedPos.current.y;
    prevPosRef.current.x = curX;
    prevPosRef.current.y = curY;

    // Velocity in world units / sec
    const safeDelta = Math.max(0.001, Math.min(0.08, delta));
    const vx = (curX - prevX) / safeDelta;
    const vy = (curY - prevY) / safeDelta;

    // Screen pixel velocity estimate (playfield width ~260px / 10 cols = ~26px per unit)
    const pxVx = Math.abs(vx) * 26;
    const pxVy = Math.abs(vy) * 26;
    const translationBlurX = Math.min(8.0, pxVx * 0.026);
    const translationBlurY = Math.min(13.0, pxVy * 0.025);

    // 2. Whole Cube Rotation Animation & Dynamic Motion Blur
    let globalRotBlurX = 0;
    let globalRotBlurY = 0;
    const globalRot = globalRotAnimRef.current;

    if (globalRot && mainGroupRef.current) {
      const elapsed = now - globalRot.startTime;
      const progress = Math.min(1, elapsed / globalRot.duration);
      const easedProgress = easeInOutCubic(progress);

      const currentAngle = globalRot.targetAngle * easedProgress;
      mainGroupRef.current.quaternion.setFromAxisAngle(globalRot.axis, currentAngle);

      // Bell curve: peak angular velocity at mid-point (progress = 0.5)
      const rotSpeed = Math.sin(progress * Math.PI);

      if (globalRot.axisName === 'y') {
        // Yaw: strong horizontal streak across screen
        globalRotBlurX = 15.0 * rotSpeed;
        globalRotBlurY = 2.0 * rotSpeed;
      } else if (globalRot.axisName === 'x') {
        // Pitch: strong vertical streak across screen
        globalRotBlurX = 2.0 * rotSpeed;
        globalRotBlurY = 17.0 * rotSpeed;
      } else {
        // Roll (Z): circular / diagonal streak in XY plane
        globalRotBlurX = 12.0 * rotSpeed;
        globalRotBlurY = 12.0 * rotSpeed;
      }

      if (progress >= 1) {
        mainGroupRef.current.quaternion.identity();
        globalRotAnimRef.current = null;
        finishGlobalRotation();
      }
    }

    // 3. Layer Twist Animation & Motion Blur
    let twistBlurX = 0;
    let twistBlurY = 0;
    const anim = twistAnimRef.current;
    if (anim && pivotRef.current && mainGroupRef.current) {
      const elapsed = now - anim.startTime;
      const progress = Math.min(1, elapsed / anim.duration);
      const easedProgress = easeInOutCubic(progress);

      const currentAngle = anim.targetAngle * easedProgress;
      pivotRef.current.quaternion.setFromAxisAngle(anim.axis, currentAngle);

      const rotSpeed = Math.sin(progress * Math.PI);
      if (activeTwist?.axis === 'y') {
        twistBlurX = 8.0 * rotSpeed;
        twistBlurY = 1.5 * rotSpeed;
      } else if (activeTwist?.axis === 'x') {
        twistBlurX = 1.5 * rotSpeed;
        twistBlurY = 9.0 * rotSpeed;
      } else {
        twistBlurX = 6.0 * rotSpeed;
        twistBlurY = 6.0 * rotSpeed;
      }

      if (progress >= 1) {
        anim.attachedCubieIds.forEach((id) => {
          const group = cubieRefs.current.get(id);
          if (group && mainGroupRef.current) {
            mainGroupRef.current.attach(group);
          }
        });

        pivotRef.current.quaternion.identity();
        twistAnimRef.current = null;
        finishTwist();
      }
    }

    // Directional motion blur target (stdDeviation in CSS px)
    const targetBlurX = Math.max(translationBlurX, globalRotBlurX, twistBlurX);
    const targetBlurY = Math.max(translationBlurY, globalRotBlurY, twistBlurY);

    // Smooth damp for natural trailing persistence & fade-out
    currentBlurRef.current.x = THREE.MathUtils.damp(currentBlurRef.current.x, targetBlurX, 35, safeDelta);
    currentBlurRef.current.y = THREE.MathUtils.damp(currentBlurRef.current.y, targetBlurY, 35, safeDelta);

    const bx = currentBlurRef.current.x;
    const by = currentBlurRef.current.y;

    // Aerodynamic velocity stretch and momentum pulse:
    if (globalRotAnimRef.current) {
      const rotSpeed = Math.sin(
        Math.min(1, (now - globalRotAnimRef.current.startTime) / globalRotAnimRef.current.duration) * Math.PI
      );
      const pulse = rotSpeed * 0.04;
      squashScale.current.x = 1 + pulse;
      squashScale.current.y = 1 + pulse;
      squashScale.current.z = 1 + pulse;
    } else if (!dropAnimRef.current) {
      const stretchX = Math.min(0.18, Math.abs(vx) * 0.008);
      const stretchY = Math.min(0.24, Math.abs(vy) * 0.008);
      squashScale.current.x = 1 + stretchX - stretchY * 0.3;
      squashScale.current.y = 1 + stretchY - stretchX * 0.3;
      squashScale.current.z = 1 - (stretchX + stretchY) * 0.15;
    }

    if (outerGroupRef.current) {
      outerGroupRef.current.position.set(renderedPos.current.x, renderedPos.current.y, 0);
      outerGroupRef.current.scale.set(squashScale.current.x, squashScale.current.y, squashScale.current.z);
      // Subtle inertia tilt when moving left/right
      outerGroupRef.current.rotation.z = -THREE.MathUtils.clamp(vx * 0.003, -0.05, 0.05);
    }

    // Apply directional motion blur directly to Canvas container
    const feBlur = document.getElementById('rubik-motion-blur-fe');
    const canvasWrapper = document.getElementById('rubik-canvas-wrapper');
    if (feBlur && canvasWrapper) {
      if (bx > 0.12 || by > 0.12) {
        feBlur.setAttribute('stdDeviation', `${bx.toFixed(2)} ${by.toFixed(2)}`);
        canvasWrapper.style.filter = 'url(#rubik-motion-blur)';
      } else {
        canvasWrapper.style.filter = 'none';
      }
    }

    if (!anim) {
      cubiesData.forEach((cubie) => {
        const group = cubieRefs.current.get(cubie.id);
        if (group) {
          group.position.set(
            cubie.currentPos[0] - centerOffsetX,
            cubie.currentPos[1] - centerOffsetY,
            cubie.currentPos[2] - centerOffsetZ
          );
          group.quaternion.set(...cubie.rotation);
        }
      });
    }
  });

  return (
    <group ref={outerGroupRef}>
      {/* 3D Isometric View: Exact perspective matching Blender 3D concept video */}
      <group rotation={BLENDER_VIDEO_ROTATION} scale={CUBE_SCALE}>
        <group ref={mainGroupRef}>
          <group ref={pivotRef} position={[0, 0, 0]} />

          {cubiesData.map((cubie) => (
            <CubieMesh
              key={cubie.id}
              cubie={cubie}
              groupRef={(el) => {
                if (el) cubieRefs.current.set(cubie.id, el);
                else cubieRefs.current.delete(cubie.id);
              }}
            />
          ))}

          <SliceGlow />
          <TwistParticles />
        </group>
      </group>
    </group>
  );
}

interface CubieMeshProps {
  cubie: (typeof useGameStore extends { getState: () => { cubies: (infer C)[] } } ? C : never);
  groupRef: (group: THREE.Group | null) => void;
}

function CubieMesh({ cubie, groupRef }: CubieMeshProps) {
  return (
    <group ref={groupRef}>
      {/* Matte Black Plastic Inner Chassis */}
      <mesh geometry={CHASSIS_GEO} material={CHASSIS_MAT} castShadow receiveShadow>
        <Edges threshold={15} color="#000000" lineWidth={2} />
      </mesh>

      {/* Recessed Glossy Sticker Plates for Each Active Face */}
      {FACE_CONFIGS.map((cfg, f) => {
        const color = cubie.faceColors[f];
        if (!color || color === RUBIK_COLORS.CORE || color === '#111827' || color === '#0d0e12') {
          return null;
        }

        return (
          <mesh
            key={f}
            geometry={STICKER_GEO}
            position={cfg.pos}
            rotation={cfg.rot}
          >
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.22}
              roughness={0.16}
              metalness={0.06}
            />
            <Edges threshold={15} color="#050507" lineWidth={1.5} />
          </mesh>
        );
      })}
    </group>
  );
}
