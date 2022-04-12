class Names {
    static Void = 'Void';
    static Sand = 'Sand';
}

class Colors {
    static Void = [0, 0, 0];
    static Sand = [255, 255, 255];
}

class ParticleUtils {
    static createByName(name) {
        switch (name) {
            case Names.Void: return new Void();
            case Names.Sand: return new Sand();
        }
    }
}


/* Particles */
class Void {

    GetName() {
        return Names.Void;
    }

    GetColor() {
        
        return Colors.Void;
    }

}

/* Particles */
class Sand {

    GetName() {
        return Names.Sand;
    }

    GetColor() {
        
        return Colors.Sand;
    }

}








module.exports = {
    ParticleUtils,
    Names,
    Colors,
    
    // Particles
    Void,
    Sand,
}
