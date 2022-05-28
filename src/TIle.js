
class Tile {

    events = {};

    inUpdate = false;
    worker = null;
    tileIndex = -1;
    canvas = null;
    sharedBuffer = null;
    startX = 0;
    startY = 0;
    endX = 0;
    endY = 0;
    pixelDataSize = 0;
    width = 0;
    height = 0;

    constructor(tileIndex, canvas, sharedBuffer, startX, startY, endX, endY, pixelDataSize, width, height) {

        this.events = {
            ready: []
        };

        this.tileIndex = tileIndex;
        this.canvas = canvas;
        this.sharedBuffer = sharedBuffer;
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.pixelDataSize = pixelDataSize;
        this.width = width;
        this.height = height;
    }

    async start() {
        const offscreenCanvas = this.canvas.transferControlToOffscreen();

        this.worker = new Worker('pixelWorker.js');
        this.worker.postMessage({
            type: 'init',
            data: {
                canvas: offscreenCanvas,
                sharedBuffer: this.sharedBuffer,
                startX: this.startX,
                startY: this.startY,
                endX: this.endX,
                endY: this.endY,
                pixelDataSize: this.pixelDataSize,
                screenWidth: this.width,
                screenHeight: this.height
            }
        }, [offscreenCanvas]);

        this.worker.onmessage = this.handleWorkerMessage.bind(this);

        // create a promise that resolves when the worker is ready
        await new Promise((resolve, reject) => {
            this.on('ready', resolve);
        });

    }

    update() {
        if (this.inUpdate) return;
        this.inUpdate = true;
        this.worker.postMessage({
            type: 'doPhysics',
        });
    }

    handleWorkerMessage(e) {
        const { type, data } = e.data;
        switch (type) {
            case 'debug': { console.log(data); break; }
            case 'error': { alert(data); break; }
            case 'donePhysics': { this.inUpdate = false; break; }
            case 'initDone': { this.emit('ready', null); break; }
        }

    }

    terminate() {
        this.worker.terminate();
    }

    on(event, callback) {
        this.events[event].push(callback);
    }

    emit(event, ...args) {
        for (const callback of this.events[event]) {
            callback(...args);
        }
    }

}

module.exports = Tile;