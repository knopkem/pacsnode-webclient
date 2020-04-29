/*jslint browser: true*/
/*global log, DicomLoader */

var pnw = pnw || {}; // global namespace

/**
 * Preloader for background data retrieval
 * The preloader uses the cacheMgr to check if preloading is necessary then fetches the data
 * It also stores the result in the cache
 * @constructor
 */
pnw.Preloader = function (cacheMgr, cb) {
    "use strict";

    this.callback = cb;
    this.cacheMgr = cacheMgr;
    this.worklist = [];
    this.allInstances = [];
    this.baseURL = "";
    this.loader = new pnw.DicomLoader();
    this.running = false;
    this.timeArr = [];
};

pnw.Preloader.prototype.median = values => {
    "use strict";
    values.sort((a, b) => {
        return a - b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];
    else
        return (values[half - 1] + values[half]) / 2.0;
};

pnw.Preloader.prototype.mean = values => {
    "use strict";
    var sum = 0,
        i = 0;
    for (i = 0; i < values.length; i++) {
        sum += parseInt(values[i], 10); //don't forget to add the base
    }

    return parseInt(sum / values.length, 10);
};

pnw.Preloader.prototype.init = function (baseURL, sopInstances) {
    "use strict";
    this.running = false;
    this.timeArr = [];
    this.baseURL = baseURL;
    this.allInstances = sopInstances;
    this.worklist = sopInstances.slice(0);
};

pnw.Preloader.prototype.sortWorklist = function (sopInstance) {
    "use strict";

    if (sopInstance === undefined) {
        log.error('invalid input');
        return;
    }

    // get the index in the original list
    var index = this.allInstances.indexOf(sopInstance);
    if (index < 0) {
        log.error('sorting failed, instance not found in array', sopInstance);
        return;
    }

    // create 2 arrays top and bottom
    var top = this.allInstances.slice(0, index),
        bottom = this.allInstances.slice(index),
        sortedArray = [];

    // check that the sizes are still correct
    if ((top.length + bottom.length) !== this.allInstances.length) {
        log.error('initializing sorting failed, array sizes differ', top.length + bottom.length, this.allInstances.length);
        return;
    }


    // now cycle through both and try to find them in the current worklist
    while ((top.length > 0) || (bottom.length > 0)) {
        if (top.length > 0) {
            var sliceTop = top.pop();
            if (this.worklist.indexOf(sliceTop) !== -1) {
                //log.debug('adding from top', sliceTop);
                sortedArray.push(sliceTop);
            }
        }
        if (bottom.length > 0) {
            var sliceBottom = bottom.shift();
            if (this.worklist.indexOf(sliceBottom) !== -1) {
                //log.debug('adding from bottom', sliceBottom);
                sortedArray.push(sliceBottom);
            }
        }
    }
    if (this.worklist.length !== sortedArray.length) {
        log.error('creating sorted array failed, array sizes differ', this.worklist.length, sortedArray.length);
        return;
    }
    this.worklist = sortedArray;
};

pnw.Preloader.prototype.start = function (sopInstance) {
    "use strict";
    if (this.running) {
        log.warn("preloader already running");
        return;
    }
    log.debug('starting preloader');
    this.running = true;
    this.sortWorklist(sopInstance);
    this.nextSlice();
};

pnw.Preloader.prototype.stop = function () {
    "use strict";
    log.debug('stopping preloader');
    this.running = false;
};

pnw.Preloader.prototype.nextSlice = function () {
    "use strict";
    log.debug("next slice");

    var that = this,
        startTime = 0;

    if (!this.running) {
        return;
    }

    if (this.worklist.length === 0) {
        log.debug("no more slices");
        this.running = false;
        return;
    }

    var nextSliceUid = this.worklist.shift(),
        prom = null;

    if (nextSliceUid === undefined) {
        log.warn("slice is undefined");
        this.running = false;
        return;
    }
    startTime = new Date().getTime();

    // check if the data is already stored
    this.cacheMgr.contains(nextSliceUid).then(() => {
        sliceDone(null);
    }, () => {

        log.debug('loading next slice', nextSliceUid);
        prom = that.loader.load(that.baseURL + nextSliceUid, 10, 100);

        prom.then(sliceDone, () => {
            log.error('failed loading data for', that.baseURL + nextSliceUid);
            that.nextSlice();
        });

    });

    function sliceDone(patientData) {
        var percentage = "",
            t = parseInt(that.allInstances.length, 10),
            c = parseInt(that.worklist.length, 10),
            endTime = new Date().getTime();


        // estimate time
        that.timeArr[that.timeArr.length] = (endTime - startTime);
        var timePerSlice = that.median(that.timeArr);
        var remaining = parseInt((timePerSlice * c) / 1000, 10);
        log.debug('time remaining', endTime - startTime, timePerSlice, c, remaining);
        percentage = remaining;
        percentage = parseInt((t - c) * 100 / t, 10);
        // update callback with percentage
        that.callback(percentage, remaining);

        if (patientData) {
            // store in cache
            try {
                that.cacheMgr.add(nextSliceUid, patientData).then(() => {
                    log.debug('data saved');
                }, () => {
                    log.error('failed to add data');
                    that.running = false;
                });
            } catch (err) {
                log.error(err);
            }
        }
        that.nextSlice();
    }
};

pnw.Preloader.prototype.isRunning = function () {
    "use strict";
    return this.running;
};
