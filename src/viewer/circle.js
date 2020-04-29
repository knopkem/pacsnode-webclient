var pnw = pnw || {}; // global namespace

/*global log*/

pnw.Circle = () => {
    "use strict";
};

pnw.Circle.prototype.draw = (context, pt1, pt2, offset, zoom) => {
    "use strict";

    var w1 = pnw.MathHelper.image2World(pt1, offset, zoom),
        w2 = pnw.MathHelper.image2World(pt2, offset, zoom),
        radius = pnw.MathHelper.lineDistance(w1, w2) / 2,
        center = new pnw.Point2D();

    center.x = (w2.x + w1.x) / 2;
    center.y = (w2.y + w1.y) / 2;

    context.setLineDash([]);
    context.strokeStyle = pnw.Constants.toolColor;
    context.lineWidth = 1;

    context.beginPath();
    context.arc(center.x, center.y, radius, 0, 2 * Math.PI, false);
    context.stroke();
    context.closePath();
};

pnw.Circle.prototype.computeRoi = (dicomObject, pt1, pt2) => {
    'use strict';

    var hitObj = {
        center: new pnw.Point2D(),
        radius: pnw.MathHelper.lineDistance(pt1, pt2) / 2,
        isHit: function (u, v) {
            var dx = u - this.center.x,
                dy = v - this.center.y;

            return (dx * dx + dy * dy < this.radius * this.radius);
        },
        init: function () {
            this.center.x = (pt2.x + pt1.x) / 2;
            this.center.y = (pt2.y + pt1.y) / 2;
        }
    };

    hitObj.init();
    return pnw.MathHelper.computeRoi(hitObj, dicomObject);
};

pnw.Circle.circleHitTest = (center, radius, hitPt) => {
    'use strict';
    var dx = hitPt.x - center.x,
        dy = hitPt.y - center.y;

    return (dx * dx + dy * dy < radius * radius);
};
