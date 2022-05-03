class Random {

    static int(min, max) {
        // return random integer
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getRandomRGB() {
        return [Random.int(0, 255), Random.int(0, 255), Random.int(0, 255)];
    }

}

module.exports = Random;