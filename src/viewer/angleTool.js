var pnw = pnw || {}; // global namespace

/*global log, Handle, Line*/

pnw.AngleTool = function (center, offset, zoom) {
    "use strict";
    var origin = pnw.MathHelper.world2Image(center, offset, zoom);

    this.handle1 = new pnw.Handle(origin.x / 2, origin.y / 2);
    this.handle2 = new pnw.Handle(origin.x + (origin.x / 2), origin.y / 2);
    this.centerHandle = new pnw.Handle(origin.x, origin.y + (origin.y / 2));
    this.line1 = new pnw.Line();
    this.line2 = new pnw.Line();
    this.label = new pnw.Label();
    this.activeElement = null;
    this.bodyHitPt = null;
};

pnw.AngleTool.prototype.updatePosition = function (pt, offset, zoom) {
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
        this.centerHandle.translate(v, offset, zoom);
        this.bodyHitPt = pt;
    }
};

pnw.AngleTool.prototype.draw = function (dicomObject, context, offset, zoom) {
    "use strict";
    var angle = 0;

    this.handle1.draw(context, offset, zoom);
    this.handle2.draw(context, offset, zoom);
    this.centerHandle.draw(context, offset, zoom);
    this.line1.draw(context, this.handle1.imagePt, this.centerHandle.imagePt, offset, zoom);
    this.line2.draw(context, this.handle2.imagePt, this.centerHandle.imagePt, offset, zoom);

    angle = pnw.MathHelper.angleBetweenPoints(this.handle1.imagePt, this.handle2.imagePt, this.centerHandle.imagePt);
    this.label.draw(context, this.centerHandle.imagePt, Math.round(angle) + ' °', offset, zoom);

};

pnw.AngleTool.prototype.isHit = function (hitPt, offset, zoom) {
    "use strict";
    if (this.handle1.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.handle1;
        return true;
    }
    if (this.handle2.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.handle2;
        return true;
    }
    if (this.centerHandle.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.centerHandle;
        return true;
    }
    if (this.line1.isHit(hitPt, offset, zoom) || this.line2.isHit(hitPt, offset, zoom)) {
        this.bodyHitPt = hitPt;
        return true;
    }
    return false;
};

pnw.AngleTool.prototype.reset = function () {
    "use strict";
    this.activeElement = null;
    this.bodyHitPt = null;
    this.handle1.resetModified();
    this.handle2.resetModified();
    this.centerHandle.resetModified();
};
