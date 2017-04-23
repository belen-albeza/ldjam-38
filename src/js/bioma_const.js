'use strict';

const TILE_MAPPINGS = {
    DESERT: 1,
    DESERT_VEG: 2,
    SOIL: 3,
    SOIL_VEG: 4,
    ROCK: 5,
    DEAD: 6,
    JUNGLE: 7,
    WATER: 8,
    WATER_TOP: 9,
    VEG: 10,
    VEG_ALT: 12,
    FOREST: 11
};

const ICON_MAPPINGS = {
    DESERT: 1,
    SOIL: 3,
    ROCK: 5,
    DEAD: 6,
    JUNGLE: 7,
    WATER: 9,
    PLANTS: 10,
    FOREST: 11
};

const BIOMAS = {
    EMPTY: ' ',
    DEAD: 'x',
    DESERT: '-',
    SOIL: '=',
    JUNGLE: 'o',
    WATER: '~',
    ROCK: '*',
    FOREST: '$',
    PLANTS: ','
};

const REVERSE_BIOMAS = Object.keys(BIOMAS).reduce(function (res, key) {
    res[BIOMAS[key]] = key;
    return res;
}, {});


module.exports = {
    MAPPINGS: TILE_MAPPINGS,
    BIOMAS: BIOMAS,
    ICON_MAPPINGS: ICON_MAPPINGS,
    REVERSE_BIOMAS
};
