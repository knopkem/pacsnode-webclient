var pnw = pnw || {}; // global namespace

/*global log*/

pnw.Line = function () {
    "use strict";
    this.imagePt1 = new pnw.Point2D();
    this.imagePt2 = new pnw.Point2D();
};

pnw.Line.prototype.init = function (pt1, pt2) {
    'use strict';
    this.imagePt1 = pt1;
    this.imagePt2 = pt2;
};

pnw.Line.prototype.draw = function (context, pt1, pt2, offset, zoom) {
    "use strict";
    this.imagePt1 = pt1;
    this.imagePt2 = pt2;

    var w1 = pnw.MathHelper.image2World(pt1, offset, zoom),
        w2 = pnw.MathHelper.image2World(pt2, offset, zoom);

    context.setLineDash([]);
    context.strokeStyle = pnw.Constants.toolColor;
    context.lineWidth = 1;

    context.beginPath();
    context.moveTo(w1.x, w1.y);
    context.lineTo(w2.x, w2.y);
    context.stroke();
    context.closePath();
};

pnw.Line.prototype.isHit = function (pt, offset, zoom) {
    "use strict";

    if (pt === undefined || offset === undefined || zoom === undefined) {
        log.error('invalid input');
        return false;
    }

    var hitPt = pnw.MathHelper.world2Image(pt, offset, zoom);

    function sqr(x) {
        return x * x;
    }

    function dist2(v, w) {
        return sqr(v.x - w.x) + sqr(v.y - w.y);
    }

    function distToSegmentSquared(p, v, w) {
        var l2 = dist2(v, w),
            t = 0;

        if (l2 === 0) {
            return dist2(p, v);
        }

        t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        if (t < 0) {
            return dist2(p, v);
        }

        if (t > 1) {
            return dist2(p, w);
        }

        return dist2(p, {
            x: v.x + t * (w.x - v.x),
            y: v.y + t * (w.y - v.y)
        });
    }

    function distToSegment(p, v, w) {
        return Math.sqrt(distToSegmentSquared(p, v, w));
    }
    return (distToSegment(hitPt, this.imagePt1, this.imagePt2) <= pnw.Constants.handleSize / zoom);
};
