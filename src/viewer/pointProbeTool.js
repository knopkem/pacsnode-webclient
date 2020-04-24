var pnw = pnw || {}; // global namespace

/*global log, Handle, Line*/

pnw.PointProbeTool = function (center, offset, zoom) {
    "use strict";
    var origin = pnw.MathHelper.world2Image(center, offset, zoom);

    this.handle1 = new pnw.Handle(origin.x, origin.y);
    this.label = new pnw.Label();
    this.activeElement = null;
};

pnw.PointProbeTool.prototype.updatePosition = function (pt, offset, zoom) {
    "use strict";
    if (this.activeElement) {
        this.activeElement.updatePosition(pt, offset, zoom);
    }
};

pnw.PointProbeTool.prototype.draw = function (dicomObject, context, offset, zoom) {
    "use strict";

    var text = '',
        pixel = 0,
        x = 0,
        y = 0;

    this.handle1.draw(context, offset, zoom);

    if (this.handle1.isModified()) {
        x = parseInt(this.handle1.imagePt.x, 10);
        y = parseInt(this.handle1.imagePt.y, 10);
        pixel = x + y * dicomObject.getHeader().cols();
        if ((pixel > 0) && (pixel < dicomObject.imageData.length)) {
            text = text = 'Value (' + x.toString() + ', ' + y.toString() + '): ' + (dicomObject.imageData[pixel] * dicomObject.header.slope() + dicomObject.header.intercept()).toString();
            this.label.draw(context, this.handle1.imagePt, text, offset, zoom);
        } else {
            this.label.draw(context, this.handle1.imagePt, 'out of range: ' + pixel.toString() + " | " + dicomObject.imageData.length.toString(), offset, zoom);
        }
        this.handle1.resetModified();
    } else {
        this.label.draw(context, this.handle1.imagePt, this.label.text, offset, zoom);
    }
};

pnw.PointProbeTool.prototype.isHit = function (hitPt, offset, zoom) {
    "use strict";
    if (this.handle1.isHit(hitPt, offset, zoom)) {
        this.activeElement = this.handle1;
        return true;
    }
    return false;
};

pnw.PointProbeTool.prototype.reset = function () {
    "use strict";
    this.activeElement = null;
};
