
class Tile {

    events = {
        ready: [],
        errorReload: [],
    }

    inUpdate = false;
    worker = null;
    tileIndex = -1;
    canvas = null;
    sharedBuffer = null;
    sharedFrameCountBuffer = null;
    sharedFrameTimesBuffer = null;
    startX = 0;
    startY = 0;
    endX = 0;
    endY = 0;
    pixelDataSize = 0;
    width = 0;
    height = 0;

    constructor(tileIndex, canvas, sharedFrameTimesBuffer, sharedFrameCountBuffer, sharedBuffer, startX, startY, endX, endY, pixelDataSize, width, height) {
        this.tileIndex = tileIndex;
        this.canvas = canvas;
        this.sharedBuffer = sharedBuffer;
        this.sharedFrameCountBuffer = sharedFrameCountBuffer;
        this.sharedFrameTimesBuffer = sharedFrameTimesBuffer;
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
                tileIndex: this.tileIndex,
                sharedFrameCountBuffer: this.sharedFrameCountBuffer,
                sharedFrameTimesBuffer: this.sharedFrameTimesBuffer,
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

    handleWorkerMessage(e) {
        const { type, data } = e.data;
        switch (type) {
            case 'debug': { console.log(data); break; }
            case 'error': { alert(data); this.emit('errorReload', null); break; }
            case 'donePhysics': { this.doneFrame(data); break; }
            case 'initDone': { this.emit('ready', null); break; }
        }

    }

    terminate() {
        this.canvas.remove();
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