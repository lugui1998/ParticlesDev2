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
    static Oil = 14;
    static Block = 15;


    static getId(name) {
        return Particles[name];
    }

    static isHidden(id) {
        return [
            Particles.Rust,
            Particles.Steam,
            Particles.AcidVapor
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
Names[Particles.Oil] = 'Oil';
Names[Particles.Block] = 'Block';



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
Colors[Particles.Oil] = [128, 48, 32];
Colors[Particles.Block] = [35, 35, 35];

const Density = [];
Density[Particles.Air] = 0.002;
Density[Particles.Dust] = 1.5;
Density[Particles.Stone] = 3.0;
Density[Particles.Water] = 1;
Density[Particles.Metal] = 4;
Density[Particles.Rust] = Density[Particles.Dust];
Density[Particles.Lava] = 2.5;
Density[Particles.Void] = 999999999;
Density[Particles.Fire] = 0;
Density[Particles.Steam] = 0.1;
Density[Particles.Steel] = Density[Particles.Metal] * 8;
Density[Particles.Acid] = 1.1;
Density[Particles.AcidVapor] = Density[Particles.Steam];
Density[Particles.Clone] = Density[Particles.Void];
Density[Particles.Oil] = Density[Particles.Water] / 2;
Density[Particles.Block] = Density[Particles.Void];


const InitialState = [];
InitialState[Particles.Air] = [Particles.Air, 0, 0, 0, 0, 0, 0, 0];
InitialState[Particles.Dust] = [Particles.Dust, 0, 0, 50, 0, 0, 0, 0];
InitialState[Particles.Stone] = [Particles.Stone, 0, 0, 0, 0, 0, 0, 0];
InitialState[Particles.Water] = [Particles.Water, 0, 0, 25, 0, 0, 0, 0];
InitialState[Particles.Metal] = [Particles.Metal, 0, 0, 0, 0, 0, 0, 0];
InitialState[Particles.Rust] = [Particles.Rust, 0, 0, 0, 0, 0, 0, 0];
InitialState[Particles.Lava] = [Particles.Lava, 0, 0, 200], 0, 0, 0, 0;
InitialState[Particles.Void] = [Particles.Void, 0, 0, 0, 0, 0, 0, 0];
InitialState[Particles.Fire] = [Particles.Fire, 0, 0, 0];
InitialState[Particles.Steam] = [Particles.Steam, 0, 0, 80, 0, 0, 0, 0];
InitialState[Particles.Steel] = [Particles.Steel, 0, 0, 0, 0, 0, 0, 0];
InitialState[Particles.Acid] = [Particles.Acid, 0, 0, 0], 0, 0, 0, 0;
InitialState[Particles.AcidVapor] = [Particles.AcidVapor, 0, 0, 80, 0, 0, 0, 0];
InitialState[Particles.Clone] = [Particles.Clone, 0, 0, 0, 0, 0, 0, 0];
InitialState[Particles.Oil] = [Particles.Oil, 0, 0, 0, 0, 0, 0, 0];
InitialState[Particles.Block] = [Particles.Block, 0, 0, 0, 0, 0, 0, 0];

const Corrosible = [];
Corrosible[Particles.Air] = false;
Corrosible[Particles.Dust] = true;
Corrosible[Particles.Stone] = true;
Corrosible[Particles.Water] = true;
Corrosible[Particles.Metal] = false;
Corrosible[Particles.Rust] = Corrosible[Particles.Dust];
Corrosible[Particles.Lava] = true;
Corrosible[Particles.Void] = false;
Corrosible[Particles.Fire] = false;
Corrosible[Particles.Steam] = true;
Corrosible[Particles.Steel] = Corrosible[Particles.Metal];
Corrosible[Particles.Acid] = false;
Corrosible[Particles.AcidVapor] = Corrosible[Particles.Acid];
Corrosible[Particles.Clone] = false;
Corrosible[Particles.Oil] = true;
Corrosible[Particles.Block] = false;

const Static = [];
Static[Particles.Air] = true;
Static[Particles.Dust] = false;
Static[Particles.Stone] = false;
Static[Particles.Water] = false;
Static[Particles.Metal] = true;
Static[Particles.Rust] = Static[Particles.Dust];
Static[Particles.Lava] = false;
Static[Particles.Void] = true;
Static[Particles.Fire] = false;
Static[Particles.Steam] = false;
Static[Particles.Steel] = Static[Particles.Metal];
Static[Particles.Acid] = false;
Static[Particles.AcidVapor] = Static[Particles.Acid];
Static[Particles.Clone] = true;
Static[Particles.Oil] = false;
Static[Particles.Block] = true;

const Fluid = [];
Fluid[Particles.Air] = false;
Fluid[Particles.Dust] = false;
Fluid[Particles.Stone] = false;
Fluid[Particles.Water] = true;
Fluid[Particles.Metal] = false;
Fluid[Particles.Rust] = Fluid[Particles.Dust];
Fluid[Particles.Lava] = true;
Fluid[Particles.Void] = false;
Fluid[Particles.Fire] = false;
Fluid[Particles.Steam] = true;
Fluid[Particles.Steel] = Fluid[Particles.Metal];
Fluid[Particles.Acid] = true;
Fluid[Particles.AcidVapor] = Fluid[Particles.Acid];
Fluid[Particles.Clone] = false;
Fluid[Particles.Oil] = true;
Fluid[Particles.Block] = false;

module.exports = {
    Particles,
    Names,
    Colors,
    Density,
    InitialState,
    Corrosible,
    Static,
    Fluid
}
