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
        this.game.load.spritesheet('icon:tileset', 'images/biomas_tileset.png',
            32, 32);
        this.game.load.spritesheet('palette', 'images/bioma_palette.png',
            32, 32);
        this.game.load.spritesheet('icon:stats', 'images/icon_stats.png',
            16, 24);
        this.game.load.spritesheet('icon:misc', 'images/icon_misc.png', 32, 32);
        // images
        this.game.load.image('mask:tiny', 'images/mask_tiny.png');
        this.game.load.image('mask:medium', 'images/mask_medium.png');
        this.game.load.image('sky:tiny', 'images/blue_sky_tiny.png');
        this.game.load.image('sky:medium', 'images/blue_sky_medium.png');
        this.game.load.image('card:small', 'images/card_small.png');
        this.game.load.image('card:medium', 'images/card_medium.png');
        this.game.load.image('bg:modal', 'images/modal_bg.png');
        this.game.load.image('button:small', 'images/button_small.png');
        this.game.load.image('button:icon', 'images/button_icon.png');
        this.game.load.image('button:medium', 'images/button_medium.png');
        this.game.load.image('globe', 'images/globe.png');
    },

    create: function () {
        this.game.state.start('title');
        // // TODO: disable this
        // this.game.state.start('play', true, false, -1);
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
