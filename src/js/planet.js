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

const SIZE = 10;
const T_SIZE = 32;

function Planet(group) {
    this.group = group;
    this.game = group.game;

    this.data = this._buildInitialData(MASKS.FREESTYLE);

    // create sky
    this.sky = this.group.create(0, 0, 'sky:medium'); // TODO: adjust to SIZE
    this.sky.anchor.setTo(0.5);

    // create tile map
    this.map = this.game.add.tilemap(null, T_SIZE, T_SIZE, SIZE, SIZE);
    this.map.addTilesetImage('bioma', 'tileset');
    this.mapLayer = this.map.create('main', SIZE, SIZE, T_SIZE, T_SIZE,
        group);
    this.mapLayer.anchor.setTo(0.5);
    this._updateMapFromData();
}

Planet.T_SIZE = T_SIZE;
Planet.SIZE = SIZE;


Planet.prototype.update = function () {
    this._updateMapFromData();
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

Planet.prototype._tickCell = function (cell, col, row) {
    let upper = this.get(col, row - 1, true);

    // soil, desert
    if (isEarth(cell.bioma)) {
        this._tickWaterLevel(cell, col, row);

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
    return {
        bioma: bioma,
        water: 0,
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
            }

            this.map.putTile(tileIndex, col, row);
        }
    }
};
/*jshint +W074 */

module.exports = Planet;
