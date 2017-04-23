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

    this.game.add.tween(globe).to({y: globe.y + 4}, 1600, Phaser.Easing.InOut,
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
