'use strict';

module.exports = {
    buildTextLabel: function (group, x, y, text) {
        let font = group.game.add.retroFont('font', 16, 24,
            Phaser.RetroFont.TEXT_SET6);
        let label = group.game.make.image(x, y, font);

        group.add(label);
        if (text) { font.text = text; }

        return {font: font, label: label};
    }
};
