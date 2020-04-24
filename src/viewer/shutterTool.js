var pnw = pnw || {}; // global namespace

/*global log, Handle, Line*/

pnw.ShutterTool = function (center, offset, zoom) {
    "use strict";

    var origin = pnw.MathHelper.world2Image(center, offset, zoom);

    this.handle1 = new pnw.Handle(origin.x / 2, origin.y / 2);
    this.handle2 = new pnw.Handle(origin.x + (origin.x / 2), origin.y + (origin.y / 2));
    this.rectangle = new pnw.Rectangle();
    this.activeElement = null;
    this.bodyHitPt = null;
};

pnw.ShutterTool.prototype.updatePosition = function (pt, offset, zoom) {
    "use strict";
    if (this.activeElement) {
        this.activeElement.updatePosition(pt, offset, zoom);
        return;
    }
    if (this.bodyHitPt) {
        var v = new pnw.Point2D();

        // translation vector between last bodyHit
        v.x = pt.x - this.bodyHitPt.x;
        v.y = pt.y - this.bodyHitPt.y;

        // tranlate all handles
        this.handle1.translate(v, offset, zoom);
        this.handle2.translate(v, offset, zoom);
        this.bodyHitPt = pt;
    }
};

pnw.ShutterTool.prototype.draw = function (dicomObject, context, offset, zoom) {
    "use strict";
    this.handle1.draw(context, offset, zoom);
    this.handle2.draw(context, offset, zoom);
    this.rectangle.draw(context, this.handle1.imagePt, this.handle2.imagePt, offset, zoom);
};

pnw.ShutterTool.prototype.isHit = function (hitPt, offset, zoom) {
    "use strict";
    if (this.handle1.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.handle1;
        return true;
    }
    if (this.handle2.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.handle2;
        return true;
    }
    if (this.rectangle.isBodyHit(hitPt, offset, zoom, this.handle1, this.handle2)) {
        this.bodyHitPt = hitPt;
        return true;
    }
    return false;
};

pnw.ShutterTool.prototype.reset = function () {
    "use strict";
    this.activeElement = null;
    this.bodyHitPt = null;
    this.handle1.resetModified();
    this.handle2.resetModified();
};

pnw.ShutterTool.prototype.rect = function () {
    "use strict";
    var rect = {
        p1: this.handle1.imagePt,
        p2: this.handle2.imagePt
    };
    return rect;
};
