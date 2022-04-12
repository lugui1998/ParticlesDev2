const { ParticleUtils } = require('./Particles/Particles');


let width = 0;
let height = 0;
let canvas = null;

let grid = [];

onmessage = function (e) {
  handleMessage(e.data);
}

function handleMessage(message) {
  switch (message.type) {
    case 'init': initPixelGrid(message.data); break;
    case 'end': self.close(); break;
    case 'paint': paint(message.data); break;
  }
}

function paint(data) {
  const pixels = data.pixels;

  for (const pixel of pixels) {
    try {
      grid[pixel.x][pixel.y] = ParticleUtils.createByName(data.particleName);
    } catch (e) {
      console.log(e);
    }
  }
}

function initPixelGrid(data) {
  width = data.width;
  height = data.height;
  canvas = data.canvas;

  // start grid
  for (let i = 0; i < width; i++) {
    grid[i] = [];
    for (let j = 0; j < height; j++) {
      grid[i][j] = ParticleUtils.createByName('Void');
    }
  }

  ctx = canvas.getContext('2d', { alpha: false });
  requestAnimationFrame(render);
}

function render() {
  // fill canvas with random colors for each pixel
  let imagedata = ctx.createImageData(width, height);
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const pixelindex = (i + j * width) * 4;
      const color = grid[i][j].GetColor();

      imagedata.data[pixelindex] = color[0];
      imagedata.data[pixelindex + 1] = color[1];
      imagedata.data[pixelindex + 2] = color[2];
      imagedata.data[pixelindex + 3] = 255;
    }
  }
  ctx.putImageData(imagedata, 0, 0);
  requestAnimationFrame(render);
}