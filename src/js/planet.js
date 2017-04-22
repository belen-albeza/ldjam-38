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
    let layer = this.map.create('main', this.radius, this.radius, Planet.TSIZE,
        Planet.TSIZE, group);
    layer.anchor.setTo(0.5);
    this._updateMapFromData();
}

Planet.SIZES = {
    TINY: 6,
    MEDIUM: 10
};

Planet.TSIZE = 32;

Planet.prototype.prettyPrint = function () {
    let txt = '';
    for (let row = 0; row < this.radius; row++) {
        txt += this.data
            .slice(row * this.radius, row * this.radius + this.radius)
            .reduce(function (res, x) { return res + x; }, '');
        txt += row === this.radius - 1 ? '' : '\n';
    }
};

Planet.prototype._buildInitialData = function(radius, mask) {
    let data = new Array(radius * radius);
    for (let i = 0; i < data.length; i++) {
        data[i] = REVERSE_BIOMAS[mask[i]] || null;
    }
    return data;
};

Planet.prototype._updateMapFromData = function() {
    for (let row = 0; row < this.radius; row++) {
        for (let col = 0; col < this.radius; col++) {
            let bioma = this.data[row * this.radius + col];
            let tileIndex = null;

            switch (bioma) {
            case 'DEAD':
                tileIndex = TILESET.DEAD;
                break;
            }

            this.map.putTile(tileIndex, col, row);
        }
    }
};

Planet.prototype.get = function(col, row) {
    return this.data[row * this.radius + col];
};

Planet.prototype.set = function(col, row, value) {
    this.data[row * this.radius + col] = value;
};

module.exports = Planet;
