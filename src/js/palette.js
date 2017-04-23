'use strict';

const BIOMAS = require('./bioma_const.js').BIOMAS;
const utils = require('./utils.js');

function Palette(group, sfx, budget) {
    this.group = group;
    this.currentBioma = null;
    this.currentIcon = null;

    this.buttons = {};
    this.buttons.WATER = new Phaser.Button(group.game, 0, 0, 'palette',
        this.selectBioma.bind(this, BIOMAS.WATER, 0), this, 0, 0, 0, 0);
    this.buttons.DESERT = new Phaser.Button(group.game, 0, 36,
        'palette', this.selectBioma.bind(this, BIOMAS.DESERT, 1), this, 1, 1,
        1, 1);
    this.buttons.PLANTS = new Phaser.Button(group.game, 0, 72,
        'palette', this.selectBioma.bind(this, BIOMAS.PLANTS, 2), this, 2, 2, 2,
        2);
    this.buttons.EMPTY = new Phaser.Button(group.game, 0, 108,
        'palette', this.selectBioma.bind(this, BIOMAS.EMPTY, 3), this, 3, 3, 3,
        3);

    Object.keys(this.buttons).forEach(function (key) {
        this.group.add(this.buttons[key]);
    }, this);

    this.sfx = sfx;
    if (budget) {
        this._setupBudgetUI(budget);
        this.update(budget);
    }
}

Palette.prototype.selectBioma = function(bioma, icon) {
    this.currentBioma = bioma;
    this.currentIcon = icon;
    this.sfx.play();
};

Palette.prototype.update = function (budget) {
    for (let bioma in this.buttons) {
        if ((!budget[bioma] || budget[bioma] === 0) && bioma !== 'EMPTY') {
            this.disableBioma(bioma);
        }
        if (budget[bioma] >= 0) {
            this.buttonLabels[bioma].font.text = '' + budget[bioma];
        }
    }
};

Palette.prototype.disableBioma = function (bioma) {
    let button = this.buttons[bioma];
    button.inputEnabled = false;
    button.alpha = 0.2;

    if (this.currentBioma === BIOMAS[bioma]) {
        this.unselect();
    }
};

Palette.prototype.unselect = function () {
    this.currentBioma = null;
    this.currentIcon = null;
};


Palette.prototype._setupBudgetUI = function (budget) {
    this.buttonLabels = {};

    for (let bioma in budget) {
        let button = this.buttons[bioma];
        let amount = utils.buildTextLabel(this.group, 40, 6,
            '' + budget[bioma]);
        button.addChild(amount.label);
        this.buttonLabels[bioma] = amount;
    }
};

module.exports = Palette;
