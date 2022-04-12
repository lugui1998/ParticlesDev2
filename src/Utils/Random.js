class Random {

    static int(min, max) {
        return Math.random() * (max - min) + min;
    }

    static getRandomRGB() {
        return [Random.int(0, 255), Random.int(0, 255), Random.int(0, 255)];
    }

}

module.exports = Random;