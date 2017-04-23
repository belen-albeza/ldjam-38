'use strict';

const MASKS = {
    FREESTYLE: '@@      @@' +
               '@        @' +
               '          ' +
               '          ' +
               '          ' +
               'xxxxxxxxxx' +
               'xxxxxxxxxx' +
               'xxxxxxxxxx' +
               '@xxxxxxxx@' +
               '@@xxxxxx@@'
};

const LEVELS = [
    {
        map: MASKS.FREESTYLE,
        goals: [
            {type: 'block', blockType: 'DESERT', target: 3}
        ],
        palette: {
            DESERT: 3
        }
    },
    {
        map: MASKS.FREESTYLE,
        goals: [
            {type: 'block', blockType: 'DESERT', target: 2},
            {type: 'block', blockType: 'SOIL', target: 1}
        ],
        palette: {
            DESERT: 4,
            WATER: 1
        }
    },
    {
        map: MASKS.FREESTYLE,
        goals: [
            {type: 'block', blockType: 'PLANTS', target: 1},
        ],
        palette: {
            DESERT: 4,
            WATER: 1,
            PLANTS: 1
        }
    },
    {
        map: MASKS.FREESTYLE,
        goals: [
            {type: 'block', blockType: 'FOREST', target: 1}
        ],
        palette: {
            DESERT: 4,
            WATER: 8,
            PLANTS: 1
        }
    },
    {
        map: MASKS.FREESTYLE,
        goals: [
            {type: 'block', blockType: 'FOREST', target: 4},
            {type: 'block', blockType: 'PLANTS', target: 4}
        ],
        palette: {
            DESERT: 8,
            WATER: 8,
            PLANTS: 8,
        }
    }
];

module.exports = {
    MASKS: MASKS,
    LEVELS: LEVELS
};
