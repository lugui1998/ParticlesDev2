const {
  Colors,
  Particles,
  Density,
  InitialState
} = require('./Particles/Particles');
const Random = require('./Utils/Random');

let pixelData;
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

onmessage = function (e) {
  handleMessage(e.data);
}

function handleMessage(message) {
  switch (message.type) {
    case 'init': initPixelGrid(message.data); break;
    case 'doPhysics': doPhysics(); break;
    case 'updatePixels': updatePixels(message.data); break;
  }
}

function initPixelGrid(data) {
  pixelData = new Int16Array(data.sharedBuffer);
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

  for (let x = startX; x < endX; x++) {
    lineOrder.push(x);
  }

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x += 4) {
      const index = coordsToIndex(x, y);
      pixelData[index] = InitialState[Particles.Air][0];
      pixelData[index + 1] = InitialState[Particles.Air][1];
      pixelData[index + 2] = InitialState[Particles.Air][2];
      pixelData[index + 3] = InitialState[Particles.Air][3];
    }
  }

  ctx = canvas.getContext('2d', { alpha: false });
  requestAnimationFrame(render);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Random.number() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function render() {

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

  requestAnimationFrame(render);
}



function coordsToIndex(x, y) {
  // On a array of size screenWidth * screenHeight
  // Find the index of the pixel determined by the x and y coordinates

  return (x + y * screenWidth) * pixelDataSize;
}

function IndexToCoords(index) {
  // convert the index to the x and y coordinates
  return [
    index % screenWidth,
    Math.floor(index / (screenWidth * pixelDataSize)),
  ]
}

let reverseOrder = false;
function doPhysics() {
  // for each pixel of the Tile from end to start
  for (let y = endY - 1; y >= startY; y--) {
    shuffleArray(lineOrder);
    // for (let x = endX - 1; x >= startX; x--) {
    for (let x of lineOrder) {
      processPixel(x, y);
    }
  }
  reverseOrder = !reverseOrder;

  postMessage({
    type: 'donePhysics',
  });
}


function processPixel(x, y) {
  let index = coordsToIndex(x, y);

  if (pixelData[index] === Particles.Air) {
    return;
  }

  [x, y] = handleParticle(index, x, y);
  index = coordsToIndex(x, y);
  if (!Particles.isStatic(pixelData[index])) {
    handleFluid(index, x, y);
  }
}

function handleFluid(index, x, y) {
  const pixelBellow = coordsToIndex(x, y + 1);
  const pixelAbove = coordsToIndex(x, y - 1);

  //  Fluid interactions
  if (!isEmpty(x, y + 1) && Particles.isFluid(pixelData[pixelBellow])) {
    if (shouldSink(index, pixelBellow)) {
      swapPixel(index, pixelBellow);
    }
  } else if (!isEmpty(x, y - 1) && Particles.isFluid(pixelData[pixelAbove])) {
    if (shouldSink(index, pixelAbove)) {
      swapPixel(index, pixelAbove);
    }
  }
}

function handleParticle(index, x, y) {
  let newPos = [x, y];
  switch (pixelData[index]) {
    case Particles.Dust: { newPos = dust(x, y); break; }
    case Particles.Stone: { newPos = stone(x, y); break; }
    case Particles.Water: { newPos = water(x, y); break; }
    case Particles.Metal: { newPos = metal(x, y); break; }
    case Particles.Rust: { newPos = rust(x, y); break; }
    case Particles.Lava: { newPos = lava(x, y); break; }
    case Particles.Void: { newPos = voidParticle(x, y); break; }
    case Particles.Fire: { newPos = fire(x, y); break; }
    case Particles.Steam: { newPos = steam(x, y); break; }
    case Particles.Steel: { break; }
    case Particles.Acid: { newPos = acid(x, y); break; }
    case Particles.AcidVapor: { newPos = acidVapor(x, y); break; }
    case Particles.Clone: { newPos = clone(x, y); break; }
  }

  return newPos;
}

function isInBounds(x, y) {
  // check if a pixel is within the screen space
  return x >= 0 && x < screenWidth && y >= 0 && y < screenHeight;
}

function isEmpty(x, y) {
  if (!isInBounds(x, y)) return false;
  const index = coordsToIndex(x, y);
  return pixelData[index] === Particles.Air || pixelData[index] === Particles.Fire;
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

/* Particle Physics */

function clone(x, y) {
  const index = coordsToIndex(x, y);

  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (let [targetX, targetY] of adjacent) {
    const targetIndex = coordsToIndex(targetX, targetY);

    if (pixelData[targetIndex] == Particles.Clone) {
      if (pixelData[targetIndex + 1] == Particles.Air && pixelData[index + 1] != Particles.Air) {
        // propagate the current cloning particle
        pixelData[targetIndex + 1] = pixelData[index + 1];
      }
    } else if (
      isInBounds(targetX, targetY) &&
      pixelData[targetIndex] != Particles.Air
    ) {
      pixelData[index + 1] = pixelData[targetIndex];
      break;
    }
  }

  // random chance
  if (!pixelData[index + 1] || Random.number() > 0.05) {
    return [x, y];
  }

  shuffleArray(adjacent);
  for (let [targetX, targetY] of adjacent) {
    const targetIndex = coordsToIndex(targetX, targetY);
    if (isInBounds(targetX, targetY) && isEmpty(targetX, targetY)) {
      for (let i = 0; i < pixelDataSize; i++) {
        pixelData[targetIndex + i] = InitialState[pixelData[index + 1]][i];
      }
      break;
    }
  }


  return [x, y];
}

function acidVapor(x, y) {
  let index = coordsToIndex(x, y);

  // random chance
  if (Random.number() < 0.05) {
    pixelData[index + 2]--;
  }

  if (pixelData[index + 2] <= 50) {
    // turns into water
    pixelData[index] = Particles.Acid;
    return [x, y];
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
      pixelData[targetIndex] !== Particles.Acid &&
      pixelData[targetIndex] !== Particles.AcidVapor &&
      pixelData[targetIndex] !== Particles.Void &&
      pixelData[targetIndex] !== Particles.Clone &&
      isInBounds(targetX, targetY) &&
      !isEmpty(targetX, targetY)
    ) {
      const diffcultToBeCorroded = Math.pow(Density[pixelData[targetIndex]], 2);
      const normalizedDiffcultToBeCorroded = diffcultToBeCorroded / (diffcultToBeCorroded + 1);

      if (Random.number() > normalizedDiffcultToBeCorroded) {
        removePixel(targetIndex);
        removePixel(index);
      }

      return [x, y];
    }
  }

  const direction = Random.number() > 0.5 ? 1 : -1;
  i = 0;
  do {
    if (isEmpty(x + direction, y)) {
      x += direction;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    }
  } while (++i < 1);

  // random chance
  if (Random.number() < 0.3) {
    if (isEmpty(x, y - 1)) {
      y--;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
    }
  }

  return [x, y];
}

function acid(x, y) {
  let index = coordsToIndex(x, y);

  if (pixelData[index + 2] >= 100) {
    // turn into Steam
    pixelData[index] = Particles.AcidVapor;
    return [x, y];
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
      pixelData[targetIndex] !== Particles.Acid &&
      pixelData[targetIndex] !== Particles.AcidVapor &&
      pixelData[targetIndex] !== Particles.Void &&
      pixelData[targetIndex] !== Particles.Clone &&
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

      return [x, y];
    }
  }

  let i = 0;
  let canMove = true;
  do {
    if (isEmpty(x, y + 1)) {
      y++;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    } else {
      canMove = false;
    }
  } while (++i < 2 && canMove);

  let direction = Random.direction();

  i = 0;
  do {
    if (isEmpty(x + direction, y)) {
      x += direction;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    } else {
      direction *= -1;
      continue;
    }
  } while (++i < 3);

  return [x, y];
}

function steel(x, y) {
  // it doesn't interact with anything
}

function steam(x, y) {
  let index = coordsToIndex(x, y);

  // random chance
  if (Random.number() < 0.05) {
    pixelData[index + 2]--;
  }

  if (pixelData[index + 2] <= 50) {
    // turns into water
    pixelData[index] = Particles.Water;
    return [x, y];
  }

  const direction = Random.number() > 0.5 ? 1 : -1;
  i = 0;
  do {
    if (isEmpty(x + direction, y)) {
      x += direction;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    }
  } while (++i < 1);

  // random chance
  if (Random.number() < 0.3) {
    if (isEmpty(x, y - 1)) {
      y--;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
    }
  }

  return [x, y];
}

function fire(x, y) {
  let index = coordsToIndex(x, y);

  // probability to expire
  if (Random.number() > 0.95) {
    removePixel(index);
    return [x, y];
  }

  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  for (let [targetX, targetY] of adjacent) {
    const adjacentIndex = coordsToIndex(targetX, targetY);
    if (pixelData[adjacentIndex] === Particles.Water || pixelData[adjacentIndex] === Particles.Acid) {
      removePixel(index);
      pixelData[adjacentIndex + 2] += 10;
      return [x, y];
    }
  }

  // attempts to go up

  let i = 0;
  let canMove = true;
  do {
    if (isInBounds(x, y - 1) && pixelData[coordsToIndex(x, y - 1)] === Particles.Air) {
      y--;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
      pixelData[index + 1] = 1;
    }
  } while (++i < 2 && canMove);

  const direction = Random.number() > 0.5 ? 1 : -1;
  if (isEmpty(x + direction, y)) {
    x += direction;
    const targetIndex = coordsToIndex(x, y);
    movePixel(index, targetIndex);
    index = targetIndex;
    pixelData[index + 1] = 1;
  } else if (isEmpty(x - direction, y)) {
    x -= direction;
    const targetIndex = coordsToIndex(x, y);
    movePixel(index, targetIndex);
    index = targetIndex;
    pixelData[index + 1] = 1;
  } else {
    canMove = false;
  }

  return [x, y];

}

function voidParticle(x, y) {
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
  return [x, y];
}

function lava(x, y) {
  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];

  let index = coordsToIndex(x, y);

  for (let [targetX, targetY] of adjacent) {
    const adjacentIndex = coordsToIndex(targetX, targetY);
    if (pixelData[adjacentIndex] === Particles.Water || pixelData[adjacentIndex] === Particles.Acid) {
      // set the lava to stone
      pixelData[index] = Particles.Stone;
      pixelData[adjacentIndex + 2] += 100;
      return [x, y];
    }
  }

  let i = 0;
  let canMove = true;
  do {
    if (isEmpty(x, y + 1)) {
      y++;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    } else {
      canMove = false;
    }
  } while (++i < 2 && canMove);

  if (canMove) {
    return [x, y];
  }

  let direction = Random.direction();

  i = 0;
  do {
    if (isEmpty(x + direction, y)) {
      x += direction;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    } else {
      direction *= -1;
      continue;
    }
  } while (++i < 3);

  return [x, y];

}

function rust(x, y) {
  // acts like dust
  return dust(x, y);
}

function metal(x, y) {
  // metal does not move.
  // if a particle of metal is in contact with water, it has a probability of becoming rust.
  // if a particle of metal is in contact with rust, it has a smaller probability of becoming rust

  // check the adjacent pixels
  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
  const index = coordsToIndex(x, y);

  for (let [targetX, targetY] of adjacent) {
    if (!isInBounds(targetX, targetY)) continue;
    const targetIndex = coordsToIndex(targetX, targetY);
    if (pixelData[targetIndex] === Particles.Water) {
      if (Random.number() < 0.01) {
        pixelData[index] = Particles.Rust;
        return [x, y];
      }
    } else if (pixelData[targetIndex] === Particles.Rust) {
      if (Random.number() < 0.001) {
        pixelData[index] = Particles.Rust;
        return [x, y];
      }
    } else if (pixelData[targetIndex] === Particles.Lava) {
      if (Random.number() < 0.01) {
        pixelData[index] = Particles.Lava;
        return [x, y];
      }
    }
  }
  return [x, y];
}

function water(x, y) {
  let index = coordsToIndex(x, y);

  if (pixelData[index + 2] >= 100) {
    // turn into Steam
    pixelData[index] = Particles.Steam;
    return [x, y];
  }

  let i = 0;
  let canMove = true;
  do {
    if (isEmpty(x, y + 1)) {
      y++;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    } else {
      canMove = false;
    }
  } while (++i < 2 && canMove);

  let direction = Random.direction();

  i = 0;
  do {
    if (isEmpty(x + direction, y)) {
      x += direction;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    } else {
      direction *= -1;
      continue;
    }
  } while (++i < 3);

  return [x, y];
}

function stone(x, y) {

  const adjacent = [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ];
  // if adjacent to lava, it has a chance of becoming lava
  let index = coordsToIndex(x, y);

  for (let [targetX, targetY] of adjacent) {
    if (!isInBounds(targetX, targetY)) continue;
    const targetIndex = coordsToIndex(targetX, targetY);
    if (pixelData[targetIndex] === Particles.Lava) {
      if (Random.number() < 0.001) {
        pixelData[index] = Particles.Lava;
        return [x, y];
      }
    }
  }

  // check if the pixel below is empty
  let i = 0;
  let canMove = true;
  do {
    if (isEmpty(x, y + 1)) {
      y++;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    } else {
      canMove = false;
    }
  } while (++i <= 3 && canMove);

  return [x, y];
}

function dust(x, y) {
  let index = coordsToIndex(x, y);

  pixelData[index + 1] = pixelData[index + 1] < 0 ? 0 : pixelData[index + 1];

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
      if (Random.number() < 0.5) {
        // set the dust to fire
        pixelData[index] = Particles.Fire;
        return [x, y];
      }
    }
  }
  if (pixelData[index + 1] <= 0) { // The particle is settled
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
      if (isInBounds(targetX, targetY)) {
        const targetIndex = coordsToIndex(targetX, targetY);
        if (pixelData[targetIndex] === Particles.Dust) {
          count++;
        }
      }
    } while (++i < adjacentDust.length);

    if (count >= 4) {
      // if there are 4 or more dust particles touching the particle it doesn't need to move
      return [x, y];
    }
  }

  let i = 0;
  let canMove = true;
  do {
    if (isEmpty(x, y + 1)) {
      // moving down also gives energy to the dust above
      const aboveIndex = coordsToIndex(x, y - 1);
      if (isInBounds(x, y - 1) && pixelData[aboveIndex] === Particles.Dust) {
        pixelData[aboveIndex + 1] = pixelData[aboveIndex + 1] > 100 ? 100 : pixelData[aboveIndex + 1] + 1;
      }

      pixelData[index + 1] = pixelData[index + 1] > 100 ? 100 : pixelData[index + 1] + 2;

      y++;
      const targetIndex = coordsToIndex(x, y);
      movePixel(index, targetIndex);
      index = targetIndex;
    } else {
      pixelData[index + 1]--;
      pixelData[index + 1] = pixelData[index + 1] < 0 ? 0 : pixelData[index + 1] - 1;
      canMove = false;
    }
  } while (++i <= 2 && canMove);


  if (pixelData[index + 1] <= 0) return [x, y];

  // chooses left or right
  const direction = Random.direction();
  if (isEmpty(x + direction, y)) {
    x += direction;
    const targetIndex = coordsToIndex(x, y);
    movePixel(index, targetIndex);
    index = targetIndex;
  } else {
    // dust can move sideways even on  liquids
    // check if the pixel in the desired spot is liquid
    if (Particles.isFluid(pixelData[coordsToIndex(x + direction, y)])) {
      // it is a liquid, in that case swap instead of moving
      swapPixel(x, y, x + direction, y);
    } else {
      if (!canMove) {
        pixelData[index + 1] = pixelData[index + 1] < 0 ? 0 : pixelData[index + 1] - 1;
      }
    }
  }

  return [x, y];
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

function swapPixel(index1, index2) {
  let temp;
  for (let i = 0; i < pixelDataSize; i++) {
    temp = pixelData[index1 + i];
    pixelData[index1 + i] = pixelData[index2 + i];
    pixelData[index2 + i] = temp;
  }
}




function log(data) {
  postMessage({
    type: 'debug',
    data: data,
  });
}