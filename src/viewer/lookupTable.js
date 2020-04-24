/*global ArrayBuffer, Float32Array, Int32Array */

var pnw = pnw || {}; // global namespace

/**
 * Lookup table to apply window and level to a dataset taking slope and intercept into account
 * @constructor
 */
pnw.LookupTable = function () {
    "use strict";
    this.huLookup = [];
    this.ylookup = [];

    this.rescaleSlope = 1.0;
    this.rescaleIntercept = 0;
    this.windowCenter = 0;
    this.windowWidth = 0;
    this.lastSlope = -1;
    this.lastIntercept = -1;
    this.lastCenter = -1;
    this.lastWidth = -1;
    this.lastMin = 0;
    this.lastMax = 0;
};

pnw.LookupTable.prototype.setData = function (wc, ww, rs, ri) {
    "use strict";
    this.windowCenter = parseInt(wc, 10);
    this.windowWidth = parseInt(ww, 10);
    this.rescaleSlope = rs;
    this.rescaleIntercept = ri;
};

pnw.LookupTable.prototype.calculateHULookup = function (minRange, maxRange) {
    "use strict";

    if ((this.lastSlope === this.rescaleSlope) && (this.lastIntercept === this.rescaleIntercept) && (this.lastMin === minRange) && (this.lastMax === maxRange)) {
        return;
    }
    var inputValue = 0,
        value = 0;
    for (inputValue = minRange; inputValue <= maxRange; inputValue += 1) {
        value = parseFloat(inputValue * this.rescaleSlope + this.rescaleIntercept, 10);
        this.huLookup[inputValue] = value;
    }
    this.lastSlope = this.rescaleSlope;
    this.lastIntercept = this.rescaleIntercept;
};

pnw.LookupTable.prototype.calculateLookup = function (minRange, maxRange) {
    "use strict";
    if ((this.lastCenter === this.windowCenter) && (this.lastWidth === this.windowWidth) && (this.lastMin === minRange) && (this.lastMax === maxRange)) {
        return;
    }

    var xMin = this.windowCenter - 0.5 - (this.windowWidth - 1) / 2,
        xMax = this.windowCenter - 0.5 + (this.windowWidth - 1) / 2,
        yMax = 255,
        yMin = 0,
        inputValue = 0,
        y = 0;

    for (inputValue = minRange; inputValue <= maxRange; inputValue += 1) {
        if (this.huLookup[inputValue] <= xMin) {
            this.ylookup[inputValue] = yMin;
        } else if (this.huLookup[inputValue] > xMax) {
            this.ylookup[inputValue] = yMax;
        } else {
            y = ((this.huLookup[inputValue] - (this.windowCenter - 0.5)) / (this.windowWidth - 1) + 0.5) * (yMax - yMin) + yMin;
            this.ylookup[inputValue] = parseInt(y, 10);
        }
    }
    this.lastCenter = this.windowCenter;
    this.lastWidth = this.windowWidth;
    this.lastMin = minRange;
    this.lastMax = maxRange;
};
