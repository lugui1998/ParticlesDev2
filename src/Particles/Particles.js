class Names {
    static Void = 'Void';
    static Sand = 'Sand';
}

class Colors {
    static Void = [0, 0, 0];
    static Sand = [242, 189, 107];
}

class ParticleUtils {
    static createByName(name) {
        switch (name) {
            case Names.Void: return new Void();
            case Names.Sand: return new Sand();
        }
    }
}

class Particle {

}

/* Particles */
class Void extends Particle{

    getName() {
        return Names.Void;
    }

    getColor() {
        
        return Colors.Void;
    }

    process(grid, selfX, selfY) {
        return null;
    }
    

}

/* Particles */
class Sand extends Particle{

    getName() {
        return Names.Sand;
    }

    getColor() {
        
        return Colors.Sand;
    }

    process(grid, selfX, selfY) {
        let targetY = selfY + 1;

        if(grid.exist(selfX, targetY)){
            if(grid.existHere(selfX, targetY) && grid.isEmpty(selfX, targetY)) {
                // Particle can move inside the tile
                return {
                    export: false,
                    target: {
                        x: selfX,
                        y: targetY,
                    }
    
                }
            }
            // particle may move but only if exported succesfully
            return {
                export: true,
                target: {
                    x: selfX,
                    y: targetY,
                }
            }
        }

        

        return null;
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
