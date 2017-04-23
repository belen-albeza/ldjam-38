'use strict';

const levelData = require('./level_data.js');
const LEVELS = levelData.LEVELS;
const MASKS = levelData.MASKS;


function Level(index) {
    this.index = index;
    // TODO: ñapa for deep cloning. it's better to store all level data in json
    /*jshint -W014 */
    this.data = index >= 0
        ? JSON.parse(JSON.stringify(LEVELS[index]))
        : { map: MASKS.FREESTYLE, goals: null };
    /*jshint +W014 */
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

Level.prototype.isBudgetDepleted = function () {
    let palette = this.data.palette;
    return Object.keys(palette).reduce(function (res, bioma) {
        return res && (palette[bioma] <= 0);
    }, true);
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
