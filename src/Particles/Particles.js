class Particles {
    static Air = 0;
    static Dust = 1;
    static Stone = 2;
    static Water = 3;
    static Metal = 4;
    static Rust = 5;
    static Lava = 6;
    static Void = 7;
    static Fire = 8;


    static getId(name) {
        return Particles[name];
    }

    static isLiquid(id) {
        return [
            Particles.Water,
            Particles.Lava,
        ].includes(id);
    }

    static isHidden(id) {
        return [
            Particles.Rust
        ].includes(id);
    }
}

const Names = []
Names[Particles.Air] = 'Air';
Names[Particles.Dust] = 'Dust';
Names[Particles.Stone] = 'Stone';
Names[Particles.Water] = 'Water';
Names[Particles.Metal] = 'Metal';
Names[Particles.Rust] = 'Rust';
Names[Particles.Lava] = 'Lava';
Names[Particles.Void] = 'Void';
Names[Particles.Fire] = 'Fire';


const Colors = [];
Colors[Particles.Air] = [20, 20, 20];
Colors[Particles.Dust] = [242, 189, 107];
Colors[Particles.Stone] = [128, 128, 128];
Colors[Particles.Water] = [64, 64, 255];
Colors[Particles.Metal] = [64, 64, 64];
Colors[Particles.Rust] = [121, 79, 58];
Colors[Particles.Lava] = [255, 102, 51];
Colors[Particles.Void] = [0, 0, 0];
Colors[Particles.Fire] = [255, 50, 50];


const Density = [];
Density[Particles.Air] = 0;
Density[Particles.Dust] = 0.4;
Density[Particles.Stone] = 1.5;
Density[Particles.Water] = 0.3;
Density[Particles.Rust] = Density[Particles.Dust];
Density[Particles.Lava] = 0.8;

module.exports = {
    Particles,
    Names,
    Colors,
    Density,
}
