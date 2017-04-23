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
            {type: 'block', blockType: 'WATER', target: 3}
        ]
    }
];

function Level(index) {
    this.data = LEVELS[index];
}

Level.prototype.getProgress = function () {
    return this.data.goals;
};

Level.prototype.isVictory = function () {
    return this.data.goals.every(function (goal) {
        return goal.completed;
    });
};

Level.prototype.update = function (planet) {
    this.data.goals.forEach(function (goal) {
        switch (goal.type) {
        case 'block':
            goal.progress = planet.getBiomaAmount(goal.blockType);
            goal.completed = goal.progress >= goal.target;
        }
    });
};

Level.AMOUNT = LEVELS.length;

module.exports = Level;
