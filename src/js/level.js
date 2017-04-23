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
    }
];

function Level(index) {
    this.index = index;
    this.data = index >= 0 ?
        LEVELS[index] : {map: MASKS.FREESTYLE, goals: null };
}

Level.prototype.consumeBioma = function (bioma) {
    if (bioma !== 'EMPTY') {
        this.data.palette[bioma] -= 1;
    }
};

Level.prototype.getProgress = function () {
    return this.data.goals;
};

Level.prototype.getPalette = function () {
    return this.data.palette;
};

Level.prototype.isVictory = function () {
    return !this.isFreeStyle() && this.data.goals.every(function (goal) {
        return goal.completed;
    });
};

Level.prototype.isFreeStyle = function () {
    return this.data.goals === null;
};

Level.prototype.update = function (planet) {
    if (this.data.goals !== null) {
        this.data.goals.forEach(function (goal) {
            switch (goal.type) {
            case 'block':
                goal.progress = planet.getBiomaAmount(goal.blockType);
                goal.completed = goal.progress >= goal.target;
            }
        });
    }
};

Level.prototype.isFirst = function () {
    return this.index === 0;
};

Level.prototype.isLast = function () {
    return this.index === LEVELS.length - 1;
};

Level.AMOUNT = LEVELS.length;

module.exports = Level;
