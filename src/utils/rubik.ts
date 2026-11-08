import * as THREE from 'three';
import type { CubieData, LayerTwist, RotationAxis, RubikFace, CubeShapeType, CubeShapeMeta } from '../types/game';

// Face colors standard hex
export const RUBIK_COLORS = {
  R: '#EF4444', // Right (+X)  - Vibrant Red
  L: '#F97316', // Left (-X)   - Vibrant Orange
  U: '#F8FAFC', // Up (+Y)     - Clean White
  D: '#EAB308', // Down (-Y)   - Bright Yellow
  F: '#22C55E', // Front (+Z)  - Emerald Green
  B: '#3B82F6', // Back (-Z)   - Electric Blue
  CORE: '#111827', // Inner unexposed surfaces - Dark Slate
};

export const LOCAL_FACE_NORMALS: [number, number, number][] = [
  [1, 0, 0],  // 0: +X (Right)
  [-1, 0, 0], // 1: -X (Left)
  [0, 1, 0],  // 2: +Y (Up)
  [0, -1, 0], // 3: -Y (Down)
  [0, 0, 1],  // 4: +Z (Front)
  [0, 0, -1], // 5: -Z (Back)
];

export const SHAPES_META: Record<CubeShapeType, CubeShapeMeta> = {
  '3x3': {
    type: '3x3',
    name: '3x3x3 CUBE',
    width: 3,
    height: 3,
    depth: 3,
  },
  '2x2': {
    type: '2x2',
    name: '2x2x2 POCKET',
    width: 2,
    height: 2,
    depth: 2,
  },
  'L_SHAPE': {
    type: 'L_SHAPE',
    name: '3D L-SHAPE',
    width: 2,
    height: 3,
    depth: 1,
  },
  '2x2x1': {
    type: '2x2x1',
    name: '2x2x1 SLIM',
    width: 2,
    height: 2,
    depth: 1,
  },
  '1x1x2': {
    type: '1x1x2',
    name: '1x1x2 TOWER',
    width: 1,
    height: 2,
    depth: 1,
  },
};

export const ALL_SHAPE_TYPES: CubeShapeType[] = ['2x2', '3x3', 'L_SHAPE', '2x2x1', '1x1x2'];

/**
 * Creates 3x3x3 standard Rubik's cube (27 cubies).
 */
export function create3x3Cubies(): CubieData[] {
  const cubies: CubieData[] = [];
  let id = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        cubies.push({
          id: id++,
          initialPos: [x, y, z],
          currentPos: [x, y, z],
          rotation: [0, 0, 0, 1],
          faceColors: [
            x === 1 ? RUBIK_COLORS.R : RUBIK_COLORS.CORE,
            x === -1 ? RUBIK_COLORS.L : RUBIK_COLORS.CORE,
            y === 1 ? RUBIK_COLORS.U : RUBIK_COLORS.CORE,
            y === -1 ? RUBIK_COLORS.D : RUBIK_COLORS.CORE,
            z === 1 ? RUBIK_COLORS.F : RUBIK_COLORS.CORE,
            z === -1 ? RUBIK_COLORS.B : RUBIK_COLORS.CORE,
          ],
        });
      }
    }
  }
  return cubies;
}

/**
 * Creates 2x2x2 pocket cube (8 cubies).
 */
export function create2x2Cubies(): CubieData[] {
  const cubies: CubieData[] = [];
  let id = 0;
  for (const x of [-0.5, 0.5]) {
    for (const y of [-0.5, 0.5]) {
      for (const z of [-0.5, 0.5]) {
        cubies.push({
          id: id++,
          initialPos: [x, y, z],
          currentPos: [x, y, z],
          rotation: [0, 0, 0, 1],
          faceColors: [
            x > 0 ? RUBIK_COLORS.R : RUBIK_COLORS.CORE,
            x < 0 ? RUBIK_COLORS.L : RUBIK_COLORS.CORE,
            y > 0 ? RUBIK_COLORS.U : RUBIK_COLORS.CORE,
            y < 0 ? RUBIK_COLORS.D : RUBIK_COLORS.CORE,
            z > 0 ? RUBIK_COLORS.F : RUBIK_COLORS.CORE,
            z < 0 ? RUBIK_COLORS.B : RUBIK_COLORS.CORE,
          ],
        });
      }
    }
  }
  return cubies;
}

/**
 * Creates 3D L-Shape polycube (4 cubies in classic Tetris L-mino).
 */
export function createLShapeCubies(): CubieData[] {
  const positions: [number, number, number][] = [
    [-0.5, 1, 0],   // Top of stem
    [-0.5, 0, 0],   // Middle of stem
    [-0.5, -1, 0],  // Bottom of stem
    [0.5, -1, 0],   // Foot of L
  ];

  return positions.map((pos, id) => {
    const [x, y, z] = pos;
    return {
      id,
      initialPos: [x, y, z],
      currentPos: [x, y, z],
      rotation: [0, 0, 0, 1],
      faceColors: [
        x > 0 ? RUBIK_COLORS.R : (x === -0.5 && y !== -1 ? RUBIK_COLORS.R : RUBIK_COLORS.CORE),
        x < 0 ? RUBIK_COLORS.L : RUBIK_COLORS.CORE,
        y === 1 ? RUBIK_COLORS.U : (x === 0.5 && y === -1 ? RUBIK_COLORS.U : RUBIK_COLORS.CORE),
        y === -1 ? RUBIK_COLORS.D : RUBIK_COLORS.CORE,
        RUBIK_COLORS.F,
        RUBIK_COLORS.B,
      ],
    };
  });
}

/**
 * Creates 2x2x1 Slim / Floppy cuboid (4 cubies) with 2x2 face facing front (+Z).
 */
export function create2x2x1Cubies(): CubieData[] {
  const cubies: CubieData[] = [];
  let id = 0;
  for (const x of [-0.5, 0.5]) {
    for (const y of [-0.5, 0.5]) {
      cubies.push({
        id: id++,
        initialPos: [x, y, 0],
        currentPos: [x, y, 0],
        rotation: [0, 0, 0, 1],
        faceColors: [
          x > 0 ? RUBIK_COLORS.R : RUBIK_COLORS.CORE,
          x < 0 ? RUBIK_COLORS.L : RUBIK_COLORS.CORE,
          y > 0 ? RUBIK_COLORS.U : RUBIK_COLORS.CORE,
          y < 0 ? RUBIK_COLORS.D : RUBIK_COLORS.CORE,
          RUBIK_COLORS.F,
          RUBIK_COLORS.B,
        ],
      });
    }
  }
  return cubies;
}

/**
 * Creates 1x1x2 Tower cuboid (2 cubies).
 */
export function create1x1x2Cubies(): CubieData[] {
  const cubies: CubieData[] = [];
  let id = 0;
  for (const y of [-0.5, 0.5]) {
    cubies.push({
      id: id++,
      initialPos: [0, y, 0],
      currentPos: [0, y, 0],
      rotation: [0, 0, 0, 1],
      faceColors: [
        RUBIK_COLORS.R,
        RUBIK_COLORS.L,
        y > 0 ? RUBIK_COLORS.U : RUBIK_COLORS.CORE,
        y < 0 ? RUBIK_COLORS.D : RUBIK_COLORS.CORE,
        RUBIK_COLORS.F,
        RUBIK_COLORS.B,
      ],
    });
  }
  return cubies;
}

/**
 * Factory to create cubies for any supported shape.
 */
export function createShapeCubies(shape: CubeShapeType): CubieData[] {
  switch (shape) {
    case '2x2':
      return create2x2Cubies();
    case 'L_SHAPE':
      return createLShapeCubies();
    case '2x2x1':
      return create2x2x1Cubies();
    case '1x1x2':
      return create1x1x2Cubies();
    case '3x3':
    default:
      return create3x3Cubies();
  }
}

/**
 * Computes bounding box and dimensions for the current cubie configuration.
 */
export function getShapeBounds(cubies: CubieData[]) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const c of cubies) {
    const [x, y, z] = c.currentPos;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const width = Math.round(maxX - minX) + 1;
  const height = Math.round(maxY - minY) + 1;
  const depth = Math.round(maxZ - minZ) + 1;

  return {
    minX, maxX,
    minY, maxY,
    minZ, maxZ,
    width, height, depth,
  };
}

/**
 * Returns rotation axis and angle (in radians) for a given standard Rubik twist.
 * Preserves puzzle geometry for Floppy cubes (180-deg edge flips) and rigid polycubes.
 */
export function getTwistRotation(
  face: RubikFace,
  direction: 1 | -1,
  shape: CubeShapeType = '3x3'
): { axis: THREE.Vector3; angle: number; sliceAxis: 'x' | 'y' | 'z' } {
  // 2x2x1 Floppy Cube: Edge turns (U, D, R, L) must be 180 degrees (Math.PI) to stay flat!
  if (
    shape === '2x2x1' &&
    face !== 'F' &&
    face !== 'B' &&
    face !== 'S' &&
    face !== 'Fw' &&
    face !== 'Bw'
  ) {
    const isX = face === 'R' || face === 'L' || face === 'M' || face === 'Rw' || face === 'Lw';
    return {
      axis: isX ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0),
      angle: Math.PI,
      sliceAxis: isX ? 'x' : 'y',
    };
  }

  switch (face) {
    // Up layer and Up wide
    case 'U':
    case 'Uw':
      return {
        axis: new THREE.Vector3(0, 1, 0),
        angle: -direction * (Math.PI / 2),
        sliceAxis: 'y',
      };
    // Down layer and Down wide
    case 'D':
    case 'Dw':
      return {
        axis: new THREE.Vector3(0, 1, 0),
        angle: direction * (Math.PI / 2),
        sliceAxis: 'y',
      };
    // Right layer and Right wide
    case 'R':
    case 'Rw':
      return {
        axis: new THREE.Vector3(1, 0, 0),
        angle: -direction * (Math.PI / 2),
        sliceAxis: 'x',
      };
    // Left layer and Left wide
    case 'L':
    case 'Lw':
      return {
        axis: new THREE.Vector3(1, 0, 0),
        angle: direction * (Math.PI / 2),
        sliceAxis: 'x',
      };
    // Front face and Front wide
    case 'F':
    case 'Fw':
      return {
        axis: new THREE.Vector3(0, 0, 1),
        angle: -direction * (Math.PI / 2),
        sliceAxis: 'z',
      };
    // Back face and Back wide
    case 'B':
    case 'Bw':
      return {
        axis: new THREE.Vector3(0, 0, 1),
        angle: direction * (Math.PI / 2),
        sliceAxis: 'z',
      };
    // Slice moves (WCA Rubik Standard: M follows L, E follows D, S follows F)
    case 'M':
      return {
        axis: new THREE.Vector3(1, 0, 0),
        angle: direction * (Math.PI / 2),
        sliceAxis: 'x',
      };
    case 'E':
      return {
        axis: new THREE.Vector3(0, 1, 0),
        angle: direction * (Math.PI / 2),
        sliceAxis: 'y',
      };
    case 'S':
      return {
        axis: new THREE.Vector3(0, 0, 1),
        angle: -direction * (Math.PI / 2),
        sliceAxis: 'z',
      };
  }
}

/**
 * Checks if a cubie belongs to the target slice for a face.
 * For rigid polycubes (L_SHAPE) and Floppy faces, keeps the geometry intact.
 */
export function isCubieInFaceSlice(
  cubie: CubieData,
  face: RubikFace,
  bounds: ReturnType<typeof getShapeBounds>,
  shape: CubeShapeType = '3x3'
): boolean {
  // L-Shape is a rigid polycube: whole piece rotates together without fracturing!
  if (shape === 'L_SHAPE') {
    return true;
  }

  // 1x1x2 Tower:
  if (shape === '1x1x2') {
    if (face === 'M' || face === 'E' || face === 'S') {
      return false; // No slice moves on 1x1x2
    }
    if (face.endsWith('w')) {
      return true; // Wide moves rotate the whole tower
    }
    if (bounds.height >= bounds.width) {
      if (face === 'U') return cubie.currentPos[1] >= bounds.maxY - 0.25;
      if (face === 'D') return cubie.currentPos[1] <= bounds.minY + 0.25;
      return true; // R, L, F, B rotate the entire tower
    } else {
      if (face === 'R') return cubie.currentPos[0] >= bounds.maxX - 0.25;
      if (face === 'L') return cubie.currentPos[0] <= bounds.minX + 0.25;
      return true; // U, D, F, B rotate the entire tower
    }
  }

  // 2x2x1 Floppy Cube: F, B, and wide moves rotate the entire 2x2 plate
  if (shape === '2x2x1') {
    if (face === 'M' || face === 'E' || face === 'S') {
      return false; // No slice moves on 2x2x1
    }
    if (face === 'F' || face === 'B' || face.endsWith('w')) {
      return true;
    }
  }

  // 2x2 Pocket Cube:
  if (shape === '2x2') {
    if (face === 'M' || face === 'E' || face === 'S') {
      return false; // No middle slice on 2x2
    }
    if (face.endsWith('w')) {
      return true; // Wide moves on 2x2 rotate the whole cube
    }
  }

  const [x, y, z] = cubie.currentPos;
  const eps = 0.25;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;

  switch (face) {
    // Single outer face turns
    case 'U':
      return y >= bounds.maxY - eps;
    case 'D':
      return y <= bounds.minY + eps;
    case 'R':
      return x >= bounds.maxX - eps;
    case 'L':
      return x <= bounds.minX + eps;
    case 'F':
      return z >= bounds.maxZ - eps;
    case 'B':
      return z <= bounds.minZ + eps;

    // Slice moves (Middle layer along respective axis)
    case 'M':
      return Math.abs(x - centerX) <= eps;
    case 'E':
      return Math.abs(y - centerY) <= eps;
    case 'S':
      return Math.abs(z - centerZ) <= eps;

    // Wide moves (Outer face + adjacent middle layer)
    case 'Uw':
      return y >= centerY - eps;
    case 'Dw':
      return y <= centerY + eps;
    case 'Rw':
      return x >= centerX - eps;
    case 'Lw':
      return x <= centerX + eps;
    case 'Fw':
      return z >= centerZ - eps;
    case 'Bw':
      return z <= centerZ + eps;
  }
}

/**
 * Applies a layer twist to cubies mathematically around the piece's geometric center.
 * Snaps coordinates cleanly to integer/half-integer values, preventing deformation.
 */
export function applyTwistToCubies(
  cubies: CubieData[],
  twist: LayerTwist,
  shape: CubeShapeType = '3x3'
): CubieData[] {
  const bounds = getShapeBounds(cubies);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const centerVec = new THREE.Vector3(centerX, centerY, centerZ);

  const { axis, angle } = getTwistRotation(twist.face, twist.direction, shape);
  const twistQuat = new THREE.Quaternion().setFromAxisAngle(axis, angle);

  return cubies.map((cubie) => {
    if (!isCubieInFaceSlice(cubie, twist.face, bounds, shape)) {
      return cubie;
    }

    // Rotate position vector around piece center so meshes never displace
    const relPos = new THREE.Vector3(...cubie.currentPos).sub(centerVec);
    relPos.applyQuaternion(twistQuat).add(centerVec);

    // Snap to nearest 0.5 step to support both integer (3x3) and half-integer (2x2) coordinates
    const snappedPos: [number, number, number] = [
      Math.round(relPos.x * 2) / 2,
      Math.round(relPos.y * 2) / 2,
      Math.round(relPos.z * 2) / 2,
    ];

    const curQuat = new THREE.Quaternion(...cubie.rotation);
    const newQuat = twistQuat.clone().multiply(curQuat).normalize();

    return {
      ...cubie,
      currentPos: snappedPos,
      rotation: [newQuat.x, newQuat.y, newQuat.z, newQuat.w],
    };
  });
}

/**
 * Applies global rotation (whole piece) around its geometric center.
 */
export function applyGlobalRotation(
  cubies: CubieData[],
  axis: RotationAxis,
  direction: 1 | -1
): CubieData[] {
  const bounds = getShapeBounds(cubies);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const centerZ = (bounds.minZ + bounds.maxZ) / 2;
  const centerVec = new THREE.Vector3(centerX, centerY, centerZ);

  const vAxis =
    axis === 'x'
      ? new THREE.Vector3(1, 0, 0)
      : axis === 'y'
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(0, 0, 1);
  const angle = direction * (Math.PI / 2);
  const rotQuat = new THREE.Quaternion().setFromAxisAngle(vAxis, angle);

  return cubies.map((cubie) => {
    const relPos = new THREE.Vector3(...cubie.currentPos).sub(centerVec);
    relPos.applyQuaternion(rotQuat).add(centerVec);

    const snappedPos: [number, number, number] = [
      Math.round(relPos.x * 2) / 2,
      Math.round(relPos.y * 2) / 2,
      Math.round(relPos.z * 2) / 2,
    ];

    const curQuat = new THREE.Quaternion(...cubie.rotation);
    const newQuat = rotQuat.clone().multiply(curQuat).normalize();

    return {
      ...cubie,
      currentPos: snappedPos,
      rotation: [newQuat.x, newQuat.y, newQuat.z, newQuat.w],
    };
  });
}

export interface DetachedBlock {
  row: number; // 0..2 relative to piece
  col: number; // 0..2 relative to piece
  color: string;
}

/**
 * Extracts front-face (+Z) blocks that face the player and 2D grid.
 */
export function extractFrontBlocks(cubies: CubieData[]): DetachedBlock[] {
  const bounds = getShapeBounds(cubies);
  const targetFrontNormal = new THREE.Vector3(0, 0, 1);
  const eps = 0.25;

  // Cubies sitting on the most forward Z level (+Z towards camera)
  const frontCubies = cubies.filter((c) => c.currentPos[2] >= bounds.maxZ - eps);
  const blocks: DetachedBlock[] = [];

  for (const cubie of frontCubies) {
    const col = Math.round(cubie.currentPos[0] - bounds.minX);
    const row = Math.round(bounds.maxY - cubie.currentPos[1]); // Top (+Y) -> row 0, Bottom (-Y) -> row H-1

    // Find which face points forward (+Z)
    const cubieQuat = new THREE.Quaternion(...cubie.rotation);
    let bestDot = -999;
    let matchingFaceIndex = 4; // default +Z (Front)

    for (let f = 0; f < 6; f++) {
      const initialNormal = new THREE.Vector3(...LOCAL_FACE_NORMALS[f]);
      const currentNormal = initialNormal.applyQuaternion(cubieQuat);
      const dot = currentNormal.dot(targetFrontNormal);
      if (dot > bestDot) {
        bestDot = dot;
        matchingFaceIndex = f;
      }
    }

    blocks.push({
      col: Math.max(0, col),
      row: Math.max(0, row),
      color: cubie.faceColors[matchingFaceIndex] || RUBIK_COLORS.F,
    });
  }

  return blocks;
}

/**
 * Extracts front face NxM color grid for the HUD radar and 2D grid detachment.
 */
export function extractFrontFaceColors(cubies: CubieData[]): string[][] {
  const bounds = getShapeBounds(cubies);
  const w = Math.max(1, bounds.width);
  const h = Math.max(1, bounds.height);

  const grid: string[][] = Array.from({ length: h }, () =>
    Array.from({ length: w }, () => '#111827')
  );

  const blocks = extractFrontBlocks(cubies);
  for (const b of blocks) {
    if (b.row < h && b.col < w) {
      grid[b.row][b.col] = b.color;
    }
  }

  return grid;
}

// Active landing face is the Front face facing the player and board
export const extractBottomBlocks = extractFrontBlocks;
export const extractBottomFaceColors = extractFrontFaceColors;

/**
 * Scrambles a cube shape with valid, shape-preserving moves.
 * Guarantees every spawned piece is intact, connected, and un-distorted!
 */
export function generateScrambledShape(shape: CubeShapeType, steps: number = 2): {
  cubies: CubieData[];
  twists: LayerTwist[];
} {
  let cubies = createShapeCubies(shape);
  const twists: LayerTwist[] = [];

  if (shape === 'L_SHAPE') {
    // For L_SHAPE, apply whole piece rotations to randomize spawn orientation without fracturing
    const axes: RotationAxis[] = ['x', 'y', 'z'];
    for (let i = 0; i < steps; i++) {
      const ax = axes[Math.floor(Math.random() * axes.length)];
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      cubies = applyGlobalRotation(cubies, ax, dir);
    }
    return { cubies, twists };
  }

  if (shape === '2x2x1') {
    // For 2x2x1 Slim, legal moves are F, B (in XY plane), and 180-deg U, D, R, L
    const moves: { face: RubikFace; dir: 1 | -1 }[] = [
      { face: 'F', dir: 1 },
      { face: 'F', dir: -1 },
      { face: 'B', dir: 1 },
      { face: 'U', dir: 1 },
      { face: 'D', dir: 1 },
      { face: 'R', dir: 1 },
      { face: 'L', dir: 1 },
    ];
    for (let i = 0; i < steps; i++) {
      const m = moves[Math.floor(Math.random() * moves.length)];
      const twist: LayerTwist = {
        face: m.face,
        direction: m.dir,
        axis: m.face === 'F' || m.face === 'B' ? 'z' : m.face === 'L' || m.face === 'R' ? 'x' : 'y',
        sliceIndex: 0,
      };
      twists.push(twist);
      cubies = applyTwistToCubies(cubies, twist, shape);
    }
    return { cubies, twists };
  }

  if (shape === '1x1x2') {
    const faces: RubikFace[] = ['U', 'D', 'R', 'F'];
    for (let i = 0; i < steps; i++) {
      const face = faces[Math.floor(Math.random() * faces.length)];
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const twist: LayerTwist = {
        face,
        direction: dir,
        axis: face === 'U' || face === 'D' ? 'y' : face === 'R' ? 'x' : 'z',
        sliceIndex: 0,
      };
      twists.push(twist);
      cubies = applyTwistToCubies(cubies, twist, shape);
    }
    return { cubies, twists };
  }

  // For 3x3 and 2x2: Standard Rubik layer twists
  const faces: RubikFace[] = ['U', 'D', 'L', 'R', 'F', 'B'];
  const directions: (1 | -1)[] = [1, -1];

  for (let i = 0; i < steps; i++) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    const twist: LayerTwist = {
      face,
      direction,
      axis: face === 'U' || face === 'D' ? 'y' : face === 'L' || face === 'R' ? 'x' : 'z',
      sliceIndex: 0,
    };
    twists.push(twist);
    cubies = applyTwistToCubies(cubies, twist, shape);
  }

  return { cubies, twists };
}
