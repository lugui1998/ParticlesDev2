const { ParticleUtils } = require('./Particles/Particles');
const ParticleGrid = require('./ParticleGrid');


let width = 0;
let height = 0;
let globalOffsetX = 0;
let globalOffsetY = 0;
let canvas = null;

let grid = null;

onmessage = function (e) {
  handleMessage(e.data);
}

function handleMessage(message) {
  switch (message.type) {
    case 'init': initPixelGrid(message.data); break;
    case 'end': self.close(); break;
    case 'paint': paint(message.data); break;
    case 'import': handleImport(message.data); break;
    case 'removePixel': removePixel(message.data.pixel); break;
  }
}

function handleImport(data) {
  if (grid.existHere(data.pixel.x, data.pixel.y) && grid.isEmpty(data.pixel.x, data.pixel.y)) {
    grid.overide(data.pixel.x, data.pixel.y, ParticleUtils.createByName(data.particle));
    postMessage({
      type: 'imported',
      data: {
        originalTile: data.originalTile,
        originalPixel: data.originalPixel
      }
    });
  }
}

function paint(data) {
  const pixels = data.pixels;

  for (const pixel of pixels) {
    try {
      grid.overide(pixel.x, pixel.y, ParticleUtils.createByName(data.particleName));
    } catch (e) {
      console.log(e);
    }
  }
}

function initPixelGrid(data) {
  width = data.width;
  height = data.height;
  canvas = data.canvas;
  globalOffsetX = data.globalOffsetX;
  globalOffsetY = data.globalOffsetY;

  grid = new ParticleGrid(width, height, globalOffsetX, globalOffsetY);

  ctx = canvas.getContext('2d', { alpha: false });
  requestAnimationFrame(render);
}

function render() {
  if (doPhysics()) {
    // debugger;
  }
  // fill canvas with random colors for each pixel
  let imagedata = ctx.createImageData(width, height);
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const pixelindex = (i + j * width) * 4;
      const color = grid.get(i, j).getColor();

      imagedata.data[pixelindex] = color[0];
      imagedata.data[pixelindex + 1] = color[1];
      imagedata.data[pixelindex + 2] = color[2];
      imagedata.data[pixelindex + 3] = 255;
    }
  }
  ctx.putImageData(imagedata, 0, 0);
  requestAnimationFrame(render);
}

function doPhysics() {
  let donePhysics = false;
  for (let i = 0; i < width; i++) {
    for (let j = height - 1; j >= 0; j--) {
      const particle = grid.get(i, j);
      const changes = particle.process(grid, i, j);

      if (changes) {
        donePhysics = true;

        if (changes.export) {
          // Export the particle
          postMessage({
            type: 'export',
            data: {
              coords: {
                x: i,
                y: j,
              },
              target: changes.target,
              particle: particle.getName(),
            }
          });
        } else {
          grid.erase(i, j);
          grid.overide(changes.target.x, changes.target.y, particle);
        }

      }


    }
  }
  return donePhysics;
}

function removePixel(pixel) {
  grid.erase(pixel.x, pixel.y);
}






function log(data) {
  postMessage({
    type: 'debug',
    data: data,
  });
}