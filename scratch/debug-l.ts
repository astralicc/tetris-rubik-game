import { createLShapeCubies, applyGlobalRotation, extractFrontBlocks, getShapeBounds } from '../src/utils/rubik';

const cubies = createLShapeCubies();
console.log('Original L-shape:');
cubies.forEach(c => console.log(c.id, c.currentPos));
console.log('Front blocks orig:', extractFrontBlocks(cubies));

const zRot = applyGlobalRotation(cubies, 'z', 1);
console.log('\nAfter Z rotation 90 deg:');
zRot.forEach(c => console.log(c.id, c.currentPos));
console.log('Bounds after Z rot:', getShapeBounds(zRot));
console.log('Front blocks after Z rot:', extractFrontBlocks(zRot));

