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

  ctx = canvas.getContext('2d', { alpha: false });
  requestAnimationFrame(render);
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
    for (let x = endX - 1; x >= startX; x--) {
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

function sand(x, y) {
  const index = coordsToIndex(x, y);

  // check if the pixel below is empty
  if (isEmpty(x, y + 1)) {
    pixelData[index + 1] = 1;
    movePixel(x, y, x, y + 1);
    return;
  }

  if (pixelData[index + 1] <= 0) return;

  // chooses left or right
  const direction = Math.random() > 0.5 ? 1 : -1;
  if (isEmpty(x + direction, y)) {
    pixelData[index + 1] = 0;
    movePixel(x, y, x + direction, y);
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




function log(data) {
  postMessage({
    type: 'debug',
    data: data,
  });
}