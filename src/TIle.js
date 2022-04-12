const { Names } = require("./Particles/Particles");

class Tile {
    listeners = [];

    widthStart = 0;
    heightStart = 0;

    widthOffset = 0;
    heightOffset = 0;

    canvas
    index = 0;

    worker = null;


    mousePrevPos = {};
    mousePos = {};
    mousePressed = false;

    brushParticle = Names.Sand;
    brushSize = 5;

    constructor(width, height, widthOffset, heightOffset, canvas, index) {
        this.widthStart = width;
        this.heightStart = height;
        this.widthOffset = widthOffset;
        this.heightOffset = heightOffset;
        this.canvas = canvas;
        this.index = index;

        const offscreenCanvas = canvas.transferControlToOffscreen();

        this.worker = new Worker('pixelWorker.js');
        this.worker.postMessage({
            type: 'init',
            data: {
                width: this.widthOffset,
                height: this.heightOffset,
                canvas: offscreenCanvas,
            }
        }, [offscreenCanvas]);

        this.worker.onmessage = (e) => {
            console.log(e.data);
        }

        this.canvas.onmousemove = this.onMouseMove.bind(this);
        this.canvas.onmousedown = this.onMouseDown.bind(this);
        this.canvas.onmouseup = this.onMouseUp.bind(this);
        this.canvas.onmouseenter = this.onMouseEnter.bind(this);
        this.canvas.onmouseleave = this.onMouseLeave.bind(this);

    }

    selectBrushParticle() {

    }

    onMouseMove(e) {
        this.mousePrevPos = JSON.parse(JSON.stringify(this.mousePos)); // copy the data without reference
        this.mousePos = {
            x: e.offsetX,
            y: e.offsetY,
        };
        if (this.mousePressed) {
            this.brushStroke(this.mousePrevPos, this.mousePos);
        }
    }

    onMouseDown(e) {
        this.mousePressed = true;
        this.brushStroke(this.mousePrevPos, this.mousePos);
    }

    onMouseUp(e) {
        this.mousePressed = false;
    }

    onMouseEnter(e) {
        this.mousePressed = e.buttons > 0 ? true : false;

        // if it is clicked, it should start with a stroke
        if (this.mousePressed) {
            this.mousePos = {
                x: e.offsetX,
                y: e.offsetY,
            }
            this.brushStroke(this.mousePos, this.mousePos);
        }
    }

    onMouseLeave(e) {
        // When the mouse leaves the canvas, the mouse is no longer on the canvas
        // If it was clicked, then it should make a stroke before ending the mouse click
        if (this.mousePressed) {
            this.brushStroke(this.mousePos, {
                x: e.offsetX,
                y: e.offsetY,
            });
        }

        this.mousePressed = false;
    }

    /* Brush */
    brushStroke(startPos, endPos) {
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
        const pixels = [];
        const outOfBounds = [];
        for (const pixel of effectedPixels) {
            const pix = {
                x: pixel.x,
                y: pixel.y,
            }

            // check if the pixel is out of bounds
            if (pixel.x < 0 || pixel.x >= this.widthOffset || pixel.y < 0 || pixel.y >= this.heightOffset) {
                outOfBounds.push(pix);
                continue;
            }

            pixels.push(pix);
        }
        this.worker.postMessage({
            type: 'paint',
            data: {
                pixels,
                particleName: this.brushParticle,
            },
        });

        // if there are pixels out of bounds, emit an event with the pixels
        if (outOfBounds.length > 0) {
            this.emit('paintingOutOfBounds', {
                tileIndex: this.index,
                pixels: outOfBounds
            });
        }
    }

    traceLine(startPos, endPos) {
        // generate a list of points along the line
        const points = [];
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        const xInc = Math.round(dx / steps);
        const yInc = Math.round(dy / steps);
        let x = startPos.x;
        let y = startPos.y;
        for (let i = 0; i < steps; i++) {
            points.push({
                x,
                y,
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


    contains(x, y) {
        return x >= this.widthStart && x < this.widthStart + this.widthOffset &&
            y >= this.heightStart && y < this.heightStart + this.heightOffset;
    }

    /* Event Handlers */

    on(eventName, fn) {
        this.listeners[eventName] = this.listeners[eventName] || [];
        this.listeners[eventName].push(fn);
        return this;
    }

    removeListener(eventName, fn) {
        let lis = this.listeners[eventName];
        if (!lis) return this;
        for (let i = lis.length; i > 0; i--) {
            if (lis[i] === fn) {
                lis.splice(i, 1);
                break;
            }
        }
        return this;
    }

    emit(eventName, ...args) {
        let fns = this.listeners[eventName];
        if (!fns) return false;
        fns.forEach((f) => {
            f(...args);
        });
        return true;
    }

}

module.exports = Tile;