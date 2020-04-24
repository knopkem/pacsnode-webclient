var pnw = pnw || {}; // global namespace

/*global log*/

pnw.Handle = function (x, y) {
    "use strict";
    this.imagePt = new pnw.Point2D();
    this.imagePt.x = x;
    this.imagePt.y = y;
    this.radius = pnw.Constants.handleSize;
    this.modified = true;
    this.hitOffset = new pnw.Point2D();
};

pnw.Handle.prototype.isHit = function (pt, offset, zoom) {
    "use strict";

    if (pt === undefined || offset === undefined || zoom === undefined) {
        log.error('invalid input');
        return false;
    }

    var hitPt = pt,
        worldPt = pnw.MathHelper.image2World(this.imagePt, offset, zoom),
        imgHitPt = pnw.MathHelper.world2Image(pt, offset, zoom),
        dx = hitPt.x - worldPt.x,
        dy = hitPt.y - worldPt.y,
        result = false;

    //a "hit" will be registered if the distance away from the center is less than the radius of the circular object
    result = (dx * dx + dy * dy <= this.radius * this.radius);

    if (result) {
        this.hitOffset.x = this.imagePt.x - imgHitPt.x;
        this.hitOffset.y = this.imagePt.y - imgHitPt.y;
    }
    return result;
};

pnw.Handle.prototype.translate = function (translationVector, offset, zoom) {
    'use strict';
    var w1 = pnw.MathHelper.image2World(this.imagePt, offset, zoom);
    w1.x += translationVector.x;
    w1.y += translationVector.y;
    this.updatePosition(w1, offset, zoom);
};

pnw.Handle.prototype.updatePosition = function (pt, offset, zoom) {
    "use strict";

    if (pt === undefined || offset === undefined || zoom === undefined) {
        log.error('invalid input, cannot update position');
        return;
    }

    this.imagePt = pnw.MathHelper.world2Image(pt, offset, zoom);
    this.imagePt.x += this.hitOffset.x;
    this.imagePt.y += this.hitOffset.y;
    this.modified = true;
};

pnw.Handle.prototype.draw = function (context, offset, zoom) {
    "use strict";

    if (offset === undefined || zoom === undefined) {
        log.error('invalid input, cannot draw handle');
        return;
    }

    var worldPt = pnw.MathHelper.image2World(this.imagePt, offset, zoom);

    //! fallback if not supported
    if (!context.setLineDash) {
        context.setLineDash = function () {};
    }


    // inner
    context.strokeStyle = pnw.Constants.toolColor;
    context.setLineDash([]);
    context.lineWidth = 1;
    context.beginPath();
    context.arc(worldPt.x, worldPt.y, this.radius / 3, 0, 2 * Math.PI, false);
    context.stroke();
    context.closePath();

    // outer
    context.strokeStyle = 'white';
    context.setLineDash([5, 3]);
    context.lineWidth = 1;
    context.beginPath();
    context.arc(worldPt.x, worldPt.y, this.radius, 0, 2 * Math.PI, false);
    context.stroke();
    context.closePath();
};

pnw.Handle.prototype.isModified = function () {
    'use strict';
    return this.modified;
};

pnw.Handle.prototype.resetModified = function () {
    'use strict';
    this.modified = false;
    this.hitOffset.x = 0;
    this.hitOffset.y = 0;
};
