'use strict';

const Planet = require('./planet.js');

// const TSIZE = 32;


var PlayScene = {
    create: function () {
        this.planetLayer = this.game.add.group();
        this.planetLayer.position.set(256, 256);
        this.planet = new Planet('MEDIUM', this.planetLayer);

        this.game.add.image(0, 0, 'mask:medium'); // TODO: adjust to planet size
    }
};

module.exports = PlayScene;
