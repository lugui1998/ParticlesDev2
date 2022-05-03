
class Tile {
    inUpdate = false;
    worker = null;
    tileIndex = -1;
    startX = 0;
    startY = 0;
    endX = 0;
    endY = 0;

    constructor(tileIndex, canvas, sharedBuffer, startX, startY, endX, endY, pixelDataSize, width, height) {
        const offscreenCanvas = canvas.transferControlToOffscreen();

        this.tileIndex = tileIndex;

        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;

        this.worker = new Worker('pixelWorker.js');
        this.worker.postMessage({
            type: 'init',
            data: {
                canvas: offscreenCanvas,
                sharedBuffer: sharedBuffer,
                startX: startX,
                startY: startY,
                endX: endX,
                endY: endY,
                pixelDataSize: pixelDataSize,
                screenWidth: width,
                screenHeight: height
            }
        }, [offscreenCanvas]);

        this.worker.onmessage = this.handleWorkerMessage.bind(this);

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
            case 'donePhysics': { this.inUpdate = false; break; }
        }

    }

    updatePixels(pixelArr) {
        this.worker.postMessage({
            type: 'updatePixels',
            data: pixelArr
        });
    }

}

module.exports = Tile;