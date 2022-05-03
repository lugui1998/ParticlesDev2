const Tile = require('./Tile');

const { Particles, Colors, } = require('./Particles/Particles');

const pixelDataSize = 4;

class Sandbox {

    width = 0;
    height = 0;
    tileGridSize = 0;

    physicsStartTime = 0;
    lastFramesTimes = [];

    sharedBuffer = null;
    tiles = [];

    mousePrevPos = {};
    mousePos = { x: 0, y: 0 };
    mousePressed = false;

    sandboxArea = null;

    grid = null;

    brushParticle = Particles.Sand;
    brushSize = 1;

    canvas;

    pauseState = false;

    constructor(
        sandboxArea,
        tileGridSize = [4, 2],
    ) {
        this.width = sandboxArea.offsetWidth;
        this.height = sandboxArea.offsetHeight;
        this.tileGridSize = tileGridSize;
        this.sandboxArea = sandboxArea;

        // allocate a sahred buffer
        this.sharedBuffer = new SharedArrayBuffer(this.width * this.height * 2 * pixelDataSize);
        this.grid = new Int16Array(this.sharedBuffer);

        const tileWidth = Math.ceil(this.width / this.tileGridSize[0]);
        const tileHeight = Math.ceil(this.height / this.tileGridSize[1]);
        let tileIndex = 0;
        let x = 0;
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
                this.canvas.style.left = `${x}px`;
                this.canvas.style.top = `${y}px`;

                sandboxArea.appendChild(this.canvas);

                this.tiles.push(new Tile(tileIndex++, this.canvas, this.sharedBuffer, x, y, endX, endY, pixelDataSize, this.width, this.height));

                y = endY;
            } while (y < this.height);
            x = endX;
        } while (x < this.width);


        this.sandboxArea.onmousemove = this.HandleOnMouseMove.bind(this);
        this.sandboxArea.onmousedown = this.HandleOnMouseDown.bind(this);
        this.sandboxArea.onmouseup = this.HandleOnMouseUp.bind(this);
        this.sandboxArea.onmouseenter = this.HandleOnMouseEnter.bind(this);
        this.sandboxArea.onmouseleave = this.HandleOnMouseLeave.bind(this);
    }

    HandleOnMouseMove(e) {
        this.mousePrevPos = JSON.parse(JSON.stringify(this.mousePos)); // copy the data without reference
        this.mousePos = {
            x: e.clientX,
            y: e.clientY,
        };
        if (this.mousePressed) {
            this.brushStroke(this.mousePrevPos, this.mousePos);
        }
    }

    HandleOnMouseDown(e) {
        this.mousePressed = true;
        this.brushStroke(this.mousePrevPos, this.mousePos);
    }

    HandleOnMouseUp(e) {
        this.mousePressed = false;
    }

    HandleOnMouseEnter(e) {
        this.mousePressed = e.buttons > 0 ? true : false;

        // if it is clicked, it should start with a stroke
        if (this.mousePressed) {
            this.mousePos = {
                x: e.clientX,
                y: e.clientY,
            }
            this.brushStroke(this.mousePos, this.mousePos);
        }
    }

    HandleOnMouseLeave(e) {
        // If it was clicked, then it should make a stroke before ending the mouse click
        if (this.mousePressed) {
            this.brushStroke(this.mousePos, {
                x: e.clientX,
                y: e.clientY,
            });
        }

        this.mousePressed = false;
    }

    update() {
        if (this.mousePressed) {
            this.brushStroke(this.mousePrevPos, this.mousePos);
        }
        this.mousePrevPos = JSON.parse(JSON.stringify(this.mousePos)); // copy the data without reference

        let inUpdate = false;
        for (const tile of this.tiles) {
            inUpdate |= tile.inUpdate;
        }

        if (!inUpdate && !this.pauseState) {
            const timeNow = performance.now();
            const lastFrameTime = timeNow - this.physicsStartTime;
            this.lastFramesTimes.push(lastFrameTime);

            if(this.lastFramesTimes.length > 10) {
                this.lastFramesTimes.shift();
            }

            this.physicsStartTime = timeNow;
            for (const tile of this.tiles) {
                tile.update();
            }
        }
    }

    /* Brush */
    brushStroke(startPos, endPos) {
        if (startPos.x === endPos.x && startPos.y === endPos.y) {
            this.paintPixels(this.getPixelsInRadius(endPos, this.brushSize));
            return;
        }

        const pixelLine = this.traceLine(startPos, endPos);
        if (this.brushSize <= 0) {
            this.paintPixels(pixelLine);
        }

        const effectedPixels = new Set();
        for (const pixel of pixelLine) {
            const pixelsInRadius = this.getPixelsInRadius(pixel, this.brushSize);
            for (const pixelInRadius of pixelsInRadius) {
                effectedPixels.add(pixelInRadius);
            }
        }
        this.paintPixels(effectedPixels);
    }

    paintPixels(effectedPixels) {
        const pixelChunks = [];
        for (const pixel of effectedPixels) {
            // check if the pixel is out of bounds
            if (pixel.x < 0 || pixel.x >= this.width || pixel.y < 0 || pixel.y >= this.height) {
                continue;
            }

            const index = this.pixelCoordsToPixelIndex(pixel.x, pixel.y);
            this.grid[index] = this.brushParticle;

            // find the chunk that the pixel belongs to
            const tileIndex = this.pixelCoordsToTileIndex(pixel.x, pixel.y);
            pixelChunks[tileIndex] = pixelChunks[tileIndex] || [];
            pixelChunks[tileIndex].push([pixel.x, pixel.y]);
        }
        
        for (const tile of this.tiles) {
            if (pixelChunks[tile.tileIndex] !== undefined) {
                tile.updatePixels(pixelChunks[tile.tileIndex]);
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

    selectBrushParticle() {

    }

    getBrushSize(){
        return this.brushSize;
    }

    setBrushSize(size){
        this.brushSize = size > 10 ? 10 : size;
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

    getPhysicsFPS() {
        // calculate the FPS based on the average of the time in the lastFramesTimes array
        let sum = 0;
        for (const time of this.lastFramesTimes) {
            sum += time;
        }
        return 1000 / (sum / this.lastFramesTimes.length);

    }

    getPauseState() {
        return this.pauseState;
    }

    togglePauseState() {
        this.pauseState = !this.pauseState;
    }

    clear(){
        for(let i = 0; i < this.grid.length; i++){
            this.grid[i] = 0;
        }
    }

    terminate() {
        for(const tile of this.tiles){
            tile.terminate();
        }
    }

}

module.exports = Sandbox;