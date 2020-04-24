/*jslint browser: true*/
/*global LookupTable, log */

var pnw = pnw || {}; // global namespace

/**
 * Helper object to process a given dicomObject using window and level, uses a lookuptable inside
 * @constructor
 */
pnw.DicomProcessor = function () {
    "use strict";
    this.lookup = new pnw.LookupTable();
};

pnw.DicomProcessor.prototype.getRenderData = function (dicomObject, wc, ww) {
    "use strict";
    log.debug('processBuffer');
    var header = dicomObject.getHeader(),
        imageData = dicomObject.getImageData(),
        canvas = document.createElement('canvas'),
        ctx = canvas.getContext("2d"),
        n = 0,
        yPix = 0,
        xPix = 0,
        offset = 0,
        pxValue = 0,
        table = this.lookup.ylookup,
        renderData = 0,
        rows = header.rows(),
        cols = header.cols();

    this.lookup.setData(wc, ww, header.slope(), header.intercept());
    this.lookup.calculateHULookup(header.minPixelValue(), header.maxPixelValue());
    this.lookup.calculateLookup(header.minPixelValue(), header.maxPixelValue());

    // fill the canvas    
    canvas.width = cols;
    canvas.height = rows;
    renderData = ctx.createImageData(canvas.width, canvas.height);

    for (yPix = 0; yPix < rows; yPix += 1) {
        for (xPix = 0; xPix < cols; xPix += 1) {
            offset = (yPix * cols + xPix) * 4;
            pxValue = parseInt(table[imageData[n]], 10);

            if (header.invert()) {
                pxValue = 256 - pxValue;
            }

            renderData.data[offset] = pxValue;
            renderData.data[offset + 1] = pxValue;
            renderData.data[offset + 2] = pxValue;
            renderData.data[offset + 3] = 0xFF;
            n += 1;
        }
    }
    return renderData;
};
