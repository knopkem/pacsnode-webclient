var pnw = pnw || {}; // global namespace

/**
 * Represents a dicom file, contains of a header, the image buffer and some custom properties
 * @constructor
 * @param {object} dicomHeader - The header object.
 * @param {array} imageData - The image buffer, a typed array.
 * @param {number} minPixValue - the minimum pixel value found in the imageData.
 * @param {number} maxPixValue - the maximum pixel value found in the imageData.
 * @param {number} quality - the quality parameter indicates lossless (100) vs lossly (1<100) image quality.
 */
pnw.DicomObject = function (dicomHeader, imageData, minPixValue, maxPixValue, quality) {
    "use strict";
    this.header = dicomHeader;
    this.imageData = imageData;
    this.header.setMinPixelValue(minPixValue);
    this.header.setMaxPixelValue(maxPixValue);
    this.q = quality;
};

pnw.DicomObject.prototype.getHeader = function () {
    "use strict";
    return this.header;
};

pnw.DicomObject.prototype.getImageData = function () {
    "use strict";
    return this.imageData;
};

pnw.DicomObject.prototype.getQuality = function () {
    "use strict";
    return this.q;
};
