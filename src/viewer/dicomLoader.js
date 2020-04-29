/*jslint browser: true*/
/*global XMLHttpRequest, log, ArrayBuffer, Int16Array, DicomHeader, DicomObject, Q */

var pnw = pnw || {}; // global namespace

/**
 * Loader that manages loading of a single slice containing of a header and an array, returns a dicomObject
 * @constructor
 */
pnw.DicomLoader = function () {
    "use strict";
    this.lastTimeout = 0;
    this.lastDeferred = null;
};

pnw.DicomLoader.prototype.load = function (filename, timeout, quality) {
    "use strict";
    var dfd = Q.defer(),
        that = this;

    if (this.lastTimeout !== 0 && this.lastDeferred !== null) {
        window.clearTimeout(this.lastTimeout);
        this.lastTimeout = 0;
        this.lastDeferred.reject();
    }

    this.lastTimeout = window.setTimeout(() => {
        that.loadHeader(filename, quality).then(dicomObject => {
            dfd.resolve(dicomObject);
        });
    }, timeout);

    this.lastDeferred = dfd;
    return dfd.promise;
};

pnw.DicomLoader.prototype.loadHeader = function (filename, quality) {
    "use strict";
    log.debug('load header');
    var modFilename = "/full" + filename + "&type=header",
        http_request = new XMLHttpRequest(),
        that = this,
        dfd = Q.defer();

    http_request.open("GET", modFilename, true);
    http_request.onreadystatechange = () => {
        var dicomHeader = null;
        if (http_request.readyState === 4) {

            if (http_request.status === 204) {
                log.debug('received progressing message');
                window.setTimeout(() => {
                    that.loadHeader(filename, quality).then(dicomObject => {
                        dfd.resolve(dicomObject);
                    });
                }, 500);
                return dfd.promise;
            } else if (http_request.status === 200) {
                log.debug('load header done');
                // create header from parsed json data
                dicomHeader = new pnw.DicomHeader(JSON.parse(http_request.responseText));

                // load buffer
                that.loadDicomData(dicomHeader, filename, quality).then(patientData => {
                    dfd.resolve(patientData);
                });
            }
        }
    };
    http_request.send(null);
    return dfd.promise;
};

// returns local promise with the full patient data (async)
pnw.DicomLoader.prototype.loadDicomData = function (dicomHeader, filename, quality) {
    "use strict";
    log.debug('load dicom data');

    var that = this,
        patientData = null,
        dfd = Q.defer();

    // async image loading
    Q.all(
        [that.loadImage(dicomHeader, filename, quality, 'a'),
            that.loadImage(dicomHeader, filename, quality, 'b')
        ]
    ).spread((dataA, dataB) => {
        log.debug('load dicom data done');

        // now create buffer using a webworker
        patientData = that.createBuffer(dicomHeader, dataA, dataB, quality);
        dfd.resolve(patientData);
    });
    return dfd.promise;
};

// returns local promise with the image data (async)
pnw.DicomLoader.prototype.loadImage = (dicomHeader, filename, quality, type) => {
    "use strict";
    var image = new Image(),
        modFilename = "/full" + filename + '&type=' + type + '&quality=' + quality,
        dfd = Q.defer(),
        dataout = null;

    log.debug('retrieving data', type);
    image.onload = () => {
        var imgcanvas = document.createElement('canvas'),
            imgctx = imgcanvas.getContext("2d"),
            w = dicomHeader.cols(),
            h = dicomHeader.rows();

        imgcanvas.width = w;
        imgcanvas.height = h;
        imgctx.drawImage(image, 0, 0, w, h);

        dataout = imgctx.getImageData(0, 0, w, h);
        dfd.resolve(dataout);
    };
    image.src = modFilename;

    return dfd.promise;
};

// creates dicom object (sync)
pnw.DicomLoader.prototype.createBuffer = (dicomHeader, dataina, datainb, quality) => {
    "use strict";

    // check if all conditions are set
    if (dataina === null) {
        log.error("invalid data buffer a");
        return;
    }
    if (datainb === null) {
        log.error("invalid data buffer b");
        return;
    }
    if (dicomHeader === null) {
        log.error("header not parsed");
        return;
    }
    log.debug('createBuffer');


    var pixel = 0,
        pixelIndex = 0,
        pixina = dataina.data,
        pixinb = datainb.data,
        minValue = 99999999,
        maxValue = 0,
        i = 0,
        dataout = new ArrayBuffer(dataina.data.length),
        bufferView = new Int16Array(dataout),
        dicomObject = null;


    // merge buffers
    for (i = 0; i < pixina.length; i += 4) {
        pixel = 256 * pixina[i] + pixinb[i];
        bufferView[pixelIndex] = pixel;
        maxValue = Math.max(maxValue, pixel);
        minValue = Math.min(minValue, pixel);
        pixelIndex += 1;
    }

    // create dicomObject
    return new pnw.DicomObject(dicomHeader, bufferView, minValue, maxValue, quality);
};
