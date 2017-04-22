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

const DESERT_MAX_WATER = 10;
const SOIL_NO_VEG_MAX_WATER = 20;
const MAX_WATER = 100;

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
        if (self.get(col - 1, row) === 'WATER') { cell.water++; }
        if (self.get(col + 1, row) === 'WATER') { cell.water++; }
        if (self.get(col, row + 1) === 'WATER') { cell.water++; }
        if (self.get(col, row - 1) === 'WATER') { cell.water++; }

        cell.water = Math.min(cell.water, MAX_WATER);
    }

    for (let col = 0; col < this.radius; col++) {
        for (let row = 0; row < this.radius; row++) {
            let cell = this.data[row * this.radius + col];
            if (cell.bioma === null) { continue; }

            if (isEarth(cell.bioma)) {
                updateWaterLevel(cell, col, row);
                // shift from desert to soil when humid enough
                if (cell.bioma === 'DESERT' && cell.water >= DESERT_MAX_WATER) {
                    cell.shiftTo = 'SOIL';
                }
                else if (cell.bioma === 'SOIL') {
                    let upper = this.get(col, row - 1, true);
                    if (upper.bioma === 'EMPTY' && cell.water >= SOIL_NO_VEG_MAX_WATER) {
                        upper.shiftTo = 'PLANTS';
                    }
                }
            }
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
        return null;
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
        return isEarth(this.get(col, row + 1));
    default:
        return true;
    }
};

Planet.prototype._applyPlacementEffects = function (col, row) {
    let bioma = this.get(col, row);
    if (bioma === 'WATER') {
        if (isVegetation(this.get(col, row - 1))) {
            this.set(col, row - 1, 'EMPTY');
        }
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
