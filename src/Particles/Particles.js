class Particles {
    static Void = 0;
    static Sand = 1;
    static Stone = 2;
    static Water = 3;
    static Metal = 4;
    static Rust = 5;


    static getId(name) {
        return Particles[name];
    }

    static isLiquid(id) {
        return [
            Particles.Water,
        ].includes(id);
    }

    static isHidden(id) {
        return [
            Particles.Rust
        ].includes(id);
    }
}

const Names = []
Names[Particles.Void] = 'Void';
Names[Particles.Sand] = 'Sand';
Names[Particles.Stone] = 'Stone';
Names[Particles.Water] = 'Water';
Names[Particles.Metal] = 'Metal';
Names[Particles.Rust] = 'Rust';


const Colors = [];
Colors[Particles.Void] = [0, 0, 0];
Colors[Particles.Sand] = [242, 189, 107];
Colors[Particles.Stone] = [128, 128, 128];
Colors[Particles.Water] = [64, 64, 255];
Colors[Particles.Metal] = [64, 64, 64];
Colors[Particles.Rust] = [255, 64, 64];


const Density = [];
Density[Particles.Void] = 0;
Density[Particles.Sand] = 0.5;
Density[Particles.Stone] = 0.9;
Density[Particles.Water] = 0.3;
Density[Particles.Rust] = Density[Particles.Sand];

module.exports = {
    Particles,
    Names,
    Colors,
    Density,
}
