// check if support
if (
    typeof SharedArrayBuffer === 'undefined' ||
    !HTMLCanvasElement.prototype.transferControlToOffscreen
) {
    alert('This page cannot run in this browser. Please use a modern browser or a recent version of Chrome.');
    throw new Error('Unsupported browser');
}
const Random = require('./Utils/Random');

const { Names, Colors, Particles } = require('./Particles/Particles');
const Sandbox = require('./Sandbox');

window.onload = async () => {

    const sandboxArea = document.getElementById('sandboxArea');
    const menuArea = document.getElementById('menu');
    const coords = document.getElementById('coords');
    const fps = document.getElementById('fps');
    const pause = document.getElementById('pause');
    const brush = document.getElementById('brushTool');
    const brushMinus = document.getElementById('brushMinus');
    const brushPlus = document.getElementById('brushPlus');
    const clear = document.getElementById('clear');
    const elements = document.getElementById('elements');
    const particleName = document.getElementById('particleName');
    const brush0 = document.getElementById('brush0');
    const brush1 = document.getElementById('brush1');
    const save = document.getElementById('save');
    const share = document.getElementById('share');
    const shareSpinner = document.getElementById('shareSpinner');
    const sidebar = document.getElementById('sidebar');

    let rows = sandboxArea.offsetHeight;
    let columns = sandboxArea.offsetWidth;
    // Calculate the amount of tiles
    let tilesWidth = Math.floor(columns / 400);
    let tilesHeight = Math.ceil(rows / 1400);

    const sidebarSize = sidebar.offsetWidth;

    const tileGridSize = [tilesWidth, tilesHeight];
    let sandbox = new Sandbox(sandboxArea, tileGridSize, sidebarSize);

    await sandbox.start();

    // get the parameter p from the url
    const urlParams = new URLSearchParams(window.location.search);
    const p = urlParams.get('p');
    if (p) {
        await sandbox.loadFromCDN(p);
    }

    let resizeTimeout;
    window.addEventListener('resize', async () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 100);
    });

    async function resize() {
        const [data, metadata] = sandbox.end();
        sandbox = new Sandbox(sandboxArea, tileGridSize, sidebarSize);
        await sandbox.start();
        await sandbox.loadPixelData(data, metadata);
    }

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
        element.setAttribute('id', `el-${name}`);
        element.classList.add('element');
        element.classList.add('outline');
        element.textContent = name;
        element.style.color = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

        elements.appendChild(element);

        element.onclick = (e) => {
            sandbox.setBrushParticle(0, Particles.getId(name));
        };

        element.oncontextmenu = (e) => {
            sandbox.setBrushParticle(1, Particles.getId(name));
            e.preventDefault();
        };
    }

    save.onclick = async () => {
        await sandbox.save();
    }

    share.onclick = async () => {
        const randomName = `${Random.string(10)}`;
        // update the current URL without reloading the page
        // set the GET parameter p to the fileName.png

        const url = new URL(window.location.href);
        url.searchParams.set('p', randomName);
        window.history.replaceState({}, '', url.href);

        // add the current URL to the clipboard

        navigator.clipboard.writeText(url.href);

        shareSpinner.classList.add('small-loader');
        try {
            await sandbox.share(randomName);
        } finally {
            shareSpinner.classList.remove('small-loader');
        }
    }

    // on drop file
    sandboxArea.ondragover = handleDrag;
    menuArea.ondragover = handleDrag;
    sandboxArea.ondrop = handleDrop;
    menuArea.ondrop = handleDrop;

    function handleDrag(event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    async function handleDrop(e) {
        e.preventDefault();

        if (e.dataTransfer.items) {
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                if (e.dataTransfer.items[i].kind === 'file') {
                    const file = e.dataTransfer.items[i].getAsFile();
                    await sandbox.loadFile(file);
                }
            }
        }


    }

    function update() {
        coords.textContent = `${sandbox.mousePos.x} ${sandbox.mousePos.y}`;
        brush.textContent = `Brush:${sandbox.brushSize.toString().padStart(2, '0')}`;

        // Particle name display
        const particleId = sandbox.getParticleIdUnderMouse();
        particleName.textContent = `${Names[particleId]}`;
        particleName.style.color = `rgb(${Colors[particleId][0]}, ${Colors[particleId][1]}, ${Colors[particleId][2]})`;

        // get the selected particle div by the particle name
        const selectedParticle0 = document.getElementById(`el-${Names[sandbox.getBrushParticleId(0)]}`);
        const selectedParticle1 = document.getElementById(`el-${Names[sandbox.getBrushParticleId(1)]}`);

        // move the brush1 and brush2 divs to the selected particle
        brush0.style.left = `${selectedParticle0.offsetLeft - 6}px`;
        brush0.style.top = `${selectedParticle0.offsetTop}px`;

        brush1.style.left = `${selectedParticle1.offsetLeft - 6}px`;
        brush1.style.top = `${selectedParticle1.offsetTop}px`;

        pause.textContent = sandbox.getPauseState() ? 'Play' : 'Pause';
        fps.textContent = `${sandbox.getPauseState() == false ? Math.floor(sandbox.getFPS()) : '00'}`;

        window.requestAnimationFrame(update);
    }

    window.requestAnimationFrame(update);

    // request the file list from http://particles-api.lugui.in
    const response = await fetch('https://particles-api.lugui.in');
    const data = await response.json();

    // remove everything from sidebar
    sidebar.innerHTML = '';

    for (let i = 0; i < data.length; i++) {
        const fileName = data[i];
        const nameWithoutExtension = fileName.split('.')[0];

        // create a div
        const item = document.createElement('div');
        item.classList.add('sidebarItem');
        item.textContent = nameWithoutExtension;

        // add the image to the div
        const img = document.createElement('img');
        img.classList.add('sidebarThumbnail');
        img.src = `https://particles-cdn.lugui.in/${fileName}`;
        item.appendChild(img);

        // add the div to the sidebar
        sidebar.appendChild(item);

        // on click image
        item.onclick = async () => {
            await sandbox.loadFromCDN(nameWithoutExtension);
            const url = new URL(window.location.href);
            url.searchParams.set('p', nameWithoutExtension);
            window.history.replaceState({}, '', url.href);
        }

    }
}