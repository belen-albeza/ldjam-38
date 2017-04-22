'use strict';

const Planet = require('./planet.js');
const BiomaPalette = require('./palette.js');

// const TSIZE = 32;


var PlayScene = {};

PlayScene.init = function () {
    this.game.input.onDown.add(function (pointer) {
        if (!this.biomaPalette.currentBioma) { return; }
        // TODO: YOLO
        let wasPlaced = this.planet.putBiomaWorldXY(
            this.biomaPalette.currentBioma, pointer.worldX, pointer.worldY);
        if (!wasPlaced) {
            this.biomaPalette.unselect();
        }
    }, this);
};

PlayScene.create = function () {
    this.planetLayer = this.game.add.group();
    this.planetLayer.position.set(256, 256);
    this.planet = new Planet('MEDIUM', this.planetLayer);

    this.game.add.image(0, 0, 'mask:medium'); // TODO: adjust to planet size

    // create bioma palette
    this.hud = this.game.add.group();
    this.hud.position.set(520, 8);
    this.biomaPalette = new BiomaPalette(this.hud);

    // cursor
    this.cursorSprite = this.game.add.image(0, 0, 'palette');
    this.cursorSprite.alpha = 0.5;
    this.cursorSprite.visible = false;
};

PlayScene.update = function () {
    this.planet.update();

    // update bioma cursor
    this.cursorSprite.x = this._snapToGrid(this.game.input.x);
    this.cursorSprite.y = this._snapToGrid(this.game.input.y);

    if (this.biomaPalette.currentBioma !== null)  {
        this.cursorSprite.frame = this.biomaPalette.currentIcon;
        this.cursorSprite.visible = true;
    }
    else {
        this.cursorSprite.visible = false;
    }
};

PlayScene._snapToGrid = function (value) {
    return Math.floor(value / Planet.TSIZE) * Planet.TSIZE;
};

module.exports = PlayScene;
