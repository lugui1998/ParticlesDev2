const Sandbox = require('./Sandbox');

const sandboxArea = document.getElementById('sandboxArea');
// const coords = document.getElementById('coords');
 const fps = document.getElementById('coords');

const rows = sandboxArea.offsetHeight;
const columns = sandboxArea.offsetWidth;


// Calculate the amount of tiles
const tilesWidth = Math.floor(columns / 400);
const tilesHeight = Math.ceil(rows / 300);

const tileGridSize = [tilesWidth, tilesHeight];
const sandbox = new Sandbox(sandboxArea, tileGridSize);



function update() {
    sandbox.update();


    coords.textContent = `${sandbox.mousePos.x} ${sandbox.mousePos.y}`;

    window.requestAnimationFrame(update);
}
window.requestAnimationFrame(update);


