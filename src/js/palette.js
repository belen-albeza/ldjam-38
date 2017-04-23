'use strict';

const BIOMAS = require('./bioma_const.js').BIOMAS;

function Palette(group, sfx) {
    this.group = group;
    this.currentBioma = null;
    this.currentIcon = null;

    this.buttons = {
        water: new Phaser.Button(group.game, 0, 0, 'palette',
            this.selectBioma.bind(this, BIOMAS.WATER, 0), this, 0, 0, 0, 0),
        earth: new Phaser.Button(group.game, 0, 36, 'palette',
            this.selectBioma.bind(this, BIOMAS.DESERT, 1), this, 1, 1, 1, 1),
        vegetation: new Phaser.Button(group.game, 0, 72, 'palette',
            this.selectBioma.bind(this, BIOMAS.PLANTS, 2), this, 2, 2, 2, 2),
        remove: new Phaser.Button(group.game, 0, 108, 'palette',
            this.selectBioma.bind(this, BIOMAS.EMPTY, 3), this, 3, 3, 3, 3)
    };
    Object.keys(this.buttons).forEach(function (key) {
        this.group.add(this.buttons[key]);
    }, this);

    this.sfx = sfx;
}

Palette.prototype.selectBioma = function(bioma, icon) {
    this.currentBioma = bioma;
    this.currentIcon = icon;
    this.sfx.play();
};

Palette.prototype.unselect = function () {
    this.currentBioma = null;
    this.currentIcon = null;
};

module.exports = Palette;
