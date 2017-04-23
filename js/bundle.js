(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

const TILE_MAPPINGS = {
    DESERT: 1,
    DESERT_VEG: 2,
    SOIL: 3,
    SOIL_VEG: 4,
    ROCK: 5,
    DEAD: 6,
    JUNGLE: 7,
    WATER: 8,
    WATER_TOP: 9,
    VEG: 10,
    VEG_ALT: 12,
    FOREST: 11
};

const ICON_MAPPINGS = {
    DESERT: 1,
    SOIL: 3,
    ROCK: 5,
    DEAD: 6,
    JUNGLE: 7,
    WATER: 9,
    PLANTS: 10,
    FOREST: 11
};

const BIOMAS = {
    EMPTY: ' ',
    DEAD: 'x',
    DESERT: '-',
    SOIL: '=',
    JUNGLE: 'o',
    WATER: '~',
    ROCK: '*',
    FOREST: '$',
    PLANTS: ','
};

const REVERSE_BIOMAS = Object.keys(BIOMAS).reduce(function (res, key) {
    res[BIOMAS[key]] = key;
    return res;
}, {});


module.exports = {
    MAPPINGS: TILE_MAPPINGS,
    BIOMAS: BIOMAS,
    ICON_MAPPINGS: ICON_MAPPINGS,
    REVERSE_BIOMAS
};

},{}],2:[function(require,module,exports){
'use strict';

const MIN_SPEED = 10;
const MAX_SPEED = 50;

function Cloud(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'cloud:small');

    this.anchor.setTo(0.5, 0.5);
    this.alpha = this.game.rnd.realInRange(0.3, 0.9);

    this.game.physics.enable(this);
    this.reset(x, y);
}

// inherit from Phaser.prototype
Cloud.prototype = Object.create(Phaser.Sprite.prototype);
Cloud.prototype.constructor = Cloud;

Cloud.prototype.update = function () {
    if (this.x <= -this.width / 2) {
        this.reset();
    }
};

Cloud.prototype.reset = function (x, y) {
    Phaser.Sprite.prototype.reset.call(this, x || 0, y || 0);
    this._wasInside = false;

    if (x === undefined || y === undefined) {
        this.position.setTo(320 + this.game.rnd.between(0, 320),
            this.game.rnd.between(20, 120));
    }

    this.body.velocity.x = -this.game.rnd.between(MIN_SPEED, MAX_SPEED);

    this.key = this.game.rnd.pick(['cloud:small', 'cloud:big']);
};

module.exports = Cloud;

},{}],3:[function(require,module,exports){
'use strict';

const utils = require('./utils.js');
const TILES = require('./bioma_const.js').ICON_MAPPINGS;

function GoalsCard(parentGroup, goals) {
    // create a subgroup
    this.game = parentGroup.game;
    this.group = parentGroup.add(this.game.add.group());
    this.group.visible = false;

    this.group.add(this.game.make.image(0, 0, 'card:medium'));
    let titleLabel = utils.buildTextLabel(this.group, this.group.width / 2, 16,
        'Goals');
    titleLabel.label.anchor.setTo(0.5, 0);

    this.onClose = new Phaser.Signal();
    let okButton = this.group.add(this.game.make.button(
        this.group.width - 8, 8, 'button:icon',
        function () { this.onClose.dispatch(); }, this,
        0, 0, 0, 0));
    okButton.anchor.set(1, 0);
    let okLabel = utils.buildTextLabel(this.group, -okButton.width / 2 + 2,
        okButton.height / 2 + 4, 'x');
    okButton.addChild(okLabel.label);
    okLabel.label.anchor.setTo(0.5, 0.5);

    // center card on screen
    this.group.position.set(
        this.game.world.width / 2 - this.group.width / 2,
        this.game.world.height / 2 - this.group.height / 2
    );

    this.goalGroup = this.group.add(this.game.add.group());
    this.ticks = [];
    goals.forEach(this._spawnGoalUI, this);

    this.goals = goals;
}

GoalsCard.prototype.updateGoals = function(goals) {
    this.goals = goals;
    this.goals.forEach(function (goal, index) {
        if (goal.completed) {
            this.ticks[index].visible = true;
        }
    }, this);
};

GoalsCard.prototype.show = function () {
    this.group.parent.visible = true;
    this.group.visible = true;
};

GoalsCard.prototype.hide = function () {
    this.group.parent.visible = false;
    this.group.visible = false;
};

GoalsCard.prototype._spawnGoalUI = function (goal, index) {
    let ui = this.game.add.group();

    if (goal.type === 'block') {
        ui.create(0, 0, 'icon:tileset', TILES[goal.blockType]);
        utils.buildTextLabel(ui, 40, 6, '' + goal.target);
        ui.position.set(16, (index + 1) * 36 + 16);
        let tick = ui.create(72, 6, 'tick');
        tick.visible = false;
        tick.waka = goal.blockType;
        this.ticks.push(tick);
    }

    this.goalGroup.add(ui);
};

module.exports = GoalsCard;

},{"./bioma_const.js":1,"./utils.js":11}],4:[function(require,module,exports){
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

},{"./level_data.js":5}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
'use strict';

var PlayScene = require('./play_scene.js');
var TitleScene = require('./title_scene.js');


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
    /*jshint -W071 */
    preload: function () {
        this.loadingBar = this.game.add.sprite(0, 240, 'preloader_bar');
        this.loadingBar.anchor.setTo(0, 0.5);
        this.load.setPreloadSprite(this.loadingBar);

        // load assets for the game

        // audio files
        this.game.load.audio('sfx:select', 'audio/select.wav');
        this.game.load.audio('sfx:placed', 'audio/placed.wav');
        this.game.load.audio('sfx:error', 'audio/error.wav');
        this.game.load.audio('track:bgm', ['audio/bgm.mp3', 'audio/bgm.ogg']);
        // fonts
        this.game.load.image('font', 'images/retrofont.png');
        // tilesets and spritesheets
        this.game.load.image('tileset', 'images/biomas_tileset.png');
        this.game.load.spritesheet('icon:tileset', 'images/biomas_tileset.png',
            32, 32);
        this.game.load.spritesheet('palette', 'images/bioma_palette.png',
            32, 32);
        this.game.load.spritesheet('icon:stats', 'images/icon_stats.png',
            16, 24);
        this.game.load.spritesheet('icon:misc', 'images/icon_misc.png', 32, 32);
        // images
        this.game.load.image('mask:medium', 'images/mask_medium.png');
        this.game.load.image('sky:medium', 'images/blue_sky_medium.png');
        this.game.load.image('cloud:small', 'images/cloud_small.png');
        this.game.load.image('cloud:big', 'images/cloud_big.png');
        this.game.load.image('card:small', 'images/card_small.png');
        this.game.load.image('card:medium', 'images/card_medium.png');
        this.game.load.image('bg:modal', 'images/modal_bg.png');
        this.game.load.image('button:small', 'images/button_small.png');
        this.game.load.image('button:icon', 'images/button_icon.png');
        this.game.load.image('button:medium', 'images/button_medium.png');
        this.game.load.image('globe', 'images/globe.png');
        this.game.load.image('tick', 'images/tick.png');
    },
    /*jshint +W071 */

    create: function () {
        // this.game.state.start('title');
        // // TODO: disable this
        this.game.state.start('play', true, false, 1);
    }
};


window.onload = function () {
    var game = new Phaser.Game(512, 512, Phaser.AUTO);

    game.state.add('boot', BootScene);
    game.state.add('preloader', PreloaderScene);
    game.state.add('play', PlayScene);
    game.state.add('title', TitleScene);

    game.state.start('boot');
};

},{"./play_scene.js":9,"./title_scene.js":10}],7:[function(require,module,exports){
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

},{"./bioma_const.js":1,"./utils.js":11}],8:[function(require,module,exports){
'use strict';

let bioData = require('./bioma_const.js');
const TILESET = bioData.MAPPINGS;
const REVERSE_BIOMAS = bioData.REVERSE_BIOMAS;

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

function Planet(group, mapData) {
    this.group = group;
    this.game = group.game;

    this.data = this._buildInitialData(mapData);
    this.stats = {};

    // create sky
    this.sky = this.group.create(0, 0, 'sky:medium'); // TODO: adjust to SIZE
    this.sky.anchor.setTo(0.5);

    this.cloudLayer = this.game.add.group();
    this.group.add(this.cloudLayer);

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
    let current = this.get(col, row);

    // don't allow to put the same block again (and consume budget)
    if (current === value) { return false; }

    let left = this.get(col - 1, row);
    let right = this.get(col + 1, row);
    let up = this.get(col, row - 1);
    let down = this.get(col, row + 1);

    switch(value) {
    case 'WATER':
        return isSolidOrWater(left) &&
               isSolidOrWater(right) &&
               isSolidOrWater(down);
    case 'PLANTS':
        return current === 'EMPTY' &&
            isEarth(down);
    case 'EMPTY':
        return left !== 'WATER' &&
               right !== 'WATER' &&
               up !== 'WATER' &&
               !isVegetation(up);
    default:
        return true;
    }
};

Planet.prototype.getBiomaAmount = function (bioma) {
    return this.data.reduce(function (res, cell) {
        return res + (cell.bioma === bioma ? 1 : 0);
    }, 0);
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

    // humid worlds provide water to soil
    if (cell.bioma === 'SOIL' && this.stats.waterLabel === 'humid') {
        cell.water = SOIL_NO_VEG_MAX_WATER;
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
        // shift from desert to soil when it has enough water
        else if (cell.water >= MAX_WATER.DESERT) {
            cell.shiftTo = 'SOIL';
        }
        // shift from desert to soil when world is humid
        else if (this.stats.waterLabel === 'humid') {
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

},{"./bioma_const.js":1}],9:[function(require,module,exports){
'use strict';

const utils = require('./utils.js');
const Level = require('./level.js');
const Planet = require('./planet.js');
const Cloud = require('./cloud.js');
const BiomaPalette = require('./palette.js');
const VictoryCard = require('./victory_card.js');
const GoalsCard = require('./goals_card.js');

const REVERSE_BIOMAS = require('./bioma_const').REVERSE_BIOMAS;

const RESTART_TIMEOUT = Phaser.Timer.SECOND * 5; // TODO: adjust

var PlayScene = {};

PlayScene.init = function (levelIndex) {
    this.level = new Level(levelIndex);
};

PlayScene.create = function () {
    this._setupInput();
    this.camera.flash('#000000');

    this.sfx = {
        placed: this.game.add.audio('sfx:placed'),
        error: this.game.add.audio('sfx:error'),
        select: this.game.add.audio('sfx:select')
    };
    this.song = this.game.add.audio('track:bgm');
    this.song.fadeIn(2000, true);

    this.planetLayer = this.game.add.group();
    this.planetLayer.position.set(256, 256);
    this.planet = new Planet(this.planetLayer, this.level.data.map);

    // spawn clouds
    let clouds = this.planet.cloudLayer;
    clouds.position.set(-160, -160);
    clouds.add(new Cloud(this.game, 50, 96));
    clouds.add(new Cloud(this.game, 200, 40));
    clouds.add(new Cloud(this.game, 328, 156));

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

    // apply bioma cycles to planet
    this.frameCounter++;
    if (this.frameCounter === 15) {
        this.planet.tick();
        this.frameCounter = 0;
    }

    this.level.update(this.planet);
    this._updateUI();

    if (this.level.isVictory()) {
        this.game.time.events.add(Phaser.Timer.SECOND * 1.5, this._victory,
            this);
    }
};

PlayScene.resetLevel = function () {
    this.game.state.restart(true, false, this.level.index);
};

PlayScene._victory = function () {
    this._showCard('victory');
    this.isVictory = true;
    this.cards.victory.onClose.addOnce(function () {
        // TODO: show a "you have completed the game" banner when winning
        //       the last level
        if (this.level.isLast()) {
            this.game.state.start('title');
        }
        else {
            this.camera.flash('#000000');
            this.game.state.restart(true, false, this.level.index + 1);
        }
    }, this);
};

PlayScene._showCard = function (which) {
    this.cards[which].show();
    this.isModalActive = true;
};

PlayScene._hideCard = function () {
    this.isModalActive = false;
    Object.keys(this.cards).forEach(function (key) {
        this.cards[key].hide();
    }, this);
};

PlayScene._updateUI = function () {
    // update bioma cursor
    this.cursorSprite.x = this._snapToGrid(this.game.input.x);
    this.cursorSprite.y = this._snapToGrid(this.game.input.y);

    if (this.biomaPalette.currentBioma !== null && !this.isModalActive)  {
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

    if (!this.level.isFreeStyle()) {
        // update palette
        this.biomaPalette.update(this.level.getPalette());
        // update goals card
        this.cards.goals.updateGoals(this.level.getProgress());
    }

};

PlayScene._setupInput = function () {
    // NOTE: ñapa
    // See: https://goo.gl/N7MwJI
    let bg = this.game.add.sprite(0, 0);
    bg.fixedToCamera = true;
    bg.scale.setTo(this.game.width, this.game.height);
    bg.inputEnabled = true;
    bg.input.priorityID = 0; // lower priority
    bg.events.onInputDown.add(this._handleWorldClick, this);
};

/*jshint -W071 */
PlayScene._setupUI = function () {
    this.text = {};

    // create bioma palette
    this.hudPalette = this.game.add.group();
    this.hudPalette.position.set(4, 4);
    this.biomaPalette = new BiomaPalette(this.hudPalette, this.sfx.select,
        this.level.isFreeStyle() ? null : this.level.getPalette());

    // world stats
    this.hudStats = this.game.add.group();
    this.hudStats.position.set(4, 464);
    this.hudStats.create(0, 0, 'icon:stats', 0);
    this.hudStats.create(0, 24, 'icon:stats', 1);
    this.text.waterStat = utils.buildTextLabel(this.hudStats, 20, 0, '0 (dry)');
    this.text.greenStat = utils.buildTextLabel(this.hudStats, 20, 24,
        '0 (barren)');

    // reset button
    this.buttons = this.game.add.group();
    let resetButton = this.game.make.button(508, 4, 'icon:misc', function () {
        this.sfx.select.play(); // TODO: pick a different sound for reloading?
        this.resetLevel();
    }, this, 1, 1, 1, 1);
    resetButton.anchor.setTo(1, 0);
    this.buttons.add(resetButton);
    this.restartLabel = utils.buildTextLabel(this.buttons, -36, 6, 'restart?')
        .label;
    this.restartLabel.anchor.setTo(1, 0);
    resetButton.addChild(this.restartLabel);
    this.restartLabel.visible = false;

    // modals
    this.hudCards = this.game.add.group();
    this.hudCards.visible = false;
    let modalBg = this.hudCards.create(0, 0, 'bg:modal');
    modalBg.inputEnabled = true;
    this.cards = {};
    this.cards.victory = new VictoryCard(this.hudCards);

    // 'show goals' button and modal
    if (!this.level.isFreeStyle()) {
        let goalsButton = this.game.make.button(504, 504, 'button:medium',
        function () {
            this._showCard('goals');
        }, this, 0, 0, 0, 0);
        goalsButton.anchor.setTo(1, 1);
        let goalsLabel = utils.buildTextLabel(this.buttons,
            -goalsButton.width / 2, -goalsButton.height + 6, 'Goals');
        goalsButton.addChild(goalsLabel.label);
        goalsLabel.label.anchor.setTo(0.5, 0);
        this.buttons.add(goalsButton);

        this.cards.goals =  new GoalsCard(this.hudCards,
            this.level.getProgress());
        this.cards.goals.onClose.add(function () {
            this._hideCard();
        }, this);
    }

    if (!this.level.isFreeStyle()) { this._showCard('goals'); }
};
/*jshint +W071 */

PlayScene._handleWorldClick = function (target, pointer) {
    if (this.biomaPalette.currentBioma) { // place bioma in world
        let placedOutcome = this.planet.putBiomaWorldXY(
            this.biomaPalette.currentBioma, pointer.worldX, pointer.worldY);
        switch (placedOutcome) {
        case 1: // placement was ok
            this.sfx.placed.play();
            if (!this.level.isFreeStyle()) {
                this.level.consumeBioma(
                    REVERSE_BIOMAS[this.biomaPalette.currentBioma]);
                if (this.level.isBudgetDepleted()) {
                    this.game.time.events.add(RESTART_TIMEOUT,
                        this._showResetWarning, this);
                }
            }
            break;
        case -1: // tile outside bounds
            this.biomaPalette.unselect();
            break;
        case -2: // error placing tile
            this.sfx.error.play();
            break;
        }
    }
};

PlayScene._snapToGrid = function (value) {
    return Math.floor(value / Planet.T_SIZE) * Planet.T_SIZE;
};

PlayScene._showResetWarning = function () {
    if (!this.isVictory) {
        this.restartLabel.visible = true;
        this.game.add.tween(this.restartLabel).to({alpha: 0}, 1000,
            Phaser.Easing.InOut, true, 0, -1, true);
    }
};

PlayScene.shutdown = function () {
    this.song.stop();
};

module.exports = PlayScene;

},{"./bioma_const":1,"./cloud.js":2,"./goals_card.js":3,"./level.js":4,"./palette.js":7,"./planet.js":8,"./utils.js":11,"./victory_card.js":12}],10:[function(require,module,exports){
'use strict';

const utils = require('./utils.js');

var TitleScene = {};

TitleScene.create = function () {
    this.camera.flash('#000000');

    this.overlay = this.game.add.group();

    let gameTitle = utils.buildTextLabel(this.overlay, this.game.width / 2, 32,
        'Terrartisan');
    gameTitle.label.anchor.setTo(0.5, 0);

    let globe = this.game.make.image(this.game.width / 2, 224,
        'globe');
    globe.anchor.setTo(0.5);
    this.overlay.add(globe);

    this.game.add.tween(globe).to({y: globe.y + 6}, 1600, Phaser.Easing.InOut,
        true, 0, -1, true);

    this._buildOption(128, 416, 'Quest mode', function () {
        this.game.state.start('play', true, false, 0);
    });
    this._buildOption(384, 416, 'Freestyle', function () {
        this.game.state.start('play', true, false, -1);
    });
};

TitleScene._buildOption = function (x, y, text, callback) {
    let optionLabel = utils.buildTextLabel(this.overlay, x, y, text);
    optionLabel.label.anchor.setTo(0.5, 0);

    let button = this.game.make.button(0, 32, 'button:medium', callback, this,
        0, 0, 0, 0);
    button.anchor.setTo(0.5, 0);
    optionLabel.label.addChild(button);

    let buttonText = utils.buildTextLabel(this.overlay, 0, 18, 'Choose');
    buttonText.label.anchor.setTo(0.5, 0.5);
    button.addChild(buttonText.label);
};

module.exports = TitleScene;

},{"./utils.js":11}],11:[function(require,module,exports){
'use strict';

module.exports = {
    buildTextLabel: function (group, x, y, text) {
        let font = group.game.add.retroFont('font', 16, 24,
            Phaser.RetroFont.TEXT_SET6);
        let label = group.game.make.image(x, y, font);

        group.add(label);
        if (text) { font.text = text; }

        return {font: font, label: label};
    }
};

},{}],12:[function(require,module,exports){
'use strict';

const utils = require('./utils.js');

function VictoryCard(parentGroup) {
    // create a subgroup
    let game = parentGroup.game;
    this.group = parentGroup.add(game.add.group());
    this.group.visible = false;

    this.group.add(game.make.image(0, 0, 'card:small'));

    let titleLabel = utils.buildTextLabel(this.group, this.group.width / 2, 16,
        'Well done');
    titleLabel.label.anchor.setTo(0.5, 0);

    this.onClose = new Phaser.Signal();
    let okButton = this.group.add(game.make.button(
        this.group.width / 2, this.group.height -16, 'button:small',
        function () { this.onClose.dispatch(); }, this,
        0, 0, 0, 0));
    okButton.anchor.set(0.5, 1);
    let okLabel = utils.buildTextLabel(this.group, 0, -okButton.height / 2 + 2,
        'OK');
    okButton.addChild(okLabel.label);
    okLabel.label.anchor.setTo(0.5, 0.5);

    this.group.position.set(
        game.world.width / 2 - this.group.width / 2,
        game.world.height / 2 - this.group.height / 2
    );
}

VictoryCard.prototype.show = function () {
    this.group.parent.visible = true;
    this.group.visible = true;
};

VictoryCard.prototype.hide = function () {
    this.group.parent.visible = false;
    this.group.visible = false;
};


module.exports = VictoryCard;

},{"./utils.js":11}]},{},[6]);
