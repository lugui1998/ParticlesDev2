const Sandbox = require('./Sandbox');

const sandboxArea = document.getElementById('sandboxArea');
const coords = document.getElementById('coords');
const fps = document.getElementById('fps');
const pause = document.getElementById('pause');
const brush = document.getElementById('brushTool');
const brushMinus = document.getElementById('brushMinus');
const brushPlus = document.getElementById('brushPlus');
const clear = document.getElementById('clear');

let lagWarning = true;
// enable in 5 seconds
setTimeout(() => {
    lagWarning = false;
}, 5000);


let rows = sandboxArea.offsetHeight;
let columns = sandboxArea.offsetWidth;
// Calculate the amount of tiles
let tilesWidth = Math.floor(columns / 400);
let tilesHeight = Math.ceil(rows / 1400);

const tileGridSize = [tilesWidth, tilesHeight];
let sandbox = new Sandbox(sandboxArea, tileGridSize);

window.addEventListener('resize', () => {
    document.location.reload();
});

pause.addEventListener('click', () => {
    sandbox.togglePauseState();
});

document.addEventListener('keydown', event => {
    if (event.code == 'Space') {
        sandbox.togglePauseState();
    }
});

// on scroll, update the brush size
sandboxArea.addEventListener('wheel', (event) => {
    const currentBrushSize = sandbox.brushSize;
    const newBrushSize = currentBrushSize + (event.deltaY / 100) * -1;
    sandbox.setBrushSize(newBrushSize);
});

brushMinus.addEventListener('click', () => {
    const currentBrushSize = sandbox.brushSize;
    const newBrushSize = currentBrushSize - 1;
    sandbox.setBrushSize(newBrushSize);
});

brushPlus.addEventListener('click', () => {
    const currentBrushSize = sandbox.brushSize;
    const newBrushSize = currentBrushSize + 1;
    sandbox.setBrushSize(newBrushSize);
});

clear.addEventListener('click', () => {
    sandbox.clear();
});


function update() {
    sandbox.update();
    coords.textContent = `${sandbox.mousePos.x} ${sandbox.mousePos.y}`;

    brush.textContent = `Brush:${sandbox.getBrushSize()}`


    window.requestAnimationFrame(update);
}
window.requestAnimationFrame(update);

// Update the menu on less improtant stuff
setInterval(async () => {
    pause.textContent = sandbox.getPauseState() ? 'Play' : 'Pause';
    fps.textContent = `${sandbox.getPauseState() == false ? Math.floor(sandbox.getPhysicsFPS()) : '00'}`;

    // Warn the user if the physics is lagging
    if (sandbox.getPhysicsFPS() < 5 && !lagWarning && (rows > 1000 || columns > 1000)) {
        lagWarning = true;
        sandbox.mousePressed = false;
        alert('Physics is lagging. Consider running on a smaller window.');
    }


}, 100);