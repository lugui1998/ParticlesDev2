const Sandbox = require('./Sandbox');

const sandboxArea = document.getElementById('sandboxArea');
const coords = document.getElementById('coords');

const rows = sandboxArea.offsetHeight;
const columns = sandboxArea.offsetWidth;


// Calculate the amount of tiles
const tilesWidth = Math.floor(columns / 300);
const tilesHeight = Math.ceil(rows / 400);

const tileGridSize = [tilesWidth, tilesHeight];
const sandbox = new Sandbox(sandboxArea, tileGridSize);



function update() {
    sandbox.update();
    window.requestAnimationFrame(update);
}
window.requestAnimationFrame(update);



sandboxArea.onmousemove = (e) => {
    coords.innerHTML = `${e.offsetX} ${e.offsetY}`;
}