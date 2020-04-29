var pnw = pnw || {}; // global namespace

/*global log*/

pnw.Rectangle = () => {
    "use strict";
};

pnw.Rectangle.prototype.draw = (context, pt1, pt2, offset, zoom) => {
    "use strict";

    var w1 = pnw.MathHelper.image2World(pt1, offset, zoom),
        w2 = pnw.MathHelper.image2World(pt2, offset, zoom),
        width = w2.x - w1.x,
        height = w2.y - w1.y;

    context.setLineDash([]);
    context.strokeStyle = pnw.Constants.toolColor;
    context.lineWidth = 1;

    context.beginPath();
    context.rect(w1.x, w1.y, width, height);
    context.stroke();
    context.closePath();
};

pnw.Rectangle.prototype.createHitObj = (pt1, pt2) => {
    'use strict';
    var hitObj = {
        Xmin: pt1.x,
        Ymin: pt1.y,
        Xmax: pt2.x,
        Ymax: pt2.y,
        isHit: function (x, y) {
            return !((x > this.Xmax) || (x < this.Xmin) || (y > this.Ymax) || (y < this.Ymin));
        },
        init: function () {
            if (pt1.x > pt2.x) {
                this.Xmin = pt2.x;
                this.Xmax = pt1.x;
            }
            if (pt1.y > pt2.y) {
                this.Ymin = pt2.y;
                this.Ymax = pt1.y;
            }
        }
    };

    hitObj.init();
    return hitObj;
};

pnw.Rectangle.prototype.computeRoi = function (dicomObject, pt1, pt2) {
    'use strict';
    var hitObj = this.createHitObj(pt1, pt2);
    return pnw.MathHelper.computeRoi(hitObj, dicomObject);
};

pnw.Rectangle.prototype.isBodyHit = (hitPt, offset, zoom, handle1, handle2) => {
    'use strict';
    var p1 = new pnw.Point2D(handle1.imagePt.x, handle1.imagePt.y),
        p2 = new pnw.Point2D(handle2.imagePt.x, handle1.imagePt.y),
        p3 = new pnw.Point2D(handle2.imagePt.x, handle2.imagePt.y),
        p4 = new pnw.Point2D(handle1.imagePt.x, handle2.imagePt.y),
        l1 = new pnw.Line(),
        l2 = new pnw.Line(),
        l3 = new pnw.Line(),
        l4 = new pnw.Line();

    l1.init(p1, p2);
    l2.init(p2, p3);
    l3.init(p3, p4);
    l4.init(p4, p1);

    return (l1.isHit(hitPt, offset, zoom) || l2.isHit(hitPt, offset, zoom) || l3.isHit(hitPt, offset, zoom) || l4.isHit(hitPt, offset, zoom));
};
