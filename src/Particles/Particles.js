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
    static Steam = 9;


    static getId(name) {
        return Particles[name];
    }

    static isFluid(id) {
        return [
            Particles.Water,
            Particles.Lava,
            Particles.Steam,
        ].includes(id);
    }

    static isHidden(id) {
        return [
            Particles.Rust,
            Particles.Steam,
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
Names[Particles.Steam] = 'Steam';


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
Colors[Particles.Steam] = [204, 204, 204];


const Density = [];
Density[Particles.Air] = 0.05;
Density[Particles.Dust] = 0.4;
Density[Particles.Stone] = 0.8;
Density[Particles.Water] = 0.1;
Density[Particles.Rust] = Density[Particles.Dust];
Density[Particles.Lava] = 0.6;
Density[Particles.Fire] = 0;
Density[Particles.Steam] = 0.07;

const InitialState = [];
InitialState[Particles.Air] = [Particles.Air, 0, 0, 0];
InitialState[Particles.Dust] = [Particles.Dust, 0, 0, 0];
InitialState[Particles.Stone] = [Particles.Stone, 0, 0, 0];
InitialState[Particles.Water] = [Particles.Water, 0, 30, 0];
InitialState[Particles.Metal] = [Particles.Metal, 0, 0, 0];
InitialState[Particles.Rust] = [Particles.Rust, 0, 0, 0];
InitialState[Particles.Lava] = [Particles.Lava, 0, 0, 0];
InitialState[Particles.Void] = [Particles.Void, 0, 0, 0];
InitialState[Particles.Fire] = [Particles.Fire, 0, 0, 0];
InitialState[Particles.Steam] = [Particles.Steam, 0, 90, 0];


module.exports = {
    Particles,
    Names,
    Colors,
    Density,
    InitialState,
}
