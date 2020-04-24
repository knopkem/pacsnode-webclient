var pnw = pnw || {}; // global namespace

/*global log*/

pnw.Label = function () {
    "use strict";
    this.context = null;
    this.pt1 = null;
    this.text = '';
    this.offset = null;
    this.zoom = null;
};

pnw.Label.prototype.draw = function (context, pt1, text, offset, zoom) {
    "use strict";

    this.context = context;
    this.pt1 = pt1;
    this.text = text;
    this.offset = offset;
    this.zoom = zoom;

    this.render();
};

pnw.Label.prototype.render = function () {
    'use strict';

    var w1 = pnw.MathHelper.image2World(this.pt1, this.offset, this.zoom),
        fontSize = 10,
        textArray = this.text.split('\n'),
        i = 0;

    w1.x += 40;

    this.context.font = fontSize + "pt Helvetica bold, sans-serif";
    this.context.fillStyle = pnw.Constants.toolColor;
    this.context.strokeStyle = "black";
    this.context.textAlign = "start";
    for (i = 0; i < textArray.length; i += 1) {
        this.context.fillText(textArray[i], w1.x, w1.y + (15 * i));
    }
};
