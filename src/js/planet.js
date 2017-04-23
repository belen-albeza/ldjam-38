'use strict';

let bioData = require('./bioma_const.js');
const BIOMAS = bioData.BIOMAS;
const TILESET = bioData.MAPPINGS;
const REVERSE_BIOMAS = Object.keys(BIOMAS).reduce(function (res, key) {
    res[BIOMAS[key]] = key;
    return res;
}, {});

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
