'use strict';

const Planet = require('./planet.js');
const BiomaPalette = require('./palette.js');

// const TSIZE = 32;


var PlayScene = {};

PlayScene.create = function () {
    this._setupInput();

    this.sfx = {
        placed: this.game.add.audio('sfx:placed'),
        error: this.game.add.audio('sfx:error'),
        select: this.game.add.audio('sfx:select')
    };

    this.planetLayer = this.game.add.group();
    this.planetLayer.position.set(256, 256);
    this.planet = new Planet('MEDIUM', this.planetLayer);

    this.game.add.image(0, 0, 'mask:medium'); // TODO: adjust to planet size

    this._setupUI();

    // cursor
    this.cursorSprite = this.game.add.image(0, 0, 'palette');
    this.cursorSprite.alpha = 0.5;
    this.cursorSprite.visible = false;

    this.frameCounter = 0;
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

    // apply bioma cycles to planet
    this.frameCounter++;
    if (this.frameCounter === 15) {
        this.planet.tick();
        this.frameCounter = 0;
    }
};

PlayScene._setupInput = function () {
    // NOTE: ñapa
    // See: http://www.html5gamedevs.com/topic/11308-gameinputondown-event-and-textbuttoneventsoninputdown-are-fired-both-when-clicking-on-textbutton/
    let bg = this.game.add.sprite(0, 0);
    bg.fixedToCamera = true;
    bg.scale.setTo(this.game.width, this.game.height);
    bg.inputEnabled = true;
    bg.input.priorityID = 0; // lower priority
    bg.events.onInputDown.add(this._handleWorldClick, this);
};

PlayScene._setupUI = function () {
    this.text = {};

    // create bioma palette
    this.hudPalette = this.game.add.group();
    this.hudPalette.position.set(4, 4);
    this.biomaPalette = new BiomaPalette(this.hudPalette, this.sfx.select);

    // world stats
    this.hudStats = this.game.add.group();
    this.hudStats.position.set(4, 464);
    this.text = {
        humidity: this._buildTextLabel(this.hudStats, 0, 0, '0 (dry)'),
        vegetation: this._buildTextLabel(this.hudStats, 0, 24, '0 (dead)')
    };
};

PlayScene._buildTextLabel = function (group, x, y, text) {
    let font = this.game.add.retroFont('font', 16, 24,
        Phaser.RetroFont.TEXT_SET6);
    let label = this.game.make.image(x, y, font);

    group.add(label);
    if (text) { font.text = text; }

    return {font: font, label: label};
};

PlayScene._handleWorldClick = function (target, pointer) {
    if (this.biomaPalette.currentBioma) { // place bioma in world
        let placedOutcome = this.planet.putBiomaWorldXY(
            this.biomaPalette.currentBioma, pointer.worldX, pointer.worldY);
        switch (placedOutcome) {
        case 1: // placement was ok
            this.sfx.placed.play();
            break;
        case -1: // tile outside bounds
            this.biomaPalette.unselect();
            break;
        case -2: // error placing tile
            this.sfx.error.play();
            break;
        }
    }
    else { // show bioma stats
        let cell = this.planet.getCellXY(pointer.worldX, pointer.worldY);
        console.log(cell);
    }
};

PlayScene._snapToGrid = function (value) {
    return Math.floor(value / Planet.TSIZE) * Planet.TSIZE;
};

module.exports = PlayScene;
