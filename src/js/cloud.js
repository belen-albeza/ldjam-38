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
