const {
  Colors,
  Particles,
  Density,
  InitialState,
  Corrosible,
  Static,
  Fluid,
} = require('./Particles/Particles');
const Random = require('./Utils/Random');
let tileIndex = -1;

let pixelData;
let tileFrameCount;
let tileFrameTimes;

let canvas;
let startX;
let startY;
let endX;
let endY;
let pixelDataSize;
let screenWidth;
let screenHeight;

let lineOrder = [];

let width;
let height;

let stepsMultiplier = 1;

let frameTimes = [];
let lastFrameStartTime;

onmessage = function (e) {
  handleMessage(e.data);
}

function handleMessage(message) {
  switch (message.type) {
    case 'init': initPixelGrid(message.data); break;
    case 'doPhysics': doPhysics(message.data); break;
    case 'updatePixels': updatePixels(message.data); break;
  }
}

function initPixelGrid(data) {
  tileIndex = data.tileIndex;

  pixelData = new Int16Array(data.sharedBuffer);
  tileFrameCount = new Int32Array(data.sharedFrameCountBuffer);
  tileFrameTimes = new Float32Array(data.sharedFrameTimesBuffer);

  canvas = data.canvas;
  startX = data.startX;
  startY = data.startY;
  endX = data.endX;
  endY = data.endY;
  width = endX - startX;
  height = endY - startY;
  pixelDataSize = data.pixelDataSize;
  screenWidth = data.screenWidth;
  screenHeight = data.screenHeight;

  computeUpdateOrderRadomness();

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x += 4) {
      lineOrder[y].push(x);
      const index = coordsToIndex(x, y);
      setPixel(index, Particles.Air);
    }
  }

  ctx = canvas.getContext('2d', { alpha: false });

  postMessage({
    type: 'initDone',
  });

  requestAnimationFrame(render);
}

function computeUpdateOrderRadomness() {
  for (let y = startY; y < endY; y++) {
    lineOrder[y] = [];
    for (let x = startX; x < endX; x++) {
      lineOrder[y].push(x);
    }
    shuffleArray(lineOrder[y]);
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Random.number() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function render() {
  const timeNow = performance.now();

  const lastFrameTime = timeNow - lastFrameStartTime;
  frameTimes.push(lastFrameTime);
  if (frameTimes.length > 10) {
    frameTimes.shift();
  }

  let imagedata = ctx.createImageData(width, height);
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      try {
        const pixelIndex = coordsToIndex(x, y);

        // Map the index to the actual position without offset
        const imageIndex = (x - startX + (y - startY) * width) * 4;

        let color = Colors[pixelData[pixelIndex]];

        // add a pixel
        imagedata.data[imageIndex] = color[0];
        imagedata.data[imageIndex + 1] = color[1];
        imagedata.data[imageIndex + 2] = color[2];
        imagedata.data[imageIndex + 3] = 255;
      } catch (e) {

      }
    }
  }

  ctx.putImageData(imagedata, 0, 0);

  computeUpdateOrderRadomness();
  doPhysics();

  // get the average frame time from frameTimes
  let averageFrameTime = 0;
  for (let i = 0; i < frameTimes.length; i++) {
    averageFrameTime += frameTimes[i];
  }
  averageFrameTime /= frameTimes.length;
  if (!isNaN(averageFrameTime)) {
    tileFrameTimes[tileIndex] = averageFrameTime;
    stepsMultiplier = 60 / (1000 / averageFrameTime);
  }

  lastFrameStartTime = timeNow;
  requestAnimationFrame(render);
}

function coordsToIndex(x, y) {
  // On a array of size screenWidth * screenHeight
  // Find the index of the pixel determined by the x and y coordinates

  return (x + y * screenWidth) * pixelDataSize;
}


function doPhysics() {

  const mystep = tileFrameCount[tileIndex];

  // if my step is greater than the thread on the smallest step don't do a physics frame
  let minStep = Infinity;
  for (let i = 0; i < tileFrameCount.length; i++) {
    if (tileFrameCount[i] < minStep) {
      minStep = tileFrameCount[i];
    }
  }

  if (mystep > minStep) {
    return;
  }


  for (let y = endY - 1; y >= startY; y--) {
    // for (let x = endX - 1; x >= startX; x--) {
    for (let x of lineOrder[y]) {
      processPixel(x, y);
    }
  }
  tileFrameCount[tileIndex]++;

}


function processPixel(x, y) {
  let index = coordsToIndex(x, y);

  if (pixelData[index] === Particles.Air) {
    return;
  }
  try {
    [index, x, y] = processReactions(index, x, y);

    if (!Static[pixelData[index]]) {
      [index, x, y] = executeBouyancy(index, x, y);
    }
    executeVectors(index, x, y);
  } catch (e) {
    let errorStr = `${e.message}\n${x}-${y}-${index}`;
    for (let i = 0; i < pixelDataSize; i++) {
      errorStr += ` ${pixelData[index + i]}`;
    }

    alert(`An error occured. Please report the error message to the developer (include a save if possible):\n\n${errorStr}`);

    throw e;
  }
}

function isInBounds(x, y) {
  // check if a pixel is within the screen space
  return x >= 0 && x < screenWidth && y >= 0 && y < screenHeight;
}

function isEmpty(x, y, ignoreFire = true) {
  if (!isInBounds(x, y)) return false;
  const index = coordsToIndex(x, y);
  return pixelData[index] === Particles.Air || (ignoreFire && pixelData[index] === Particles.Fire);
}

function shouldSink(index, targetIndex) {
  // returns true is the particle should be able to sink on the target
  // Note: just because it is hevyer doesn't mean it will sink on this frame. It just increases the chance
  if (Density[pixelData[index]] > Density[pixelData[targetIndex]]) {
    const difficult = Math.pow(Density[pixelData[index]], 2) - Math.pow(Density[pixelData[targetIndex]], 2);
    const normalizedDifficult = difficult / (difficult + 1);
    return Random.number() < normalizedDifficult;
  }
  return false;
}

function executeVectors(index, x, y) {
  let i = 0;
  while (i < 3) {
    const vectorX = pixelData[index + 1];
    const vectorY = pixelData[index + 2];
    if (vectorX === 0 && vectorY === 0) {
      break;
    }

    // a movement step is a step in the direction of the vector
    // it only moves one unity in X and Y

    let movementX = 0;
    let movementY = 0;

    if (vectorX > 0) {
      movementX = 1;
    } else if (vectorX < 0) {
      movementX = -1;
    }

    if (vectorY > 0) {
      movementY = 1;
    } else if (vectorY < 0) {
      movementY = -1;
    }

    const targetX = x + movementX;
    const targetY = y + movementY;

    if (!isEmpty(targetX, targetY)) {
      break;
    }

    pixelData[index + 1] -= movementX;
    pixelData[index + 2] -= movementY;
    const targetIndex = coordsToIndex(targetX, targetY);
    x += movementX;
    y += movementY;
    movePixel(index, targetIndex);
    index = targetIndex;
    i++;
  }

  return [index, x, y];
}

function executeBouyancy(index, x, y) {
  // check if the pixel should sink down
  const indexBellow = coordsToIndex(x, y + 1);
  if (!isEmpty(x, y + 1) && Fluid[pixelData[indexBellow]]) {
    if (shouldSink(index, indexBellow)) {
      swapPixel(index, indexBellow);
      y++;
      return [indexBellow, x, y];
    }
  }

  // check if the pixel should float up
  const indexAbove = coordsToIndex(x, y - 1);
  if (!isEmpty(indexAbove) && Fluid[pixelData[indexAbove]]) {
    if (shouldSink(indexAbove, index)) {
      swapPixel(indexAbove, index);
      y--;
      return [index, x, y];
    }
  }

  return [index, x, y];
}


function processReactions(index, x, y) {
  switch (pixelData[index]) {
    case Particles.Dust: { return reactionDust(index, x, y); }
    case Particles.Stone: { return reactionStone(index, x, y); }
    case Particles.Water: { return reactionWater(index, x, y); }
    case Particles.Metal: { return reactionMetal(index, x, y); }
    case Particles.Rust: { return reactionRust(index, x, y); }
    case Particles.Lava: { return reactionLava(index, x, y); }
    case Particles.Void: { return reactionVoid(index, x, y); }
    case Particles.Fire: { return reactionFire(index, x, y); }
    case Particles.Steam: { return reactionSteam(index, x, y); }
    case Particles.Steel: { return reactionSteel(index, x, y); }
    case Particles.Acid: { return reactionAcid(index, x, y); }
    case Particles.AcidVapor: { return reactionAcidVapor(index, x, y); }
    case Particles.Clone: { return reactionClone(index, x, y); }
    case Particles.Oil: { return reactionOil(index, x, y); }
    case Particles.Block: { return reactionBlock(index, x, y); }
  }
}

function reactionBlock(index, x, y) {
  return [index, x, y];
}

function reactionOil(index, x, y) {
  const adjacent = [
    [x, y - 1],
    [x - 1, y],
    [x + 1, y],
    [x, y + 1],
  ];

  for (let [targetX, targetY] of adjacent) {
    if (!isInBounds(targetX, targetY)) continue;
    const targetIndex = coordsToIndex(targetX, targetY);
    if (
      pixelData[targetIndex] === Particles.Fire ||
      pixelData[targetIndex] === Particles.Lava
    ) {
      pixelData[index + 3] = pixelData[index + 3] >= 300 ? 300 : pixelData[index + 3] + 50;
    }
  }


  if (pixelData[index + 3] >= 50) {
    // the particle is on fire it wil attempt to emmit a Fire particle at the first adjacent empty space
    shuffleArray(adjacent);
    let emmited = false;
    for (let [targetX, targetY] of adjacent) {
      if (!isEmpty(targetX, targetY)) continue;
      const targetIndex = coordsToIndex(targetX, targetY);
      setPixel(targetIndex, Particles.Fire);
      emmited = true;

      // random chance to burn out
      if (Random.number() < 0.1) {
        setPixel(index, Particles.Fire);
      }
    }
    if (!emmited) {
      pixelData[index + 3] -= 20;
    }
  }

  [index, x, y] = fluidPhysics(index, x, y, Random.int(1, 3) * stepsMultiplier);

  // spread to adjacent pixels
  if (Random.number() < 0.1) {
    const direction = Random.direction();
    i = 0;
    do {
      if (isEmpty(x + direction, y)) {
        x += direction;
        const targetIndex = coordsToIndex(x, y);
        movePixel(index, targetIndex);
        index = targetIndex;
      }
    } while (++i <= 1);
  }

  return [index, x, y];
}

function reactionDust(index, x, y) {
  pixelData[index + 3] = pixelData[index + 3] < 0 ? 0 : pixelData[index + 3];
  pixelData[index + 3] = pixelData[index + 3] > 100 ? 100 : pixelData[index + 3];

  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
  for (let [targetX, targetY] of adjacent) {
    // check if it is touching lava or fire
    const targetIndex = coordsToIndex(targetX, targetY);
    if (
      isInBounds(targetX, targetY) &&
      (
        pixelData[targetIndex] === Particles.Lava ||
        pixelData[targetIndex] === Particles.Fire
      )
    ) {
      // random chance
      if (Random.number() < 0.7) {
        // set the dust to fire
        pixelData[index] = Particles.Fire;
        return [index, x, y];
      }
    }
  }

  if (pixelData[index + 3] <= 0) { // The particle is settled
    // count how many of the pixels touching the particle (including diagonals) are dust
    let count = 0;
    let i = 0;
    const adjacentDust = [
      [x - 1, y], // left
      [x + 1, y], // right
      [x, y - 1], // up
      [x - 1, y - 1], // up left
      [x + 1, y - 1], // up right
      [x, y + 1], // down
      [x + 1, y + 1], // down left
      [x - 1, y + 1], // down right

    ];
    do {
      const [targetX, targetY] = adjacentDust[i];
      if (!isInBounds(targetX, targetY)) {
        count++;
      } else {
        const targetIndex = coordsToIndex(targetX, targetY);
        if (pixelData[targetIndex] === Particles.Dust) {
          count++;
        }
      }
    } while (++i < adjacentDust.length);

    if (count >= 4) {
      // if there are 4 or more dust particles touching the particle it doesn't need to move
      return [index, x, y];
    } else if (count <= 3) {
      pixelData[index + 3] += 3;
    }
  }

  const prevX = x;
  const prevY = y;

  let hasMoved = false;
  [index, x, y, hasMoved] = sandPhysics(index, x, y, Random.int(3, 5) * stepsMultiplier);

  if (hasMoved) {
    pixelData[index + 3]++;

    // update the pixels on the sides and above
    const adjacent = [
      [prevX - 1, prevY],
      [prevX + 1, prevY],
      [prevX, prevY - 1],
    ];

    for (let [targetX, targetY] of adjacent) {
      const aboveIndex = coordsToIndex(targetX, targetY);
      if (isInBounds(x, y - 1) && pixelData[aboveIndex] === Particles.Dust) {
        pixelData[aboveIndex + 3]++;
      }
    }

  } else {
    pixelData[index + 3]--;
  }


  if (pixelData[index + 3] <= 0) return [index, x, y];

  // randomchance to spread
  if (Random.number() < 0.01) {

    // spread to adjacent pixels
    const direction = Random.direction();
    i = 0;
    do {
      if (isEmpty(x + direction, y)) {
        x += direction;
        const targetIndex = coordsToIndex(x, y);
        movePixel(index, targetIndex);
        index = targetIndex;
      }
    } while (++i <= 1);
  }

  return [index, x, y];
}

function reactionStone(index, x, y) {

  if (pixelData[index + 3] > 100) {
    pixelData[index] = Particles.Lava;
    return [index, x, y];
  }

  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
  // if adjacent to lava or fire, heatUp
  for (let [targetX, targetY] of adjacent) {
    if (!isInBounds(targetX, targetY)) continue;
    const targetIndex = coordsToIndex(targetX, targetY);
    if (
      pixelData[targetIndex] === Particles.Lava ||
      pixelData[targetIndex] === Particles.Fire
    ) {
      if (Random.number() < 0.1) {
        pixelData[index + 3]++;
        return [index, x, y];
      }
    }
  }

  [index, x, y, hasMoved] = stonePhysics(index, x, y, Random.int(4, 10) * stepsMultiplier);

  return [index, x, y];
}

function reactionWater(index, x, y) {
  if (pixelData[index + 3] >= 100) {
    // turn into Steam
    pixelData[index] = Particles.Steam;
    return [index, x, y];
  }

  [index, x, y] = fluidPhysics(index, x, y, Random.int(2, 6) * stepsMultiplier);

  // spread to adjacent pixels
  const direction = Random.direction();
  i = 0;
  do {
    if (isEmpty(x + direction, y)) {
      x += direction;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    }
  } while (++i <= 2);

  return [index, x, y];

}

function reactionMetal(index, x, y) {
  // metal does not move.
  // if a particle of metal is in contact with water, it has a probability of becoming rust.
  // if a particle of metal is in contact with rust, it has a smaller probability of becoming rust

  if (pixelData[index + 3] > 100) {
    pixelData[index] = Particles.Lava;
    return [index, x, y];
  }

  // check the adjacent pixels
  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (let [targetX, targetY] of adjacent) {
    if (!isInBounds(targetX, targetY)) continue;
    const targetIndex = coordsToIndex(targetX, targetY);
    if (pixelData[targetIndex] === Particles.Water) {
      if (Random.number() < 0.01) {
        pixelData[index] = Particles.Rust;
        return [index, x, y];
      }
    } else if (pixelData[targetIndex] === Particles.Rust) {
      if (Random.number() < 0.001) {
        pixelData[index] = Particles.Rust;
        return [index, x, y];
      }
    } else if (pixelData[targetIndex] === Particles.Lava) {
      if (Random.number() < 0.1) {
        pixelData[index + 3]++;
        return [index, x, y];
      }
    }
  }
  return [index, x, y];
}

function reactionRust(index, x, y) {
  return reactionDust(index, x, y);
}

function reactionLava(index, x, y) {
  if (pixelData[index + 3] <= 50) {
    pixelData[index] = Particles.Stone;
    return [index, x, y];
  }

  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (let [targetX, targetY] of adjacent) {
    if (!isInBounds(targetX, targetY)) continue;
    const targetIndex = coordsToIndex(targetX, targetY);
    if (
      pixelData[targetIndex] === Particles.Water ||
      pixelData[targetIndex] === Particles.Acid ||
      pixelData[targetIndex] === Particles.Oil
    ) {
      pixelData[targetIndex + 3] += 20;
      pixelData[index + 3] -= 20;
    }
  }

  [index, x, y] = fluidPhysics(index, x, y, Random.int(1, 3) * stepsMultiplier);

  // spread to adjacent pixels
  if (Random.number() < 0.1) {
    const direction = Random.direction();
    i = 0;
    do {
      if (isEmpty(x + direction, y)) {
        x += direction;
        const targetIndex = coordsToIndex(x, y);
        movePixel(index, targetIndex);
        index = targetIndex;
      }
    } while (++i <= 1);
  }

  return [index, x, y];
}

function reactionVoid(index, x, y) {
  // removes any particle that touches it and is not void

  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (let [targetX, targetY] of adjacent) {
    const targetIndex = coordsToIndex(targetX, targetY);
    if (!isEmpty(targetX, targetY) && pixelData[targetIndex] !== Particles.Void) {
      removePixel(targetIndex);
    }
  }
  return [index, x, y];
}

function reactionFire(index, x, y) {
  // probability to expire
  if (pixelData[index + 3] <= 150) {
    removePixel(index);
    return [index, x, y];
  }
  if (Random.number() > 0.5) {
    pixelData[index + 3]--;
  }

  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (let [targetX, targetY] of adjacent) {
    const adjacentIndex = coordsToIndex(targetX, targetY);
    if (
      pixelData[adjacentIndex] === Particles.Water ||
      pixelData[adjacentIndex] === Particles.Acid ||
      pixelData[adjacentIndex] === Particles.Stone
    ) {
      removePixel(index);
      pixelData[adjacentIndex + 3] += 10;
      return [index, x, y];
    }
  }

  [index, x, y, hasMoved] = gasPhysics(index, x, y, Random.int(0, 2) * stepsMultiplier, false);

  if (Random.number() > 0.1) {
    const direction = Random.direction();
    const targetIndex = coordsToIndex(x + direction, y);
    if (isInBounds(x + direction, y) && pixelData[targetIndex] === Particles.Air) {
      x += direction;
      movePixel(index, targetIndex);
      index = targetIndex;
    }
  }
  return [index, x, y];
}

function reactionClone(index, x, y) {
  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];


  for (let [targetX, targetY] of adjacent) {
    const targetIndex = coordsToIndex(targetX, targetY);

    if (pixelData[targetIndex] == Particles.Clone) {
      if (pixelData[targetIndex + 3] == Particles.Air && pixelData[index + 3] != Particles.Air) {
        // propagate the current cloning particle
        pixelData[targetIndex + 3] = pixelData[index + 3];
      }
      continue;
    }

    if (pixelData[index + 3] !== Particles.Air) {
      break;
    }

    if (
      isInBounds(targetX, targetY) &&
      pixelData[targetIndex] !== Particles.Air
    ) {
      pixelData[index + 3] = pixelData[targetIndex];
      break;
    }
  }


  // random chance
  if (!pixelData[index + 3] === Particles.Air || Random.number() > 0.05) {
    return [index, x, y];
  }

  // shuffleArray(adjacent);
  for (let [targetX, targetY] of adjacent) {
    const targetIndex = coordsToIndex(targetX, targetY);
    if (isInBounds(targetX, targetY) && isEmpty(targetX, targetY)) {
      setPixel(targetIndex, pixelData[index + 3]);
      break;
    }
  }


  return [index, x, y];
}

function reactionAcidVapor(index, x, y) {
  // random chance
  if (Random.number() < 0.05) {
    pixelData[index + 3]--;
  }

  if (pixelData[index + 3] <= 10) {
    // turns into water
    pixelData[index] = Particles.Acid;
    return [index, x, y];
  }

  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (let [targetX, targetY] of adjacent) {
    const targetIndex = coordsToIndex(targetX, targetY);
    if (
      Corrosible[pixelData[targetIndex]] &&
      isInBounds(targetX, targetY) &&
      !isEmpty(targetX, targetY)
    ) {
      // diffcult to be corroded is calculated based on the density of the target.
      // it gets exponentially more difficult to corrode the target with higher density
      const diffcultToBeCorroded = Math.pow(Density[pixelData[targetIndex]], 2);

      // normalize the diffcult to be corroded to be between 0 and 1
      const normalizedDiffcultToBeCorroded = diffcultToBeCorroded / (diffcultToBeCorroded + 1);

      if (Random.number() > normalizedDiffcultToBeCorroded) {
        removePixel(targetIndex);
        removePixel(index);
      }

      return [index, x, y];
    }
  }

  [index, x, y, hasMoved] = gasPhysics(index, x, y, Random.int(-3, 1) * stepsMultiplier);

  // spread to adjacent pixels
  const direction = Random.direction();
  i = 0;
  do {
    if (isEmpty(x + direction, y)) {
      x += direction;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    }
  } while (++i < 1);
  return [index, x, y];
}

function reactionAcid(index, x, y) {
  if (pixelData[index + 3] >= 80) {
    // turn into Acid Vapor
    pixelData[index] = Particles.AcidVapor;
    return [index, x, y];
  }

  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (let [targetX, targetY] of adjacent) {
    const targetIndex = coordsToIndex(targetX, targetY);
    if (
      Corrosible[pixelData[targetIndex]] &&
      isInBounds(targetX, targetY) &&
      !isEmpty(targetX, targetY)
    ) {
      // diffcult to be corroded is calculated based on the density of the target.
      // it gets exponentially more difficult to corrode the target with higher density
      const diffcultToBeCorroded = Math.pow(Density[pixelData[targetIndex]], 2);

      // normalize the diffcult to be corroded to be between 0 and 1
      const normalizedDiffcultToBeCorroded = diffcultToBeCorroded / (diffcultToBeCorroded + 1);

      if (Random.number() > normalizedDiffcultToBeCorroded) {
        removePixel(targetIndex);
        removePixel(index);
      }

      return [index, x, y];
    }
  }

  [index, x, y] = fluidPhysics(index, x, y, Random.int(2, 6) * stepsMultiplier);

  // spread to adjacent pixels
  const direction = Random.direction();
  i = 0;
  do {
    if (isEmpty(x + direction, y)) {
      x += direction;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    }
  } while (++i <= 1);

  return [index, x, y];
}

function reactionSteel(index, x, y) {
  return [index, x, y];
}

function reactionSteam(index, x, y) {
  // random chance
  if (Random.number() < 0.05) {
    pixelData[index + 3]--;
  }

  if (pixelData[index + 3] <= 50) {
    if (pixelData[index + 3] <= 0) {
      pixelData[index + 3] = 0;
    }
    // turns into water
    pixelData[index] = Particles.Water;
    return [index, x, y];
  }

  [index, x, y, hasMoved] = gasPhysics(index, x, y, Random.int(-3, 1) * stepsMultiplier);

  // spread to adjacent pixels
  const direction = Random.direction();
  i = 0;
  do {
    if (isEmpty(x + direction, y)) {
      x += direction;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    }
  } while (++i < 1);

  return [index, x, y];
}

function removePixel(index) {
  for (let i = 0; i < pixelDataSize; i++) {
    pixelData[index + i] = InitialState[Particles.Air][i];
  }
}

function movePixel(fromIndex, toIndex) {
  for (let i = 0; i < pixelDataSize; i++) {
    pixelData[toIndex + i] = pixelData[fromIndex + i];
    pixelData[fromIndex + i] = InitialState[Particles.Air][i];
  }
}

function setPixel(index, type) {
  for (let i = 0; i < pixelDataSize; i++) {
    pixelData[index + i] = InitialState[type][i];
  }
}

function swapPixel(index1, index2) {
  let temp;
  for (let i = 0; i < pixelDataSize; i++) {
    temp = pixelData[index1 + i];
    pixelData[index1 + i] = pixelData[index2 + i];
    pixelData[index2 + i] = temp;
  }
}


/* physics shortcuts */

function stonePhysics(index, x, y, maxMoves, ignoreFire = true) {
  let hasMoved = false;
  let cantMove = false;
  let i = 0;
  while (i++ < maxMoves && !cantMove) {
    if (isEmpty(x, y + 1, ignoreFire)) {
      y++;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
      hasMoved = true;
    } else {
      cantMove = true;
    }
  };
  return [index, x, y, hasMoved];
}

function sandPhysics(index, x, y, maxMoves, ignoreFire = true) {
  let hasMoved = false;
  let cantMove = false;
  let i = 0;
  while (i++ < maxMoves && !cantMove) {
    if (isEmpty(x, y + 1, ignoreFire)) {
      y++;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
      hasMoved = true;
    } else {
      direction = Random.direction();
      if (isEmpty(x + direction, y + 1, ignoreFire)) {
        x += direction;
        y++;
        const targetIndex = coordsToIndex(x, y);
        movePixel(index, targetIndex);
        index = targetIndex;
        hasMoved = true;
      } else {
        direction *= -1;
        if (isEmpty(x + direction, y + 1, ignoreFire)) {
          x += direction;
          y++;
          const targetIndex = coordsToIndex(x, y);
          movePixel(index, targetIndex);
          index = targetIndex;
          hasMoved = true;
        } else {
          cantMove = true;
        }
      }
    }
  }
  return [index, x, y, hasMoved];
}

function fluidPhysics(index, x, y, maxMoves, ignoreFire = true) {
  let hasMoved = false;
  let cantMove = false;
  let i = 0;
  while (i++ < maxMoves && !cantMove) {
    if (isEmpty(x, y + 1, ignoreFire)) {
      y++;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
      hasMoved = true;
    } else {
      direction = Random.direction();
      if (isEmpty(x + direction, y + 1, ignoreFire)) {
        x += direction;
        y++;
        const targetIndex = coordsToIndex(x, y);
        movePixel(index, targetIndex);
        index = targetIndex;
        hasMoved = true;
      } else {
        direction *= -1;
        if (isEmpty(x + direction, y + 1, ignoreFire)) {
          x += direction;
          y++;
          const targetIndex = coordsToIndex(x, y);
          movePixel(index, targetIndex);
          index = targetIndex;
          hasMoved = true;
        } else {
          direction = Random.direction();
          if (isEmpty(x + direction, y, ignoreFire)) {
            x += direction;
            const targetIndex = coordsToIndex(x, y);
            movePixel(index, targetIndex);
            index = targetIndex;
            hasMoved = true;
          } else {
            direction *= -1;
            if (isEmpty(x + direction, y, ignoreFire)) {
              x += direction;
              const targetIndex = coordsToIndex(x, y);
              movePixel(index, targetIndex);
              index = targetIndex;
              hasMoved = true;
            } else {
              cantMove = true;
            }
          }
        }
      }
    }
  }
  return [index, x, y, hasMoved];
}

function gasPhysics(index, x, y, maxMoves, ignoreFire = true) {
  // identical to fluid physics but moves up

  let hasMoved = false;
  let cantMove = false;
  let i = 0;

  while (i++ < maxMoves && !cantMove) {
    if (isEmpty(x, y - 1, ignoreFire, ignoreFire)) {
      y--;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
      hasMoved = true;
    } else {
      direction = Random.direction();
      if (isEmpty(x + direction, y - 1, ignoreFire)) {
        x += direction;
        y--;
        const targetIndex = coordsToIndex(x, y);
        movePixel(index, targetIndex);
        index = targetIndex;
        hasMoved = true;
      } else {
        direction *= -1;
        if (isEmpty(x + direction, y - 1, ignoreFire)) {
          x += direction;
          y--;
          const targetIndex = coordsToIndex(x, y);
          movePixel(index, targetIndex);
          index = targetIndex;
          hasMoved = true;
        } else {
          cantMove = true;
        }
      }
    }
  }
  return [index, x, y, hasMoved];
}

/* debug */

// log the bytes of the pixel
function logPixel(index) {
  let data = '';
  for (let i = 0; i < pixelDataSize; i++) {
    data += pixelData[index + i] + ' ';
  }
  console.log(data);
}

function log(data) {
  postMessage({
    type: 'debug',
    data: data,
  });
}

function alert(data) {
  postMessage({
    type: 'error',
    data: data,
  });
}