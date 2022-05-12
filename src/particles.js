// check if support
if (
    typeof SharedArrayBuffer === 'undefined' ||
    !HTMLCanvasElement.prototype.transferControlToOffscreen
) {
    alert('This page cannot run on modern browsers.'); // Just to trigger Firefox users
    throw new Error('Unsupported browser');
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
const particleName = document.getElementById('particleName');

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
    const newBrushSize = event.deltaY > 0 ? currentBrushSize - 1 : currentBrushSize + 1;
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
    if (Particles.isHidden(i)) {
        continue;
    }
    const name = Names[i];
    const color = Colors[i];
    const element = document.createElement('div');
    element.classList.add('element');
    if (sandbox.getBrushParticleId() === i) {
        element.classList.add('selected');
    } else {
        element.classList.add('unSelected');
    }
    element.textContent = name;
    element.style.color = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

    elements.appendChild(element);


    element.onclick = () => {
        // unselect all elements
        for (let j = 0; j < elements.children.length; j++) {
            elements.children[j].classList.remove('selected');
            elements.children[j].classList.add('unSelected');
        }


        // add the class "selected" to the element
        element.classList.add('selected');
        element.classList.remove('unSelected');
        sandbox.setBrushParticle(Particles.getId(name));
    };

}


function update() {
    coords.textContent = `${sandbox.mousePos.x} ${sandbox.mousePos.y}`;
    brush.textContent = `Brush:${sandbox.brushSize.toString().padStart(2, '0')}`;

    // Particle name display
    const particleId = sandbox.getParticleIdUnderMouse();
    particleName.textContent = `${Names[particleId]}`;
    particleName.style.color = `rgb(${Colors[particleId][0]}, ${Colors[particleId][1]}, ${Colors[particleId][2]})`;

    window.requestAnimationFrame(update);
}
window.requestAnimationFrame(update);

setInterval(() => {
    // cap frames per second
    if (sandbox.getPhysicsFPS() < 65) {
        sandbox.update();
    }
}, 1);

setInterval(() => {
    // min FPS
    sandbox.update();
}, 20);

// Update the menu on less improtant stuff
setInterval(async () => {
    pause.textContent = sandbox.getPauseState() ? 'Play' : 'Pause';
    fps.textContent = `${sandbox.getPauseState() == false ? Math.floor(sandbox.getPhysicsFPS()) : '00'}`;

}, 100);