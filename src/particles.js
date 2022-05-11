// check if SharedArrayBuffer is supported
if (typeof SharedArrayBuffer === 'undefined') {
    alert('This page can only run on modern browsers.');
    throw new Error('SharedArrayBuffer is not supported');
}

const { Names, Colors, Particles } = require('./Particles/Particles');
const Sandbox = require('./Sandbox');

const sandboxArea = document.getElementById('sandboxArea');
const coords = document.getElementById('coords');
const fps = document.getElementById('fps');
const pause = document.getElementById('pause');
const brush = document.getElementById('brushTool');
const brushMinus = document.getElementById('brushMinus');
const brushPlus = document.getElementById('brushPlus');
const clear = document.getElementById('clear');
const elements = document.getElementById('elements');

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
    const newBrushSize = currentBrushSize + Math.round((event.deltaY / 100)) * -1;
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

// Add elements to the menu
for (let i = 0; i < Names.length; i++) {
    const name = Names[i];
    const color = Colors[i];
    const element = document.createElement('div');
    element.classList.add('element');
    element.textContent = name;
    element.style.color = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

    elements.appendChild(element);

    element.onclick = () => {
        sandbox.setBrushParticle(Particles.getId(name));
    };
}


function update() {
    coords.textContent = `${sandbox.mousePos.x} ${sandbox.mousePos.y}`;
    brush.textContent = `Brush:${sandbox.brushSize.toString().padStart(2, '0')}`;
    sandbox.update();
    window.requestAnimationFrame(update);
}
window.requestAnimationFrame(update);

setInterval(() => {
    if (sandbox.getPhysicsFPS() < 60) {
        sandbox.update();
    }
}, 1);

// Update the menu on less improtant stuff
setInterval(async () => {
    pause.textContent = sandbox.getPauseState() ? 'Play' : 'Pause';
    fps.textContent = `${sandbox.getPauseState() == false ? Math.floor(sandbox.getPhysicsFPS()) : '00'}`;

}, 100);