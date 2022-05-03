class Particles {
    static Void = 0;
    static Sand = 1;
}


const Names = []
Names[Particles.Void] = 'Void';
Names[Particles.Sand] = 'Sand';


const Colors = [];
Colors[Particles.Void] = [0, 0, 0];
Colors[Particles.Sand] = [242, 189, 107];

module.exports = {
    Particles,
    Names,
    Colors,
}
