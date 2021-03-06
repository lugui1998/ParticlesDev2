const { deflate, inflate } = require('deflate-js');

const Tile = require('./Tile');

const { Particles, Names, InitialState, Colors } = require('./Particles/Particles');
const Random = require('./Utils/Random');
const QuickBits = require('./Utils/QuickBits');


const pixelDataSize = 8;


class Sandbox {
    width = 0;
    height = 0;
    sidebarSize = 0;
    tileGridSize = 0;

    physicsStartTime = 0;
    lastFramesTimes = [];

    sharedBuffer = null;
    tiles = [];
    sharedFrameCountBuffer = null;
    tileFrameCount = [];
    sharedFrameTimesBuffer = null;
    tileFrameTimes = [];

    mousePrevPos = {};
    mousePos = { x: 0, y: 0 };
    leftMousePressed = false;
    rightMousePressed = false;

    sandboxArea = null;

    grid = null;

    brush0 = Particles.Dust;
    brush1 = Particles.Air;
    brushSize = 1;

    canvas;

    pauseState = false;

    constructor(
        sandboxArea,
        tileGridSize = [4, 2],
        sidebarSize
    ) {
        this.width = sandboxArea.offsetWidth;
        this.height = sandboxArea.offsetHeight;
        this.tileGridSize = tileGridSize;
        this.sandboxArea = sandboxArea;
        this.sidebarSize = sidebarSize;
    }

    async start() {
        // allocate a sahred buffer
        this.sharedBuffer = new SharedArrayBuffer(this.width * this.height * 2 * pixelDataSize);
        this.grid = new Int16Array(this.sharedBuffer);

        const tileWidth = Math.ceil(this.width / this.tileGridSize[0]);
        const tileHeight = Math.ceil(this.height / this.tileGridSize[1]);
        let tileIndex = 0;
        let x = 0;

        const tileColsCount = this.tileGridSize[0];
        const tileRowsCount = this.tileGridSize[1];
        
        const tilesCount = tileColsCount * tileRowsCount;

        this.sharedFrameCountBuffer = new SharedArrayBuffer(tilesCount * 4);
        this.tileFrameCount = new Int32Array(this.sharedFrameCountBuffer);

        this.sharedFrameTimesBuffer = new SharedArrayBuffer(tilesCount * 4);
        this.tileFrameTimes = new Float32Array(this.sharedFrameTimesBuffer);
        

        const promises = [];

        do {
            let endX = x + tileWidth;
            let y = 0;

            do {
                let endY = y + tileHeight;

                if (endX > this.width) {
                    endX = this.width;
                }

                if (endY > this.height) {
                    endY = this.height;
                }

                console.log(`Creating tile at [${x} ${y}] to [${endX} ${endY}] size [${endX - x} ${endY - y}]`);

                this.canvas = document.createElement('canvas');
                this.canvas.width = endX - x;
                this.canvas.height = endY - y;

                // set canvas position on screen
                this.canvas.style.position = 'absolute';
                this.canvas.style.left = `${x + this.sidebarSize}px`;
                this.canvas.style.top = `${y}px`;

                sandboxArea.appendChild(this.canvas);

                const tile = new Tile(tileIndex++, this.canvas, this.sharedFrameTimesBuffer, this.sharedFrameCountBuffer, this.sharedBuffer, x, y, endX, endY, pixelDataSize, this.width, this.height);

                tile.on('errorReload', async () => {
                    await this.reload();
                });

                promises.push(tile.start());

               

                this.tiles.push(tile);
                y = endY;
            } while (y < this.height);
            x = endX;
        } while (x < this.width);


        this.sandboxArea.oncontextmenu = (e) => { e.preventDefault(); };
        this.sandboxArea.onmousemove = this.HandleOnMouseMove.bind(this);
        this.sandboxArea.onmousedown = this.HandleOnMouseDown.bind(this);
        this.sandboxArea.onmouseup = this.HandleOnMouseUp.bind(this);
        this.sandboxArea.onmouseenter = this.HandleOnMouseEnter.bind(this);
        this.sandboxArea.onmouseleave = this.HandleOnMouseLeave.bind(this);

        await Promise.all(promises);

        setInterval(() => {
            this.updateBrush();
        }, 1);

        this.setPauseState(false);
    }

    HandleOnMouseMove(e) {
        const buttons = QuickBits.toBitArr(e.buttons);
        this.leftMousePressed = buttons[0];
        this.rightMousePressed = buttons[1];

        this.mousePrevPos = {
            x: this.mousePos.x,
            y: this.mousePos.y,
        }
        this.mousePos = {
            x: e.clientX - this.sidebarSize,
            y: e.clientY,
        };

        if (this.leftMousePressed || this.rightMousePressed) {
            this.brushStroke(this.mousePos, this.mousePrevPos);
        }
    }

    HandleOnMouseDown(e) {
        const buttons = QuickBits.toBitArr(e.buttons);
        this.leftMousePressed = buttons[0];
        this.rightMousePressed = buttons[1];

        this.brushStroke(this.mousePrevPos, this.mousePos);
    }

    HandleOnMouseUp(e) {
        const buttons = QuickBits.toBitArr(e.buttons);
        this.leftMousePressed = buttons[0];
        this.rightMousePressed = buttons[1];
    }

    HandleOnMouseEnter(e) {
        const buttons = QuickBits.toBitArr(e.buttons);
        this.leftMousePressed = buttons[0];
        this.rightMousePressed = buttons[1];

        // if it is clicked, it should start with a stroke
        if (this.leftMousePressed || this.rightMousePressed) {
            this.mousePos = {
                x: e.clientX - this.sidebarSize,
                y: e.clientY,
            }
            this.brushStroke(this.mousePos, this.mousePos);
        }
    }

    HandleOnMouseLeave(e) {
        // If it was clicked, then it should make a stroke before ending the mouse click
        if (this.leftMousePressed || this.rightMousePressed) {
            this.brushStroke(this.mousePos, {
                x: e.clientX - this.sidebarSize,
                y: e.clientY,
            });
        }

        this.leftMousePressed = false;
        this.rightMousePressed = false;
    }

    updateBrush() {
        if (this.leftMousePressed || this.rightMousePressed) {
            this.brushStroke(this.mousePos, this.mousePrevPos);
        }
        this.mousePrevPos = JSON.parse(JSON.stringify(this.mousePos)); // copy the data without reference
    }

    async save() {
        const image = await this.renderImage();
        const urlImage = URL.createObjectURL(image);

        const link = document.createElement('a');
        link.href = urlImage;
        link.download = `${Random.string(10)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async share(randomName) {
        const image = await this.renderImage();

        // POST to the CDN
        const cdnUrl = 'https://particles-api.lugui.in/';
        const formData = new FormData();
        formData.append('image', image, `${randomName}.png`);

        try {
            const response = await fetch(cdnUrl, {
                method: 'POST',
                body: formData,
            });
        } catch (e) {
            console.error(e);
            return false;
        }

        return true;
    }

    async renderImage() {
        const offscreen = new OffscreenCanvas(this.width, this.height);
        const ctx = offscreen.getContext('2d', { alpha: false });

        let imagedata = ctx.createImageData(this.width, this.height);
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const pixelIndex = this.pixelCoordsToPixelIndex(x, y);

                // Map the index to the actual position without offset
                const imageIndex = (x + y * this.width) * 4;

                let color = Colors[this.grid[pixelIndex]];

                // add a pixel
                imagedata.data[imageIndex] = color[0];
                imagedata.data[imageIndex + 1] = color[1];
                imagedata.data[imageIndex + 2] = color[2];
                imagedata.data[imageIndex + 3] = 255;

            }
        }

        ctx.putImageData(imagedata, 0, 0);
        const imageBlob = await offscreen.convertToBlob();
        const imageArrBuffer = await imageBlob.arrayBuffer();

        const metadata = {
            width: this.width,
            height: this.height,
        }

        const data = new Int16Array(this.grid);
        const compressedData = deflate(data);

        const data8 = new Uint8Array(compressedData.length * 2);
        for (let i = 0; i < compressedData.length; i++) {
            data8[i * 2] = compressedData[i] & 0xff;
            data8[i * 2 + 1] = compressedData[i] >> 8;
        }

        const metadataStr = JSON.stringify(metadata);
        const metadataBuffer = Buffer.from(metadataStr);

        const imageBuffer = Buffer.from(imageArrBuffer);
        const dataBuffer = Buffer.from(data8);

        const footerBuffer = Buffer.from(`lugui-pixels-magic`);

        let length = dataBuffer.length;
        let usedLength = Uint32Array.of(length).byteLength;
        let padding = 4 - usedLength;
        const dataBufferLength = [];
        for (let i = 0; i < 4; i++) {
            if (i < padding) {
                dataBufferLength.push(0x00);
            } else {
                dataBufferLength.push(length >> (i * 8));
            }
        }

        length = metadataStr.length;
        usedLength = Uint32Array.of(length).byteLength;
        padding = 4 - usedLength;
        const metadataBufferLength = [];
        for (let i = 0; i < 4; i++) {
            if (i < padding) {
                metadataBufferLength.push(0x00);
            } else {
                metadataBufferLength.push(length >> (i * 8));
            }
        }

        // create a new buffer with the image, header and the grid data
        const buffer = Buffer.concat([imageBuffer, dataBuffer, metadataBuffer, Buffer.from(dataBufferLength), Buffer.from(metadataBufferLength), footerBuffer]);

        const blob = new Blob([buffer], { type: 'image/png' });
        return blob;
    }

    async loadFromCDN(fileName) {
        this.setPauseState(true);

        // request the file from https://particles-api.lugui.in

        // check if the fileName is a valid name
        // a valid name has 10 characters from a-z, A-Z, 0-9

        const isValidName = fileName.length === 10 && fileName.match(/^[a-zA-Z0-9]+$/);

        if (!isValidName) {
            return;
        }
        try {
            const url = `https://particles-cdn.lugui.in/${fileName}.png`;

            const response = await fetch(url);

            // get th e image as a File
            const imageFile = await response.blob();
            await this.loadFile(imageFile);
        } catch (e) {
            console.log(e);
        }
    }

    async loadFile(file) {
        // get file contents
        const reader = new FileReader();
        const fileContent = await new Promise((resolve, reject) => {
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.onerror = (e) => {
                reject(e);
            };
            reader.readAsArrayBuffer(file);
        });

        const fileContentBuffer = Buffer.from(fileContent);

        const magicBytes = 'lugui-pixels-magic';
        const magicBytesLength = magicBytes.length;

        if (fileContentBuffer.length < magicBytesLength) {
            alert('Invalid save file');
            return null;
        }

        const footer = fileContentBuffer.subarray(fileContentBuffer.length - magicBytesLength);
        if (footer.toString() !== magicBytes) {
            alert('Invalid save file');
            return null;
        }

        const sizeMetadata = fileContentBuffer.readUInt32LE(fileContentBuffer.length - magicBytesLength - 4);
        const sizeData = fileContentBuffer.readUInt32LE(fileContentBuffer.length - magicBytesLength - 8);

        // check the size
        if (fileContentBuffer.length < magicBytesLength + sizeMetadata + sizeData + 4) {
            alert('Invalid save file');
            return null;
        }

        const metadataBuffer = fileContentBuffer.subarray(fileContentBuffer.length - magicBytesLength - 8 - sizeMetadata, fileContentBuffer.length - magicBytesLength - 8);
        const metadataStr = metadataBuffer.toString();
        const metadata = JSON.parse(metadataStr);

        const dataBuffer = fileContentBuffer.subarray(fileContentBuffer.length - magicBytesLength - 8 - sizeMetadata - sizeData, fileContentBuffer.length - magicBytesLength - 8 - sizeMetadata);
        const data = new Int16Array(dataBuffer.length / 2);
        for (let i = 0; i < data.length; i++) {
            data[i] = dataBuffer[i * 2] | (dataBuffer[i * 2 + 1] << 8);
        }

        const decompressedData = inflate(data);
        this.loadPixelData(decompressedData, metadata);
    }


    loadPixelData(data, metadata) {
        const maxWidth = Math.min(this.width, metadata.width);
        const maxHeight = Math.min(this.height, metadata.height);

        this.clear();

        // fills the entire grid with Block
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const index = this.pixelCoordsToPixelIndex(x, y);
                for (let i = 0; i < pixelDataSize; i++) {
                    this.grid[index + i] = InitialState[Particles.Block][i];
                }
            }
        }

        for (let x = 0; x < maxWidth; x++) {
            for (let y = 0; y < maxHeight; y++) {
                const index = this.pixelCoordsToPixelIndex(x, y);
                const dataIndex = (x + y * metadata.width) * pixelDataSize;

                for (let i = 0; i < pixelDataSize; i++) {
                    this.grid[index + i] = data[dataIndex + i];
                }

            }
        }
    }

    async reload() {
        const [data, metadata] = this.end();
        await this.start();
        await this.loadPixelData(data, metadata);
    }

    end() {
        const data = new Int16Array(this.grid);
        const metadata = {
            width: this.width,
            height: this.height,
        }
        this.tiles.forEach((tile) => {
            tile.terminate();
        });
        return [data, metadata];
    }

    /* Brush */
    brushStroke(startPos, endPos) {
        if (startPos.x === endPos.x && startPos.y === endPos.y) {
            this.paintPixels(this.getPixelsInRadius(endPos, this.brushSize));
            return;
        }
        let pixelLine = this.traceLine(startPos, endPos);
        if (this.brushSize <= 0) {
            this.paintPixels(pixelLine);
            return;
        }

        for (const pixel of pixelLine) {
            this.paintPixels(this.getPixelsInRadius(pixel, this.brushSize));
        }
    }

    paintPixels(effectedPixels) {
        // get the element based on the current pressed button
        const brush0ElementState = InitialState[this.brush0];
        const brush1ElementState = InitialState[this.brush1];

        for (const pixel of effectedPixels) {

            // check if the pixel is out of bounds
            if (pixel.x < 0 || pixel.x >= this.width || pixel.y < 0 || pixel.y >= this.height) {
                continue;
            }
            const index = this.pixelCoordsToPixelIndex(pixel.x, pixel.y);
            let elState;

            if (this.rightMousePressed) {
                elState = brush1ElementState;
            }

            if (this.leftMousePressed) {
                elState = brush0ElementState;
            }

            if (
                this.grid[index] !== Particles.Air &&
                elState[0] !== Particles.Air &&
                elState[0] !== Particles.Void
            ) {
                continue;
            }

            for (let i = 0; i < pixelDataSize; i++) {
                this.grid[index + i] = elState[i];
            }
        }
    }

    traceLine(startPos, endPos) {
        // get all the points betwen the start and end points
        const points = [];
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        const xInc = dx / steps;
        const yInc = dy / steps;
        let x = startPos.x;
        let y = startPos.y;

        for (let i = 0; i < steps; i++) {

            points.push({
                x: Math.floor(x),
                y: Math.floor(y),
            });
            x += xInc;
            y += yInc;


        }
        return points;
    }

    getPixelsInRadius(pixel, radius) {
        // get coordinates of pixels in a circle around the pixel
        const pixels = [];

        // loop a square the size of the radius
        for (let x = pixel.x - radius; x <= pixel.x + radius; x++) {
            for (let y = pixel.y - radius; y <= pixel.y + radius; y++) {
                // if the pixel is within the radius
                if (Math.sqrt(Math.pow(x - pixel.x, 2) + Math.pow(y - pixel.y, 2)) <= radius) {
                    pixels.push({
                        x,
                        y,
                    });
                }
            }
        }
        return pixels;
    }

    getPixelsInSquare(pixel, radius) {
        // get coordinates of pixels in a square around the pixel
        const pixels = [];

        // loop a square the size of the radius
        for (let x = pixel.x - radius; x <= pixel.x + radius; x++) {
            for (let y = pixel.y - radius; y <= pixel.y + radius; y++) {
                pixels.push({
                    x,
                    y,
                });
            }
        }
        return pixels;
    }

    setBrushParticle(brushId, particleId) {
        switch (brushId) {
            case 0: this.brush0 = particleId; break;
            case 1: this.brush1 = particleId; break;
        }
    }

    getBrushParticleId(brushId) {
        return brushId == 0 ? this.brush0 : this.brush1;
    }

    getBrushParticleName(brushId) {
        return brushId == 0 ? Names[this.brush0] : Names[this.brush1];
    }

    getBrushSize() {
        return this.brushSize;
    }

    setBrushSize(size) {
        this.brushSize = size > 15 ? 15 : size;
        this.brushSize = this.brushSize < 0 ? 0 : this.brushSize;
    }

    pixelCoordsToPixelIndex(x, y) {
        // convert pixel coordinates to grid index
        return (x + y * this.width) * pixelDataSize;
    }

    pixelCoordsToTileIndex(x, y) {
        return this.tiles.findIndex(tile => {
            return tile.startX <= x && tile.endX >= x && tile.startY <= y && tile.endY >= y;
        });
    }

    getFPS() {
        // get the min value of tileFrameTimes
        const min = Math.min(...this.tileFrameTimes);
        const roundValue = Math.floor(1000 / min);
        if(isNaN(roundValue)){
            return 0;
        }
        return roundValue;
    }

    getPauseState() {
        return this.pauseState;
    }

    togglePauseState() {
        this.setPauseState(!this.pauseState);
    }

    setPauseState(state) {
        this.pauseState = state;
        for(const tile of this.tiles){
            tile.setPause(this.pauseState);
        }
    }

    clear() {
        for (let i = 0; i < this.grid.length; i += pixelDataSize) {
            this.grid[i] = InitialState[Particles.Air][0];
            this.grid[i + 1] = InitialState[Particles.Air][1];
            this.grid[i + 2] = InitialState[Particles.Air][2];
            this.grid[i + 3] = InitialState[Particles.Air][3];
        }
    }

    terminate() {
        for (const tile of this.tiles) {
            tile.terminate();
        }
    }

    getParticleIdUnderMouse() {
        const index = this.pixelCoordsToPixelIndex(this.mousePos.x, this.mousePos.y);
        if (index < 0 || index >= this.grid.length || this.grid[index] === undefined) {
            return Particles.Air;
        }
        return this.grid[index];
    }

    getCursosPos() {
        return this.mousePos;
    }
}

module.exports = Sandbox;