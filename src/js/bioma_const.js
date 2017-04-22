const TILE_MAPPINGS = {
    DESERT: 1,
    DESERT_VEG: 2,
    SOIL: 3,
    SOIL_VEG: 4,
    ROCK: 5,
    DEAD: 6,
    JUNGLE_SOIL: 7,
    WATER: 8,
    WATER_TOP: 9,
    VEG: 10,
    VEG_ALT: 12,
    FOREST: 11
};

const BIOMAS = {
    EMPTY: ' ',
    DEAD: 'x',
    DESERT: '-',
    SOIL: '=',
    JUNGLE_SOIL: 'o',
    WATER: '~',
    ROCK: '*',
    FOREST: '$',
    PLANTS: ','
};

module.exports = {
    MAPPINGS: TILE_MAPPINGS,
    BIOMAS: BIOMAS
};
