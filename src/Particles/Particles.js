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
    static Steel = 10;
    static Acid = 11;
    static AcidVapor = 12;
    static Clone = 13;


    static getId(name) {
        return Particles[name];
    }

    static isFluid(id) {
        return [
            Particles.Water,
            Particles.Lava,
            Particles.Steam,
            Particles.Acid,
            Particles.AcidVapor,
        ].includes(id);
    }

    static isHidden(id) {
        return [
            Particles.Rust,
            Particles.Steam,
            Particles.AcidVapor
        ].includes(id);
    }

    static isStatic(id) {
        return [
            Particles.Air,
            Particles.Metal,
            Particles.Steel,
            Particles.Void,
            Particles.Clone,

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
Names[Particles.Steel] = 'Steel';
Names[Particles.Acid] = 'Acid';
Names[Particles.AcidVapor] = 'Acid-Vapor';
Names[Particles.Clone] = 'Clone';



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
Colors[Particles.Steel] = [169, 173, 174];
Colors[Particles.Acid] = [204, 255, 0];
Colors[Particles.AcidVapor] = [120, 120, 0];
Colors[Particles.Clone] = [144, 112, 16];

const Density = [];
Density[Particles.Air] = 0.002;
Density[Particles.Dust] = 1.5;
Density[Particles.Stone] = 3.0;
Density[Particles.Water] = 1;
Density[Particles.Metal] = 4;
Density[Particles.Rust] = Density[Particles.Dust];
Density[Particles.Lava] = 2.5;
Density[Particles.Void] = 9999999;
Density[Particles.Fire] = 0;
Density[Particles.Steam] = 0.1;
Density[Particles.Steel] = Density[Particles.Metal] * 8;
Density[Particles.Acid] = 1.1;
Density[Particles.AcidVapor] = Density[Particles.Steam];
Density[Particles.Clone] = Density[Particles.Void];

const InitialState = [];
InitialState[Particles.Air] = [Particles.Air, 0, 0, 0];
InitialState[Particles.Dust] = [Particles.Dust, 5, 0, 0];
InitialState[Particles.Stone] = [Particles.Stone, 0, 0, 0];
InitialState[Particles.Water] = [Particles.Water, 0, 30, 0];
InitialState[Particles.Metal] = [Particles.Metal, 0, 0, 0];
InitialState[Particles.Rust] = [Particles.Rust, 0, 0, 0];
InitialState[Particles.Lava] = [Particles.Lava, 0, 0, 0];
InitialState[Particles.Void] = [Particles.Void, 0, 0, 0];
InitialState[Particles.Fire] = [Particles.Fire, 0, 0, 0];
InitialState[Particles.Steam] = [Particles.Steam, 0, 90, 0];
InitialState[Particles.Steel] = [Particles.Steel, 0, 0, 0];
InitialState[Particles.Acid] = [Particles.Acid, 0, 0, 0];
InitialState[Particles.AcidVapor] = [Particles.AcidVapor, 0, 90, 0];
InitialState[Particles.Clone] = [Particles.Clone, 0, 0, 0];


module.exports = {
    Particles,
    Names,
    Colors,
    Density,
    InitialState,
}
