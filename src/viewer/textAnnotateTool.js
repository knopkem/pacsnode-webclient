var pnw = pnw || {}; // global namespace

/*global log, Handle, Line*/

pnw.TextAnnotateTool = function (description, center, offset, zoom) {
    "use strict";
    var origin = pnw.MathHelper.world2Image(center, offset, zoom);

    this.handle1 = new pnw.Handle(origin.x, origin.y / 2);
    this.handle2 = new pnw.Handle(origin.x, origin.y + (origin.y / 2));
    this.line = new pnw.Line();
    this.label = new pnw.Label();
    this.activeElement = null;
    this.description = description;
    this.bodyHitPt = null;
};

pnw.TextAnnotateTool.prototype.updatePosition = function (pt, offset, zoom) {
    "use strict";
    if (this.activeElement) {
        this.activeElement.updatePosition(pt, offset, zoom);
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

pnw.TextAnnotateTool.prototype.draw = function (dicomObject, context, offset, zoom) {
    "use strict";
    this.handle1.draw(context, offset, zoom);
    this.handle2.draw(context, offset, zoom);
    this.line.draw(context, this.handle1.imagePt, this.handle2.imagePt, offset, zoom);
    this.label.draw(context, this.handle2.imagePt, this.description, offset, zoom);
};

pnw.TextAnnotateTool.prototype.isHit = function (hitPt, offset, zoom) {
    "use strict";
    if (this.handle1.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.handle1;
        return true;
    }
    if (this.handle2.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.handle2;
        return true;
    }
    if (this.line.isHit(hitPt, offset, zoom)) {
        this.bodyHitPt = hitPt;
        return true;
    }
    return false;
};

pnw.TextAnnotateTool.prototype.reset = function () {
    "use strict";
    this.activeElement = null;
    this.bodyHitPt = null;
    this.handle1.resetModified();
    this.handle2.resetModified();
};
