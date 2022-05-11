class Particles {
    static Void = 0;
    static Sand = 1;
    static Stone = 2;
    static Water = 3;

    static getId(name) {
        return Particles[name];
    }
}


const Names = []
Names[Particles.Void] = 'Void';
Names[Particles.Sand] = 'Sand';
Names[Particles.Stone] = 'Stone';
Names[Particles.Water] = 'Water';


const Colors = [];
Colors[Particles.Void] = [0, 0, 0];
Colors[Particles.Sand] = [242, 189, 107];
Colors[Particles.Stone] = [128, 128, 128];
Colors[Particles.Water] = [0, 0, 255];


const Density = [];
Density[Particles.Void] = 0;
Density[Particles.Sand] = 0.5;
Density[Particles.Stone] = 0.9;
Density[Particles.Water] = 0.3;

module.exports = {
    Particles,
    Names,
    Colors,
    Density,
}
