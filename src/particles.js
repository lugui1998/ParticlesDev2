const Sandbox = require('./Sandbox');

const sandboxArea = document.getElementById('sandboxArea');
const coords = document.getElementById('coords');
const fps = document.getElementById('fps');
const pause = document.getElementById('pause');

const rows = sandboxArea.offsetHeight;
const columns = sandboxArea.offsetWidth;


// Calculate the amount of tiles
const tilesWidth = Math.floor(columns / 200);
const tilesHeight = Math.ceil(rows / 1400);

const tileGridSize = [tilesWidth, tilesHeight];
const sandbox = new Sandbox(sandboxArea, tileGridSize);


pause.addEventListener('click', () => {
    sandbox.togglePauseState();
});


function update() {
    sandbox.update();
    coords.textContent = `${sandbox.mousePos.x} ${sandbox.mousePos.y}`;
   

    window.requestAnimationFrame(update);
}
window.requestAnimationFrame(update);

// Update the menu on less improtant stuff
setInterval(() => {
    pause.textContent = sandbox.getPauseState() ? 'Play' : 'Pause';
    fps.textContent = `${sandbox.getPauseState() == false ? Math.floor(sandbox.getPhysicsFPS()) : '00'}`;
}, 100);