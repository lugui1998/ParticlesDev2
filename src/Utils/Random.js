class Random {

    static int(min, max) {
        // return random integer
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getRandomRGB() {
        return [Random.int(0, 255), Random.int(0, 255), Random.int(0, 255)];
    }

    static direction() {
        return Math.random() > 0.5 ? 1 : -1;
    }

    static float (min, max) {
        return Math.random() * (max - min) + min;
    }

    static number() {
        // just a wrapper for Math.random()
        return Math.random();
    }

}

module.exports = Random;