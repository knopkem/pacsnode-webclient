var pnw = pnw || {}; // global namespace

/*global log*/

/**
 * Wrapper around the parsed dicom json data returned from server. Adds helper methods to get common prpperties
 * @constructor
 * @param {json} dicomData - The json data.
 */
pnw.DicomHeader = function (dicomData) {
    "use strict";
    this.dicomData = dicomData;
    this.minPx = 0;
    this.maxPx = 0;
};

pnw.DicomHeader.prototype.slope = function () {
    "use strict";
    var slope = parseFloat(this.dicomData.DCM_RescaleSlope);

    if (isNaN(slope) || slope === 0 || slope === 'undefined') {
        slope = 1.0;
    }
    return slope;
};

pnw.DicomHeader.prototype.intercept = function () {
    "use strict";
    var intercept = parseInt(this.dicomData.DCM_RescaleIntercept, 10);

    if (isNaN(intercept)) {
        intercept = 0;
    }

    return intercept;
};

pnw.DicomHeader.prototype.windowWidth = function () {
    "use strict";
    var ww = parseInt(this.dicomData.DCM_WindowWidth, 10);

    if (isNaN(ww)) {
        ww = 4096;
    }

    return ww;
};

pnw.DicomHeader.prototype.windowCenter = function () {
    "use strict";
    var wc = parseInt(this.dicomData.DCM_WindowCenter, 10);

    if (isNaN(wc)) {
        wc = 2048;
    }

    return wc;
};

pnw.DicomHeader.prototype.cols = function () {
    "use strict";
    var cols = parseInt(this.dicomData.DCM_Columns, 10);

    if (isNaN(cols)) {
        cols = 512;
    }
    return cols;
};

pnw.DicomHeader.prototype.rows = function () {
    "use strict";
    var rows = parseInt(this.dicomData.DCM_Rows, 10);

    if (isNaN(rows)) {
        rows = 512;
    }
    return rows;
};

pnw.DicomHeader.prototype.invert = function () {
    "use strict";
    return (this.dicomData.DCM_PhotoMetricInterpretation === "MONOCHROME1");
};

pnw.DicomHeader.prototype.setMinPixelValue = function (value) {
    "use strict";
    this.minPx = value;
};

pnw.DicomHeader.prototype.minPixelValue = function () {
    "use strict";
    return this.minPx;
};

pnw.DicomHeader.prototype.setMaxPixelValue = function (value) {
    "use strict";
    this.maxPx = value;
};

pnw.DicomHeader.prototype.maxPixelValue = function () {
    "use strict";
    return this.maxPx;
};

pnw.DicomHeader.prototype.pixelSpacing = function () {
    "use strict";
    var result = new pnw.Point2D(),
        spacing = this.dicomData.DCM_PixelSpacing.split("/");

    if (spacing.length === 1) {
        result.x = parseFloat(spacing[0]);
        result.y = result.x;
    } else if (spacing.length === 2) {
        result.x = parseFloat(spacing[0]);
        result.y = parseFloat(spacing[1]);
    } else {
        log.war("Failed parsing pixelspacing, assuming 1.0", spacing);
        result.x = 1.0;
        result.y = 1.0;
    }
    return result;
};
