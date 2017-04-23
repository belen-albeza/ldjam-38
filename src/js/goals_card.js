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
    goals.forEach(this._spawnGoalUI, this);

    this.goals = goals;
}

GoalsCard.prototype.updateGoals = function(goals) {
    this.goals = goals;
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
    this.goalLabels = [];

    if (goal.type === 'block') {
        ui.create(0, 0, 'icon:tileset', TILES[goal.blockType]);
        this.goalLabels.push(utils.buildTextLabel(
            ui, 40, 6, '' + goal.target));
        ui.position.set(16, (index + 1) * 36 + 16);
    }

    this.goalGroup.add(ui);
};

module.exports = GoalsCard;
