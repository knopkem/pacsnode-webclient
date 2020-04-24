var pnw = pnw || {}; // global namespace

/*global log, Handle, Line*/

pnw.RectangularRoiTool = function (center, offset, zoom) {
    "use strict";
    var origin = pnw.MathHelper.world2Image(center, offset, zoom);

    this.handle1 = new pnw.Handle(origin.x / 2, origin.y / 2);
    this.handle2 = new pnw.Handle(origin.x + (origin.x / 2), origin.y + (origin.y / 2));
    this.rectangle = new pnw.Rectangle();
    this.activeElement = null;
    this.label = new pnw.Label();
    this.invisibleCanvas = window.document.createElement('canvas');
    this.dicomObject = null;
    this.timeoutHandle = null;
    this.bodyHitPt = null;
};

pnw.RectangularRoiTool.prototype.updatePosition = function (pt, offset, zoom) {
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

pnw.RectangularRoiTool.prototype.draw = function (dicomObject, context, offset, zoom) {
    "use strict";

    var that = this;

    this.handle1.draw(context, offset, zoom);
    this.handle2.draw(context, offset, zoom);
    this.rectangle.draw(context, this.handle1.imagePt, this.handle2.imagePt, offset, zoom);

    // print result
    this.dicomObject = dicomObject;

    if (this.handle1.isModified() || this.handle2.isModified()) {

        // the calculation needs to be done delayed to not block the gui
        that.label.draw(context, this.handle2.imagePt, '', offset, zoom);
        window.clearTimeout(this.timeoutHandle);
        this.timeoutHandle = window.setTimeout(function () {

            var roi = null,
                text = '';

            roi = that.rectangle.computeRoi(that.dicomObject, that.handle1.imagePt, that.handle2.imagePt);
            text = 'min: ' + pnw.MathHelper.roundTo(roi.min, 2) + '\nmax: ';
            text += pnw.MathHelper.roundTo(roi.max, 2);
            text += '\nmean: ' + pnw.MathHelper.roundTo(roi.mean, 2);
            text += '\nstd. dev: ' + pnw.MathHelper.roundTo(roi.stdDev, 2);
            text += '\narea: ' + pnw.MathHelper.roundTo(roi.area, 2);

            // print result
            that.label.draw(context, that.handle2.imagePt, text, offset, zoom);
            that.handle2.resetModified();
            that.handle1.resetModified();


        }, 100);
    } else {
        this.label.draw(context, this.handle2.imagePt, this.label.text, offset, zoom);
    }
};

pnw.RectangularRoiTool.prototype.isHit = function (hitPt, offset, zoom) {
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


pnw.RectangularRoiTool.prototype.reset = function () {
    "use strict";
    this.activeElement = null;
    this.bodyHitPt = null;
    this.handle1.resetModified();
    this.handle2.resetModified();
};
