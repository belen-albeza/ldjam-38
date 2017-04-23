'use strict';

const utils = require('./utils.js');

function VictoryCard(parentGroup) {
    // create a subgroup
    let game = parentGroup.game;
    this.group = parentGroup.add(game.add.group());
    this.group.visible = false;

    this.group.add(game.make.image(0, 0, 'card:small'));

    let titleLabel = utils.buildTextLabel(this.group, this.group.width / 2, 16,
        'Victory!');
    titleLabel.label.anchor.setTo(0.5, 0);

    this.onClose = new Phaser.Signal();
    let okButton = this.group.add(game.make.button(
        this.group.width / 2, this.group.height -16, 'button:small',
        function () { this.onClose.dispatch(); }, this,
        this.onClose.dispatch, null,
        0, 0, 0, 0));
    okButton.anchor.set(0.5, 1);
    let okLabel = utils.buildTextLabel(this.group, 0, -okButton.height / 2 + 4,
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
