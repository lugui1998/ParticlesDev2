const { Void } = require("./Particles/Particles");

class ParticleGrid {
    width = 0;
    height = 0;
    globalOffsetX = 0;
    globalOffsetY = 0;

    grid = [];

    constructor(width, height, globalOffsetX, globalOffsetY) {
        this.width = width;
        this.height = height;
        this.globalOffsetX = globalOffsetX;
        this.globalOffsetY = globalOffsetY;

        // start grid
        for (let i = 0; i < width; i++) {
            this.grid[i] = [];
            for (let j = 0; j < height; j++) {
                this.grid[i][j] = new Void();
            }
        }
    }

    overide(x, y, particle) {
        this.grid[x][y] = particle;
    }

    erase(x, y) {
        this.grid[x][y] = new Void();
    }

    get(x, y) {
        return this.grid[x][y];
    }

    existHere(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    exist(x, y) {
        return x >= 0 && x < this.globalOffsetX && y >= 0 && y < this.globalOffsetY;
    }

    isEmpty(x, y) {
        return this.grid[x][y].getName() === "Void";
    }
}

module.exports = ParticleGrid;