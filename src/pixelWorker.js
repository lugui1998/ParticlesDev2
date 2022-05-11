const { Colors, Particles, Density, Liquids } = require('./Particles/Particles');
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
      const pixelIndex = coordsToIndex(x, y);

      // Map the index to the actual position without offset
      const imageIndex = (x - startX + (y - startY) * width) * 4;

      let color = Colors[pixelData[pixelIndex]];

      // add a pixel
      imagedata.data[imageIndex] = color[0];
      imagedata.data[imageIndex + 1] = color[1];
      imagedata.data[imageIndex + 2] = color[2];
      imagedata.data[imageIndex + 3] = 255;

    }
  }

  ctx.putImageData(imagedata, 0, 0);

  // Also do stuff that are not rendering, but still need to be done frequently
  // the render is actually very fast, so lets use that extra time to speed up the physics
  shuffleArray(lineOrder);

  requestAnimationFrame(render);
}



function coordsToIndex(x, y) {
  // On a array of size screenWidth * screenHeight
  // Find the index of the pixel determined by the x and y coordinates

  return (x + y * screenWidth) * pixelDataSize;
}

function doPhysics() {

  // for each pixel of the Tile from end to start
  for (let y = endY - 1; y >= startY; y--) {
    // for (let x = endX - 1; x >= startX; x--) {
    for (let x of lineOrder) {
      processPixel(x, y);
    }
  }

  postMessage({
    type: 'donePhysics',
  });
}


function processPixel(x, y) {
  const index = coordsToIndex(x, y);

  switch (pixelData[index]) {
    case Particles.Void: { return; }
    case Particles.Sand: { sand(x, y); break; }
    case Particles.Stone: { stone(x, y); break; }
    case Particles.Water: { water(x, y); break; }
    case Particles.Metal: { metal(x, y); break; }
    case Particles.Rust: { rust(x, y); break; }
  }
}

function isInBounds(x, y) {
  // check if a pixel is within the screen space
  return x >= 0 && x < screenWidth && y >= 0 && y < screenHeight;
}

function isEmpty(x, y) {
  if (!isInBounds(x, y)) return false;
  const index = coordsToIndex(x, y);
  return pixelData[index] === 0;
}

/* Particle Physics */

function rust(x, y) {
  // acts like sand
  sand(x, y);
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
        return;
      }
    } else if (pixelData[targetIndex] === Particles.Rust) {
      if (Random.number() < 0.001) {
        pixelData[index] = Particles.Rust;
        return;
      }
    }
  }
}

function water(x, y) {
  if (!isEmpty(x, y - 1) && isInBounds(x, y - 1)) {
    const aboveIndex = coordsToIndex(x, y - 1);

    if (Density[pixelData[aboveIndex]] > Density[Particles.Water]) {
      // probaiblity of sinking based on density difference
      if (Random.number() < Density[pixelData[aboveIndex]]) {
        swapPixel(x, y, x, y - 1);
        return;
      }
    }
  }
  let i = 0;
  let canMove = true;
  do {
    if (isEmpty(x, y + 1)) {
      movePixel(x, y, x, ++y);
    } else {
      canMove = false;
    }
  } while (++i < 1 && canMove);

  const direction = Random.direction();

  i = 0;
  do {
    if (isEmpty(x + direction, y)) {
      movePixel(x, y, x + direction, y);
      x += direction;
    } else {
      return;
    }
  } while (++i < 1);

}

function stone(x, y) {
  // check if the pixel below is empty
  let i = 0;
  let canMove = true;
  do {
    if (isEmpty(x, y + 1)) {
      movePixel(x, y, x, ++y);
    } else {
      canMove = false;
    }
  } while (++i <= 3 && canMove);
}

function sand(x, y) {
  const index = coordsToIndex(x, y);

  let i = 0;
  let canMove = true;
  do {
    if (isEmpty(x, y + 1)) {
      pixelData[index + 1] = 1;
      movePixel(x, y, x, ++y);
    } else {
      canMove = false;
    }
  } while (++i <= 2 && canMove);
  if (canMove) {
    return;
  }

  if (pixelData[index + 1] <= 0) return;

  // chooses left or right
  const direction = Random.direction();
  if (isEmpty(x + direction, y)) {
    pixelData[index + 1] = 0;
    movePixel(x, y, x + direction, y);
  } else {
    // Sand can move sideways even on  liquids
    // check if the pixel in the desired spot is liquid
    if (Particles.isLiquid(pixelData[coordsToIndex(x + direction, y)])) {
      // it is a liquid, in that case swap instead of moving
      swapPixel(x, y, x + direction, y);
    }
  }

  pixelData[index + 1] = 0;

}


function movePixel(prevX, prevY, x, y) {
  // Transfers the data starting at the previous index to the new index
  const prevPos = coordsToIndex(prevX, prevY);
  const newPos = coordsToIndex(x, y);
  for (let i = 0; i < pixelDataSize; i++) {
    pixelData[newPos + i] = pixelData[prevPos + i];

    // also deletes the data at the old position
    pixelData[prevPos + i] = 0;
  }
}

function swapPixel(x, y, x2, y2) {
  const index1 = coordsToIndex(x, y);
  const index2 = coordsToIndex(x2, y2);
  const temp = [];
  for (let i = 0; i < pixelDataSize; i++) {
    temp[i] = pixelData[index1 + i];
    pixelData[index1 + i] = pixelData[index2 + i];
    pixelData[index2 + i] = temp[i];
  }
}




function log(data) {
  postMessage({
    type: 'debug',
    data: data,
  });
}