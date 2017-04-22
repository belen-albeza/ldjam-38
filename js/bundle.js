(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
'use strict';

var PlayScene = require('./play_scene.js');


var BootScene = {
    init: function () {
        // NOTE: change this to suit your preferred scale mode.
        //       see http://phaser.io/docs/2.6.2/Phaser.ScaleManager.html
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.pageAlignVertically = true;
        this.game.scale.pageAlignHorizontally = true;
    },

    preload: function () {
        // load here assets required for the loading screen
        this.game.load.image('preloader_bar', 'images/preloader_bar.png');
    },

    create: function () {
        this.game.state.start('preloader');
    }
};


var PreloaderScene = {
    preload: function () {
        this.loadingBar = this.game.add.sprite(0, 240, 'preloader_bar');
        this.loadingBar.anchor.setTo(0, 0.5);
        this.load.setPreloadSprite(this.loadingBar);

        // load assets for the game
        this.game.load.audio('sfx:select', 'audio/select.wav');
        this.game.load.audio('sfx:placed', 'audio/placed.wav');
        this.game.load.audio('sfx:error', 'audio/error.wav');

        this.game.load.image('tileset', 'images/biomas_tileset.png');
        this.game.load.spritesheet('palette', 'images/bioma_palette.png',
            32, 32);

        this.game.load.image('mask:tiny', 'images/mask_tiny.png');
        this.game.load.image('mask:medium', 'images/mask_medium.png');
        this.game.load.image('sky:tiny', 'images/blue_sky_tiny.png');
        this.game.load.image('sky:medium', 'images/blue_sky_medium.png');
    },

    create: function () {
        this.game.state.start('play');
    }
};


window.onload = function () {
    var game = new Phaser.Game(800, 512, Phaser.AUTO);

    game.state.add('boot', BootScene);
    game.state.add('preloader', PreloaderScene);
    game.state.add('play', PlayScene);

    game.state.start('boot');
};

},{"./play_scene.js":5}],3:[function(require,module,exports){
'use strict';

const BIOMAS = require('./bioma_const.js').BIOMAS;

function Palette(group, sfx) {
    this.group = group;
    this.currentBioma = null;
    this.currentIcon = null;

    this.buttons = {
        water: new Phaser.Button(group.game, 0, 0, 'palette',
            this.selectBioma.bind(this, BIOMAS.WATER, 0), this, 0, 0, 0, 0),
        earth: new Phaser.Button(group.game, 36, 0, 'palette',
            this.selectBioma.bind(this, BIOMAS.DESERT, 1), this, 1, 1, 1, 1),
        vegetation: new Phaser.Button(group.game, 72, 0, 'palette',
            this.selectBioma.bind(this, BIOMAS.PLANTS, 2), this, 2, 2, 2, 2)
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

},{"./bioma_const.js":1}],4:[function(require,module,exports){
'use strict';

let bioData = require('./bioma_const.js');
const BIOMAS = bioData.BIOMAS;
const TILESET = bioData.MAPPINGS;
const REVERSE_BIOMAS = Object.keys(BIOMAS).reduce(function (res, key) {
    res[BIOMAS[key]] = key;
    return res;
}, {});

const MASKS = {
    TINY: '@    @' +
          '      ' +
          '      ' +
          '      ' +
          'xxxxxx' +
          '@xxxx@',
    MEDIUM: '@@      @@' +
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

const MAX_WATER = {
    SOIL: 20,
    DESERT: 10
};
const SOIL_NO_VEG_MAX_WATER = 20;

function isEarth(bioma) {
    return bioma === 'DESERT' || bioma === 'SOIL';
}

function isVegetation(bioma) {
    return bioma === 'FOREST' || bioma === 'PLANTS';
}

function isSolidOrWater(bioma) {
    return bioma !== 'EMPTY' && !isVegetation(bioma);
}

function Planet(size, group) {
    this.group = group;
    this.game = group.game;

    this.radius = Planet.SIZES[size];
    this.data = this._buildInitialData(this.radius, MASKS[size]);

    // create sky
    this.sky = this.group.create(0, 0, 'sky:medium'); // TODO: adjust to radius
    this.sky.anchor.setTo(0.5);

    // create tile map
    this.map = this.game.add.tilemap(null, Planet.TSIZE, Planet.TSIZE,
        this.radius, this.radius);
    this.map.addTilesetImage('bioma', 'tileset');
    this.mapLayer = this.map.create('main', this.radius, this.radius,
        Planet.TSIZE, Planet.TSIZE, group);
    this.mapLayer.anchor.setTo(0.5);
    this._updateMapFromData();
}

Planet.SIZES = {
    TINY: 6,
    MEDIUM: 10
};

Planet.TSIZE = 32;


Planet.prototype.update = function () {
    this._updateMapFromData();
};

Planet.prototype.tick = function () {
    let self = this;
    function updateWaterLevel(cell, col, row) {
        let oldWater = cell.water;
        if (self.get(col - 1, row) === 'WATER') { cell.water++; }
        if (self.get(col + 1, row) === 'WATER') { cell.water++; }
        if (self.get(col, row + 1) === 'WATER') { cell.water++; }
        if (self.get(col, row - 1) === 'WATER') { cell.water++; }

        if (cell.water - oldWater === 0) {
            cell.water--;
        }

        cell.water = Math.max(0, Math.min(cell.water, MAX_WATER[cell.bioma]));
    }

    function updateCell(cell, col, row) {
        let upper = self.get(col, row - 1, true);

        // soil, desert
        if (isEarth(cell.bioma)) {
            updateWaterLevel(cell, col, row);

            // desertification and loss of plants when land loses water
            if (cell.water === 0) {
                if (upper.bioma === 'PLANTS') { upper.shiftTo = 'EMPTY'; }
                if (cell.bioma === 'SOIL') { cell.shiftTo = 'DESERT'; }
            }
            // shift from desert to soil when humid enough
            else if (cell.bioma === 'DESERT' && cell.water >= MAX_WATER.DESERT) {
                cell.shiftTo = 'SOIL';
            }
            // grow plants on soil with water
            else if (cell.bioma === 'SOIL' && upper.bioma === 'EMPTY' &&
            cell.water >= SOIL_NO_VEG_MAX_WATER) {
                upper.shiftTo = 'PLANTS';
            }
            // ungrown plants on soil when loss of water
            else if (cell.bioma === 'SOIL' && upper.bioma === 'PLANTS' &&
            cell.water < SOIL_NO_VEG_MAX_WATER) {
                upper.shiftTo = 'EMPTY';
            }
        }
    }

    for (let col = 0; col < this.radius; col++) {
        for (let row = 0; row < this.radius; row++) {
            let cell = this.data[row * this.radius + col];
            if (cell.bioma === null) { continue; }

            updateCell(cell, col, row);
            cell.ticks = (cell.ticks + 1) % 100; // TODO: adjust magic number
        }
    }

    // shift marked biomas
    for (let i = 0; i < this.data.length; i++) {
        if (this.data[i].shiftTo) {
            this.data[i] = this._buildBiomaData(this.data[i].shiftTo);
        }
    }
};


Planet.prototype.prettyPrint = function () {
    let txt = '';
    for (let row = 0; row < this.radius; row++) {
        txt += this.data
            .slice(row * this.radius, row * this.radius + this.radius)
            .reduce(function (res, x) { return res + x; }, '');
        txt += row === this.radius - 1 ? '' : '\n';
    }
};

Planet.prototype.putBiomaWorldXY = function (bioma, worldX, worldY) {
    let x = worldX - (this.group.x + this.mapLayer.left);
    let y = worldY - (this.group.y + this.mapLayer.top);

    let col = Math.floor(x / Planet.TSIZE);
    let row = Math.floor(y / Planet.TSIZE);
    return this.set(col, row, REVERSE_BIOMAS[bioma]);
};



Planet.prototype.getCellXY = function (worldX, worldY) {
    let x = worldX - (this.group.x + this.mapLayer.left);
    let y = worldY - (this.group.y + this.mapLayer.top);

    let col = Math.floor(x / Planet.TSIZE);
    let row = Math.floor(y / Planet.TSIZE);
    return this.get(col, row, true);
};

Planet.prototype.get = function(col, row, full) {
    if (col >= 0 && col < this.radius && row >= 0 && row < this.radius) {
        let cell = this.data[row * this.radius + col];
        return full ? cell : cell.bioma;
    }
    else {
        return full ? { bioma: null } : null;
    }
};


// 1: tile placed
// -2: tile could not be placed because of rules
// -1: tile outside map bounds

Planet.prototype.set = function(col, row, value) {
    if (col >= 0 && col < this.radius && row >= 0 && row < this.radius) {
        if (this.data[row * this.radius + col] !== null) { // avoid mask
            if (this.validateBioma(col, row, value)) {
                this.data[row * this.radius + col] =
                    this._buildBiomaData(value);
                this._applyPlacementEffects(col, row);
                return 1;
            }
            else {
                return -2;
            }
        }
    }
    return -1;
};

Planet.prototype.validateBioma = function (col, row, value) {
    switch(value) {
    case 'WATER':
        return isSolidOrWater(this.get(col - 1, row)) &&
               isSolidOrWater(this.get(col + 1, row)) &&
               isSolidOrWater(this.get(col, row + 1));
    case 'PLANTS':
        return this.get(col, row) === 'EMPTY' &&
            isEarth(this.get(col, row + 1));
    default:
        return true;
    }
};

Planet.prototype._applyPlacementEffects = function (col, row) {
    let bioma = this.get(col, row);
    if (bioma === 'WATER') {
        // remove vegetation because it needs land
        if (isVegetation(this.get(col, row - 1))) {
            this.set(col, row - 1, 'EMPTY');
        }
    }
    else if (isVegetation(bioma)) {
        // give a bit of water to the land below
        this.get(col, row + 1, true).water += 5;
    }
};


Planet.prototype._buildInitialData = function(radius, mask) {
    let data = new Array(radius * radius);
    for (let i = 0; i < data.length; i++) {
        data[i] = this._buildBiomaData(REVERSE_BIOMAS[mask[i]] || null);
    }
    return data;
};

Planet.prototype._buildBiomaData = function (bioma) {
    return {
        bioma: bioma,
        water: 0,
        ticks: 0
    };
};

Planet.prototype._updateMapFromData = function() {
    for (let row = 0; row < this.radius; row++) {
        for (let col = 0; col < this.radius; col++) {
            let bioma = this.data[row * this.radius + col].bioma;
            let tileIndex = null;

            switch (bioma) {
            case 'DEAD':
                tileIndex = TILESET.DEAD;
                break;
            case 'DESERT':
                tileIndex = isVegetation(this.get(col, row - 1)) ?
                    TILESET.DESERT_VEG : TILESET.DESERT;
                break;
            case 'SOIL':
                tileIndex = isVegetation(this.get(col, row - 1)) ?
                    TILESET.SOIL_VEG : TILESET.SOIL;
                break;
            case 'WATER':
                tileIndex = (this.get(col, row - 1) === 'EMPTY') ?
                    TILESET.WATER_TOP : TILESET.WATER;
                break;
            case 'PLANTS':
                tileIndex = TILESET.VEG;
                break;
            }

            this.map.putTile(tileIndex, col, row);
        }
    }
};

module.exports = Planet;

},{"./bioma_const.js":1}],5:[function(require,module,exports){
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

    // create bioma palette
    this.hud = this.game.add.group();
    this.hud.position.set(520, 8);
    this.biomaPalette = new BiomaPalette(this.hud, this.sfx.select);

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

},{"./palette.js":3,"./planet.js":4}]},{},[2]);
