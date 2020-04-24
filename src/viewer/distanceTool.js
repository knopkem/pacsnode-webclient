var pnw = pnw || {}; // global namespace

/*global log, Handle, Line*/

pnw.DistanceTool = function (center, offset, zoom) {
    "use strict";

    var origin = pnw.MathHelper.world2Image(center, offset, zoom);

    this.handle1 = new pnw.Handle(origin.x, origin.y / 2);
    this.handle2 = new pnw.Handle(origin.x - (origin.x / 2), origin.y + (origin.y / 2));
    this.line = new pnw.Line();
    this.label = new pnw.Label();
    this.activeElement = null;
    this.bodyHitPt = null;
};

pnw.DistanceTool.prototype.updatePosition = function (pt, offset, zoom) {
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

pnw.DistanceTool.prototype.draw = function (dicomObject, context, offset, zoom) {
    "use strict";

    if (dicomObject === undefined) {
        log.warn('no dicom object set, cannot draw');
        return;
    }

    if (dicomObject.getHeader() === undefined) {
        log.warn('no header set, cannot draw');
        return;
    }

    var pt1 = new pnw.Point2D(this.handle1.imagePt.x, this.handle1.imagePt.y),
        pt2 = new pnw.Point2D(this.handle2.imagePt.x, this.handle2.imagePt.y),
        spacing = dicomObject.getHeader().pixelSpacing(),
        length = 0;

    pt1.x *= spacing.x;
    pt1.y *= spacing.y;
    pt2.x *= spacing.x;
    pt2.y *= spacing.y;

    length = pnw.MathHelper.lineDistance(pt1, pt2);

    this.handle1.draw(context, offset, zoom);
    this.handle2.draw(context, offset, zoom);
    this.line.draw(context, this.handle1.imagePt, this.handle2.imagePt, offset, zoom);
    this.label.draw(context, this.handle2.imagePt, Math.round(length) + ' mm', offset, zoom);
};

pnw.DistanceTool.prototype.isHit = function (hitPt, offset, zoom) {
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

pnw.DistanceTool.prototype.reset = function () {
    "use strict";
    this.activeElement = null;
    this.bodyHitPt = null;
    this.handle1.resetModified();
    this.handle2.resetModified();
};
