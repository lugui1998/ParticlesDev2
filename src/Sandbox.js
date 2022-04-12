
const Tile = require('./Tile');

class Sandbox {

    width = 0;
    height = 0;
    tileGridSize = 0;

    tiles = [];

    constructor(
        sandboxArea,
        tileGridSize = [4, 2],
    ) {
        this.width = sandboxArea.offsetWidth;
        this.height = sandboxArea.offsetHeight;
        this.tileGridSize = tileGridSize;

        const tileWidth = Math.ceil(this.width / this.tileGridSize[0]);
        const tileHeight = Math.ceil(this.height / this.tileGridSize[1]);
    
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

                const canvas = document.createElement('canvas');
                canvas.width = endX - x;
                canvas.height = endY - y;

                // set canvas position on screen
                canvas.style.position = 'absolute';
                canvas.style.left = `${x}px`;
                canvas.style.top = `${y}px`;

                sandboxArea.appendChild(canvas);

                this.tiles.push(new Tile(x, y, tileWidth, tileHeight, canvas, this.tiles.length, this.width, this.height));

                y = endY;
            } while (y < this.height);
            x = endX;
        } while (x < this.width);


        // Add nevent listeners to each tile
        this.tiles.forEach(tile => {
            tile.on('paintingOutOfBounds', (data) => {
                this.handlePaintingOutOfBounds(data);
            });
        });

        this.tiles.forEach(tile => {
            tile.on('export', (data) => {
                this.dispatchParticles(data);
            });
        });

        this.tiles.forEach(tile => {
            tile.on('imported', (data) => {
                this.handleImportedPixel(data);
            });
        });
    }

    update () {
        this.tiles.forEach(tile => {
            tile.update();
        });
    }

    handleImportedPixel(data) {
        const tile = this.tiles[data.originalTile];
        tile.removePixel(data.originalPixel);
    }
    
    dispatchParticles(data) {
        const sourceTile = this.tiles[data.tileIndex];
        const sourceWidthStart = sourceTile.widthStart;
        const sourceHeightStart = sourceTile.heightStart;
        
        const globalPixel = {
            x: data.target.x + sourceWidthStart,
            y: data.target.y + sourceHeightStart,
        }

        const targetTileIndex = this.getTileAt(globalPixel.x, globalPixel.y);
        const targetTile = this.tiles[targetTileIndex];

        const pix = this.globalToLocalCoordinates(globalPixel, targetTile.widthStart, targetTile.heightStart);

        targetTile.tryImport(targetTileIndex, data.coords, pix, data.particle);
    }

    handlePaintingOutOfBounds(data) {
        const sourceTile = this.tiles[data.tileIndex];
        const sourceWidthStart = sourceTile.widthStart;
        const sourceHeightStart = sourceTile.heightStart;

        const tilePackets = [];
        for (const pixel of data.pixels) {
            const globalPixel = {
                x: pixel.x + sourceWidthStart,
                y: pixel.y + sourceHeightStart,
            }

            // check if it is outside of the canvas
            if (globalPixel.x < 0 || globalPixel.x >= this.width || globalPixel.y < 0 || globalPixel.y >= this.height) {
                continue;
            }

            const tileIndex = this.getTileAt(globalPixel.x, globalPixel.y);

            if (!tilePackets[tileIndex]) {
                tilePackets[tileIndex] = [];
            }

            const targetTile = this.tiles[tileIndex];

            const pix = this.globalToLocalCoordinates(globalPixel, targetTile.widthStart, targetTile.heightStart);
            tilePackets[tileIndex].push(pix);
        }

        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            const pixels = tilePackets[i];

            if (pixels) {
                tile.paintPixels(pixels);
            }
        }
    }

    globalToLocalCoordinates(pixel, sourceWidthStart, sourceHeightStart) {
        pixel.x -= sourceWidthStart;
        pixel.y -= sourceHeightStart;
        return pixel;
    }

    getTileAt(x, y) {
        for (const tile of this.tiles) {
            if (tile.contains(x, y)) {
                return tile.index;
            }
        }
    }

}

module.exports = Sandbox;