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

        // audio files
        this.game.load.audio('sfx:select', 'audio/select.wav');
        this.game.load.audio('sfx:placed', 'audio/placed.wav');
        this.game.load.audio('sfx:error', 'audio/error.wav');
        // fonts
        this.game.load.image('font', 'images/retrofont.png');
        // tilesets and spritesheets
        this.game.load.image('tileset', 'images/biomas_tileset.png');
        this.game.load.spritesheet('palette', 'images/bioma_palette.png',
            32, 32);
        this.game.load.spritesheet('icon:stats', 'images/icon_stats.png',
            16, 24);
        // images
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
    var game = new Phaser.Game(512, 512, Phaser.AUTO);

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
        earth: new Phaser.Button(group.game, 0, 36, 'palette',
            this.selectBioma.bind(this, BIOMAS.DESERT, 1), this, 1, 1, 1, 1),
        vegetation: new Phaser.Button(group.game, 0, 72, 'palette',
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

const MAX_WATER = {
    SOIL: 40,
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

const SIZE = 10;
const T_SIZE = 32;

function Planet(group) {
    this.group = group;
    this.game = group.game;

    this.data = this._buildInitialData(MASKS.FREESTYLE);
    this.stats = {};

    // create sky
    this.sky = this.group.create(0, 0, 'sky:medium'); // TODO: adjust to SIZE
    this.sky.anchor.setTo(0.5);

    // create tile map
    this.map = this.game.add.tilemap(null, T_SIZE, T_SIZE, SIZE, SIZE);
    this.map.addTilesetImage('bioma', 'tileset');
    this.mapLayer = this.map.create('main', SIZE, SIZE, T_SIZE, T_SIZE,
        group);
    this.mapLayer.anchor.setTo(0.5);

    this.update();
}

Planet.T_SIZE = T_SIZE;
Planet.SIZE = SIZE;


Planet.prototype.update = function () {
    this._updateMapFromData();
    this._updateGlobalStats();
};

Planet.prototype.tick = function () {
    for (let col = 0; col < SIZE; col++) {
        for (let row = 0; row < SIZE; row++) {
            let cell = this.data[row * SIZE + col];
            if (cell.bioma !== null) {
                this._tickCell(cell, col, row);
                cell.ticks = (cell.ticks + 1) % 100; // TODO: magic number
            }
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
    for (let row = 0; row < SIZE; row++) {
        txt += this.data
            .slice(row * SIZE, row * SIZE + SIZE)
            .reduce(function (res, x) { return res + x.bioma; }, '');
        txt += row === SIZE - 1 ? '' : '\n';
    }
    return txt;
};

Planet.prototype.putBiomaWorldXY = function (bioma, worldX, worldY) {
    let x = worldX - (this.group.x + this.mapLayer.left);
    let y = worldY - (this.group.y + this.mapLayer.top);

    let col = Math.floor(x / T_SIZE);
    let row = Math.floor(y / T_SIZE);
    return this.set(col, row, REVERSE_BIOMAS[bioma]);
};

Planet.prototype.getCellXY = function (worldX, worldY) {
    let x = worldX - (this.group.x + this.mapLayer.left);
    let y = worldY - (this.group.y + this.mapLayer.top);

    let col = Math.floor(x / T_SIZE);
    let row = Math.floor(y / T_SIZE);
    return this.get(col, row, true);
};

Planet.prototype.get = function(col, row, full) {
    if (col >= 0 && col < SIZE && row >= 0 && row < SIZE) {
        let cell = this.data[row * SIZE + col];
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
    if (col >= 0 && col < SIZE && row >= 0 && row < SIZE) {
        if (this.data[row * SIZE + col] !== null) { // avoid mask
            if (this.validateBioma(col, row, value)) {
                this.data[row * SIZE + col] =
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

Planet.prototype._buildInitialData = function(mask) {
    let data = new Array(SIZE * SIZE);
    for (let i = 0; i < data.length; i++) {
        data[i] = this._buildBiomaData(REVERSE_BIOMAS[mask[i]] || null);
    }
    return data;
};

Planet.prototype._buildBiomaData = function (bioma) {
    let water = bioma === 'SOIL' ? SOIL_NO_VEG_MAX_WATER : 0;
    return {
        bioma: bioma,
        water: water,
        ticks: 0
    };
};

/*jshint -W074 */
Planet.prototype._updateMapFromData = function() {
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            let bioma = this.data[row * SIZE + col].bioma;
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
            case 'FOREST':
                tileIndex = TILESET.FOREST;
                break;
            }

            this.map.putTile(tileIndex, col, row);
        }
    }
};
/*jshint +W074 */

Planet.prototype._tickWaterLevel = function (cell, col, row) {
    let oldWater = cell.water;
    if (this.get(col - 1, row) === 'WATER') { cell.water++; }
    if (this.get(col + 1, row) === 'WATER') { cell.water++; }
    if (this.get(col, row + 1) === 'WATER') { cell.water++; }
    if (this.get(col, row - 1) === 'WATER') { cell.water++; }

    if (cell.water - oldWater === 0) {
        cell.water--;
    }

    cell.water = Math.max(0, Math.min(cell.water, MAX_WATER[cell.bioma]));
};

/*jshint -W074 */
Planet.prototype._tickCell = function (cell, col, row) {
    let upper = this.get(col, row - 1, true);
    let lower = this.get(col, row + 1, true);

    // soil, desert
    if (isEarth(cell.bioma)) {
        this._tickWaterLevel(cell, col, row);
    }

    switch(cell.bioma) {
    case 'DESERT':
        // loss of plants when no water and dry world
        if (cell.water === 0 && upper.bioma === 'PLANTS' &&
        this.stats.waterLabel === 'dry') {
            upper.shiftTo = 'EMPTY';
        }
        // shift from desert to soil when humid enough
        else if (cell.water >= MAX_WATER.DESERT) {
            cell.shiftTo = 'SOIL';
        }
        break;
    case 'SOIL':
        // desertification and loss of plants when no water
        if (cell.water === 0) {
            if (upper.bioma === 'PLANTS') { upper.shiftTo = 'EMPTY'; }
            cell.shiftTo = 'DESERT';
        }
        // ungrown plants on soil when loss of water
        else if (upper.bioma === 'PLANTS' &&
        cell.water < SOIL_NO_VEG_MAX_WATER) {
            upper.shiftTo = 'EMPTY';
        }

        break;
    case 'PLANTS':
        // shift to forest if on soil and not dry world
        if (lower.bioma === 'SOIL' && this.stats.waterLabel !== 'dry') {
            cell.shiftTo = 'FOREST';
        }
        break;
    case 'FOREST':
        // shift to plants if world is dry
        if (this.stats.waterLabel === 'dry') {
            cell.shiftTo = 'PLANTS';
        }
        break;
    }
};
/*jshint +W074 */

Planet.prototype._updateGlobalStats = function () {
    this._updateWaterStats();
    this._updateGreenStats();
};

Planet.prototype._updateGreenStats = function () {
    const GREEN_PLANTS = 1;
    const GREEN_FOREST = 2;
    const GREEN_JUNGLE = 3;

    const GREEN_GREEN = 4;
    const GREEN_LUSH = 10;

    this.stats.green = this.data.reduce(function (res, cell) {
        let level = 0;
        if (cell.bioma === 'PLANTS') { level += GREEN_PLANTS; }
        if (cell.bioma === 'FOREST') { level += GREEN_FOREST; }
        // TODO: add jungle
        return res + level;
    }, 0);

    this.stats.normalizedGreen = Math.floor(100 * (
        this.stats.green / (this.data.length * GREEN_JUNGLE)));

    this.stats.greenLabel = 'barren';
    if (this.stats.normalizedGreen >= GREEN_GREEN) {
        this.stats.greenLabel = 'green';
    }
    if (this.stats.normalizedGreen >= GREEN_LUSH) {
        this.stats.greenLabel = 'lush';
    }
};

Planet.prototype._updateWaterStats = function () {
    const WATER_WATER = 6;
    const WATER_SOIL = 2;
    const WATER_NEUTRAL = 8;
    const WATER_HUMID = 16;

    this.stats.water = this.data.reduce(function (res, cell) {
        let level = 0;
        if (cell.bioma === 'WATER') { level += WATER_WATER; }
        if (cell.bioma === 'SOIL') { level += WATER_SOIL; }
        return res + level;
    }, 0);

    this.stats.normalizedWater = Math.floor(100 * (
        this.stats.water / (this.data.length * WATER_WATER)));

    this.stats.waterLabel = 'dry';
    if (this.stats.normalizedWater >= WATER_NEUTRAL) {
        this.stats.waterLabel = 'neutral';
    }
    if (this.stats.normalizedWater >= WATER_HUMID) {
        this.stats.waterLabel = 'humid';
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
    this.planet = new Planet(this.planetLayer);

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

    this._updateUI();

    // apply bioma cycles to planet
    this.frameCounter++;
    if (this.frameCounter === 15) {
        this.planet.tick();
        this.frameCounter = 0;
    }
};

PlayScene._updateUI = function () {
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

    // update stats labels
    this.text.waterStat.font.text = this.planet.stats.normalizedWater + ' (' +
        this.planet.stats.waterLabel + ')';
    this.text.greenStat.font.text = this.planet.stats.normalizedGreen + ' (' +
        this.planet.stats.greenLabel + ')';
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
    this.hudStats.create(0, 0, 'icon:stats', 0);
    this.hudStats.create(0, 24, 'icon:stats', 1);
    this.text.waterStat = this._buildTextLabel(this.hudStats, 20, 0, '0 (dry)');
    this.text.greenStat = this._buildTextLabel(this.hudStats, 20, 24,
        '0 (barren)');
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
    return Math.floor(value / Planet.T_SIZE) * Planet.T_SIZE;
};

module.exports = PlayScene;

},{"./palette.js":3,"./planet.js":4}]},{},[2]);
