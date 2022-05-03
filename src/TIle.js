
class Tile {
    inUpdate = false;
    worker = null;
    constructor(canvas, sharedBuffer, startX, startY, endX, endY, pixelDataSize, width, height) {
        const offscreenCanvas = canvas.transferControlToOffscreen();

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

}

module.exports = Tile;