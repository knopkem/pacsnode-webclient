var pnw = pnw || {}; // global namespace

/*global log*/

pnw.MathHelper = pnw.MathHelper || {}; // global namespace

pnw.MathHelper.lineDistance = (point1, point2) => {
    "use strict";
    var xs = 0,
        ys = 0;

    xs = point2.x - point1.x;
    xs = xs * xs;

    ys = point2.y - point1.y;
    ys = ys * ys;

    return Math.sqrt(xs + ys);
};

pnw.MathHelper.world2Image = (pt, offset, zoom) => {
    "use strict";

    if (pt === undefined || offset === undefined || zoom === undefined) {
        log.error('invalid input, cannot compute I2W');
        return;
    }

    var result = new pnw.Point2D();

    result.x = (pt.x - offset.x) / zoom;
    result.y = (pt.y - offset.y) / zoom;

    return result;
};

pnw.MathHelper.image2World = (pt, offset, zoom) => {
    "use strict";

    if (pt === undefined || offset === undefined || zoom === undefined) {
        log.error('invalid input, cannot compute I2W');
        return;
    }

    var result = new pnw.Point2D();

    result.x = offset.x + (pt.x * zoom);
    result.y = offset.y + (pt.y * zoom);

    return result;
};

pnw.MathHelper.world2Offset = (worldPt, offset, zoom, newZoom) => {
    'use strict';

    var result = new pnw.Point2D(),
        imagePt = pnw.MathHelper.world2Image(worldPt, offset, zoom);

    result.x = ((newZoom * imagePt.x) - worldPt.x) / -1;
    result.y = ((newZoom * imagePt.y) - worldPt.y) / -1;

    return result;
};

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
pnw.MathHelper.clamp = (value, min, max) => {
    "use strict";
    return Math.min(Math.max(value, min), max);
};

pnw.MathHelper.dotProduct = (pt1, pt2) => {
    "use strict";
    return pt1.x * pt2.x + pt1.y * pt2.y;
};

pnw.MathHelper.crossProduct = (pt1, pt2) => {
    "use strict";
    return pt1.x * pt2.y - pt1.y * pt2.x;
};

pnw.MathHelper.magnitude = (pt1, pt2) => {
    "use strict";
    return Math.sqrt(pnw.MathHelper.dotProduct(pt1, pt2));
};

pnw.MathHelper.angleBetweenPoints = (pt1, pt2, center) => {
    "use strict";
    var a = new pnw.Point2D(),
        b = new pnw.Point2D();

    a.x = pt1.x - center.x;
    a.y = pt1.y - center.y;

    b.x = pt2.x - center.x;
    b.y = pt2.y - center.y;

    return Math.abs(pnw.MathHelper.angle(a, b));
};

pnw.MathHelper.angle = (pt1, pt2) => {
    "use strict";
    var cross = pnw.MathHelper.crossProduct(pt1, pt2),
        dot = pnw.MathHelper.dotProduct(pt1, pt2);
    return Math.atan2(cross, dot) * 180 / Math.PI;
};

pnw.MathHelper.roundTo = (value, places) => {
    'use strict';
    var multiplier = Math.pow(10, places);

    return (Math.round(value * multiplier) / multiplier);
};

pnw.MathHelper.computeRoi = (hitObj, dicomObject) => {
    'use strict';

    function average(data) {
        var sum = data.reduce((sum, value) => {
            return sum + value;
        }, 0);

        return sum / data.length;
    }

    function standardDeviation(values, avg) {
        var squareDiffs = values.map(value => {
            var diff = value - avg,
                sqrDiff = diff * diff;
            return sqrDiff;
        });

        return Math.sqrt(average(squareDiffs));
    }




    var points = 0,
        u = 0,
        v = 0,
        maxValue = 0,
        minValue = 99999,
        pixel = 0,
        result = {},
        sum = 0,
        pixelsInside = 0,
        data = [];

    // iterate image data and virtual canvas and count value
    for (u = 0; u < dicomObject.header.rows(); u += 1) {
        for (v = 0; v < dicomObject.header.cols(); v += 1) {
            if (hitObj.isHit(v, u)) {
                pixel = dicomObject.imageData[points] * dicomObject.header.slope() + dicomObject.header.intercept();
                sum += pixel;
                data[pixelsInside] = pixel;
                pixelsInside += 1;
                maxValue = Math.max(maxValue, pixel);
                minValue = Math.min(minValue, pixel);
            }
            points += 1;
        }
    }

    result.min = minValue;
    result.max = maxValue;
    result.mean = sum / pixelsInside;
    result.stdDev = standardDeviation(data, result.mean);
    result.area = pixelsInside;
    return result;

};
