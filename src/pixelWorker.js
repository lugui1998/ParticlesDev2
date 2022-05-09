const { Colors, Particles } = require('./Particles/Particles');

let pixelData;
let canvas;
let startX;
let startY;
let endX;
let endY;
let pixelDataSize;
let screenWidth;
let screenHeight;

let width;
let height;

const subTileSize = 50;
let subTiles = [];
let tileCheckIndex = 0;

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

  // Subtiles are defined by its startX and startY, and its endX and endY
  // a tile may be considered inactive under certain conditions
  // if the tile is inactive, physics on it will be skipped
  // some times, subtiles can have an ending offset that results in parts of it being outside the worker
  // this os not a problem because there are no pixels to process in those parts

  // Create subtiles
  for (let y = startY; y < endY; y += subTileSize) {
    for (let x = startX; x < endX; x += subTileSize) {
      subTiles.push({
        startX: x,
        startY: y,
        endX: Math.min(x + subTileSize, endX),
        endY: Math.min(y + subTileSize, endY),
        active: false,
      });
    }
  }

  ctx = canvas.getContext('2d', { alpha: false });
  requestAnimationFrame(render);
}

function render() {
  let imagedata = ctx.createImageData(width, height);
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const pixelIndex = coordsToIndex(x, y);
      // const pixeldData = desserialziePixel(pixelIndex);
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

  let i = 0;
  do {
    tileCheckIndex++;
    if (tileCheckIndex >= subTiles.length) {
      tileCheckIndex = 0;
    }
    subTiles[tileCheckIndex].active = !isSubtileStatic(tileCheckIndex);
  } while (++i < 5);

  requestAnimationFrame(render);
}


function updatePixels(pixelArr) {
  for (let i = 0; i < pixelArr.length; i++) {
    const subtileIndex = coordsToSubTileIndex(pixelArr[i][0], pixelArr[i][1]);
    if (subtileIndex !== undefined && subtileIndex !== -1) {
      subTiles[subtileIndex].active = true;
    }
  }
}

function isSubtileStatic(index) {
  let differentMaterial = false;
  let lastMaterial = null;
  const subtile = subTiles[index];
  for (let y = subtile.startY; y < subtile.endY; y++) {
    for (let x = subtile.startX; x < subtile.endX; x++) {
      const pixelIndex = coordsToIndex(x, y);
      differentMaterial |= lastMaterial !== null && lastMaterial != pixelData[pixelIndex];

      if (differentMaterial) {
        return false;
      }
      lastMaterial = pixelData[pixelIndex];
    }
  }
  return true;
}

function coordsToSubTileIndex(x, y) {
  // find the subtile that contains the pixel
  return subTiles.findIndex(subtile => {
    return subtile.startX <= x && subtile.endX > x && subtile.startY <= y && subtile.endY > y;
  })
}

function coordsToIndex(x, y) {
  // On a array of size screenWidth * screenHeight
  // Find the index of the pixel determined by the x and y coordinates

  return (x + y * screenWidth) * pixelDataSize;
}


function desserialziePixel(index) {
  // Retrives the data about the pixel from the shared buffer
  // This is done by calculating the index of the pixel in the shared buffer
  // then getting the next pixelDataSize values

  const data = pixelData.slice(index, index + pixelDataSize);

  return {
    type: data[0],
    info1: data[1],
    info2: data[2],
    info3: data[3],
  };

}

// Pixel Object to Array
function serializePixel(pixel) {
  return [
    pixel.type,
    pixel.info1,
    pixel.info2,
    pixel.info3,
  ];
}

function doPhysics() {

  // for each subtile from end to start
  for (let subtileIndex = subTiles.length - 1; subtileIndex >= 0; subtileIndex--) {
    const subtile = subTiles[subtileIndex];
    if (!subtile.active) continue;

    // for each pixel in the subtile from bottom to top
    for (let y = subtile.endY - 1; y >= subtile.startY; y--) {
      for (let x = subtile.startX; x < subtile.endX; x++) {
        processPixel(x, y);
      }
    }
  }

  postMessage({
    type: 'donePhysics',
  });
}


function processPixel(x, y) {
  const index = coordsToIndex(x, y);

  if(pixelData[index] === 0) return;

  const data = desserialziePixel(index);
  switch (data.type) {
    case Particles.Sand: { sand(x, y, index, data); break; }
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

function setPixel(index, data) {
  let i = 0;
  do {
    pixelData[index] = data[0];
  } while (++i < pixelDataSize);
}

function deletePixel(index) {
  pixelData[index] = Particles.Void;
  let i = 1;
  do {
    pixelData[index] = 0;
  } while (++i < pixelDataSize);
}

/* Particle Physics */

function sand(x, y, index, data) {
  const maxKinecticEnergy = 2;
  const maxDownMovement = 4;

  let kinecticEnergy = data.info1;
  let stepX = x;
  let stepY = y;
  let setpIndex = index;
  let setepData = data;

  // Check if the pixel bellow is empty.
  // if it is, check the next one up to maxMovesDown
  // stop when the target space is not empty or the maxMovesDown is reached

  let i = 0;
  let targetX = x;
  let targetY = y;
  let targetIndex;
  let targetData = null;
  do {
    targetY++;
    targetIndex = coordsToIndex(targetX, targetY);
    targetData = desserialziePixel(targetIndex);
    if (isEmpty(targetX, targetY)) {
      stepX = targetX;
      stepY = targetY;
      setpIndex = targetIndex;
    } else {
      break;
    }
  } while (++i <= maxDownMovement);

  kinecticEnergy = kinecticEnergy < maxKinecticEnergy ? kinecticEnergy + 1 : maxKinecticEnergy;

  // now, the particle may move sideways if it is able to.
  // chooses a random direction: 1, 0, -1
  const randomDirection = Math.floor(Math.random() * 3) - 1;
  let sideMoves = 0;
  while (++sideMoves <= kinecticEnergy) {
    targetX += randomDirection;
    targetIndex = coordsToIndex(targetX, targetY);
    targetData = desserialziePixel(targetIndex);
    kinecticEnergy--;
    if (isEmpty(targetX, targetY)) {
      stepX = targetX;
      stepY = targetY;
      setpIndex = targetIndex;
    } else {
      break;
    }
  }


  // movements finished
  setepData.info1 = kinecticEnergy;

  // move the particle to the target position
  setPixel(setpIndex, serializePixel(setepData));
  if (stepX !== x || stepY !== y) {
    deletePixel(index);
  }

  // when the particle enters a subtile it may set it to active
  const subtileIndex = coordsToSubTileIndex(stepX, stepY);
  if (subtileIndex !== undefined && subtileIndex !== -1) {
    subTiles[subtileIndex].active = true;
  }

}




function log(data) {
  postMessage({
    type: 'debug',
    data: data,
  });
}