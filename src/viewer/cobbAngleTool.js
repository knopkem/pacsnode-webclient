var pnw = pnw || {}; // global namespace

/*global log, Handle, Line*/

pnw.CobbAngleTool = function (center, offset, zoom) {
    "use strict";
    var origin = pnw.MathHelper.world2Image(center, offset, zoom);

    this.handle1 = new pnw.Handle(origin.x / 2, origin.y / 2);
    this.handle2 = new pnw.Handle(origin.x + (origin.x / 2), origin.y / 2);
    this.handle3 = new pnw.Handle(origin.x / 2, origin.y + (origin.y / 2));
    this.handle4 = new pnw.Handle(origin.x + (origin.x / 2), origin.y + (origin.y / 2));
    this.line1 = new pnw.Line();
    this.line2 = new pnw.Line();
    this.line3 = new pnw.Line();
    this.label = new pnw.Label();

    this.activeElement = null;
    this.bodyHitPt = null;
};

pnw.CobbAngleTool.prototype.updatePosition = function (pt, offset, zoom) {
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
        this.handle3.translate(v, offset, zoom);
        this.handle4.translate(v, offset, zoom);
        this.bodyHitPt = pt;
    }
};

pnw.CobbAngleTool.prototype.draw = function (dicomObject, context, offset, zoom) {
    "use strict";
    this.handle1.draw(context, offset, zoom);
    this.handle2.draw(context, offset, zoom);
    this.handle3.draw(context, offset, zoom);
    this.handle4.draw(context, offset, zoom);

    this.line1.draw(context, this.handle1.imagePt, this.handle2.imagePt, offset, zoom);
    this.line2.draw(context, this.handle3.imagePt, this.handle4.imagePt, offset, zoom);
    var center1 = new pnw.Point2D(),
        center2 = new pnw.Point2D(),
        mid = new pnw.Point2D(),
        angle = 0,
        vec1 = new pnw.Point2D(),
        vec2 = new pnw.Point2D();

    center1.x = (this.handle1.imagePt.x + this.handle2.imagePt.x) / 2;
    center1.y = (this.handle1.imagePt.y + this.handle2.imagePt.y) / 2;
    center2.x = (this.handle3.imagePt.x + this.handle4.imagePt.x) / 2;
    center2.y = (this.handle3.imagePt.y + this.handle4.imagePt.y) / 2;
    mid.x = (center1.x + center2.x) / 2;
    mid.y = (center1.y + center2.y) / 2;

    vec1.x = (this.handle1.imagePt.y - this.handle2.imagePt.y) * -1;
    vec1.y = this.handle1.imagePt.x - this.handle2.imagePt.x;

    vec2.x = (this.handle3.imagePt.y - this.handle4.imagePt.y) * -1;
    vec2.y = this.handle3.imagePt.x - this.handle4.imagePt.x;

    angle = pnw.MathHelper.angle(vec1, vec2);

    this.line3.draw(context, center1, center2, offset, zoom);
    this.label.draw(context, mid, 'cobb angle: ' + Math.round(angle) + ' °', offset, zoom);
};

pnw.CobbAngleTool.prototype.isHit = function (hitPt, offset, zoom) {
    "use strict";
    if (this.handle1.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.handle1;
        return true;
    }
    if (this.handle2.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.handle2;
        return true;
    }
    if (this.handle3.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.handle3;
        return true;
    }
    if (this.handle4.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.handle4;
        return true;
    }
    if (this.line1.isHit(hitPt, offset, zoom) || this.line2.isHit(hitPt, offset, zoom) || this.line3.isHit(hitPt, offset, zoom)) {
        this.bodyHitPt = hitPt;
        return true;
    }
    return false;
};

pnw.CobbAngleTool.prototype.reset = function () {
    "use strict";
    this.activeElement = null;
    this.bodyHitPt = null;
    this.handle1.resetModified();
    this.handle2.resetModified();
    this.handle3.resetModified();
    this.handle4.resetModified();
};
