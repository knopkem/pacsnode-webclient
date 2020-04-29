/*jslint browser: true*/
/*global log, DicomLoader, DicomProcessor, ToolsContainer, Hashtable */

var pnw = pnw || {}; // global namespace

/**
 * Helper to store point coordinates
 * @constructor
 */
pnw.Point2D = function (x, y) {
    "use strict";
    this.x = 0;
    this.y = 0;

    if (x !== undefined && y !== undefined) {
        this.x = x;
        this.y = y;
    }
};


/**
 * The main dicom viewer object, this handles full frame images only
 * @constructor
 */
pnw.DicomViewer = function (canvas_id) {
    "use strict";

    // the main canvas
    this.viewerCanvasId = canvas_id;
    this.viewerCanvas = window.document.getElementById(canvas_id);
    this.viewerCtx = this.viewerCanvas.getContext("2d");

    // the image canvas
    this.imageCanvas = document.createElement('canvas');
    this.imageCtx = this.imageCanvas.getContext("2d");

    // json data will meta info
    this.patientData = null;

    // interaction
    this.interactionMode = 0;

    this.imageQuality = 'lossy';
    this.viewerWidth = this.viewerCanvas.width;
    this.viewerHeight = this.viewerCanvas.height;
    this.baseURL = '';
    this.currentSOP = "";

    // objects
    this.imageData = null;
    this.dicomObject = null;
    this.dicomLoader = new pnw.DicomLoader();
    this.dicomProcessor = new pnw.DicomProcessor();
    this.cacheMgr = null;
    this.toolsHash = new Hashtable();

    // bools
    this.imageLoaded = false;
    this.preview = true;

    this.wc = 0;
    this.ww = 0;
    this.customWL = false;

    // pinch zoom
    this.zooming = false;
    this.start0 = new pnw.Point2D();
    this.start1 = new pnw.Point2D();
    this.startDistanceBetweenFingers = 0;
    this.centerPointStart = new pnw.Point2D();
    this.percentageOfImageAtPinchPoint = new pnw.Point2D();

    this.currentContinuousZoom = 1.0;
    this.currentOffset = new pnw.Point2D();
    this.currentWidth = 512;
    this.currentHeight = 512;

    this.newContinuousZoom = this.currentContinuousZoom;
    this.newOffset = new pnw.Point2D();
    this.newHeight = 512;
    this.newWidth = 512;

    this.centerImage = false;
    this.lastTranslation = null;
    this.lastDelta = 0;
};

pnw.DicomViewer.prototype.onCanvasResize = function (width, height) {
    "use strict";
    var that = this;

    // store new viewport size
    this.viewerWidth = parseInt(width, 10);
    this.viewerHeight = parseInt(height, 10);

    setTimeout(() => {
        // scale viewer canvas
        that.viewerCanvas.width = that.viewerWidth;
        that.viewerCanvas.height = that.viewerHeight;
        that.redraw();
    }, 0);

};

pnw.DicomViewer.prototype.reset = function () {
    "use strict";
    this.zoomFactor = 1.0;
};

pnw.DicomViewer.prototype.setInteractionMode = function (mode) {
    "use strict";
    this.interactionMode = parseInt(mode, 10);
};

pnw.DicomViewer.prototype.createTool = function (toolId) {
    "use strict";

    var toolMgr = this.getToolsContainer(this.currentSOP);

    switch (toolId) {
    case 0:
        toolMgr.createDistanceTool(this.viewerCanvas.width, this.viewerCanvas.height, this.newOffset, this.newContinuousZoom);
        break;
    case 1:
        toolMgr.createAngleTool(this.viewerCanvas.width, this.viewerCanvas.height, this.newOffset, this.newContinuousZoom);
        break;
    case 2:
        toolMgr.createCobbAngleTool(this.viewerCanvas.width, this.viewerCanvas.height, this.newOffset, this.newContinuousZoom);
        break;
    case 3:
        toolMgr.createPointProbeTool(this.viewerCanvas.width, this.viewerCanvas.height, this.newOffset, this.newContinuousZoom);
        break;
    case 4:
        toolMgr.createRectRoiTool(this.viewerCanvas.width, this.viewerCanvas.height, this.newOffset, this.newContinuousZoom);
        break;
    case 5:
        toolMgr.createCircRoiTool(this.viewerCanvas.width, this.viewerCanvas.height, this.newOffset, this.newContinuousZoom);
        break;
    case 6:
        toolMgr.createTextAnnoTool(this.viewerCanvas.width, this.viewerCanvas.height, this.newOffset, this.newContinuousZoom);
        break;
    case 7:
        toolMgr.createShutterTool(this.viewerCanvas.width, this.viewerCanvas.height, this.newOffset, this.newContinuousZoom);
        break;
    default:
        log.warn('default not implemented');
        return;
    }

    this.setInteractionMode(4); // select
    this.redraw();
};

pnw.DicomViewer.prototype.preparePinch = function () {
    "use strict";
    var mwidth = this.currentWidth,
        mheight = this.currentHeight;

    this.currentContinuousZoom = this.newContinuousZoom;
    this.currentOffset.x = this.newOffset.x;
    this.currentOffset.y = this.newOffset.y;
    this.currentWidth = this.newWidth;
    this.currentHeight = this.newHeight;

    this.centerPointStart.x = ((this.start0.x + this.start1.x) / 2.0);
    this.centerPointStart.y = ((this.start0.y + this.start1.y) / 2.0);

    this.percentageOfImageAtPinchPoint.x = (this.centerPointStart.x - this.currentOffset.x) / mwidth;
    this.percentageOfImageAtPinchPoint.y = (this.centerPointStart.y - this.currentOffset.y) / mheight;
    this.startDistanceBetweenFingers = Math.sqrt(Math.pow((this.start1.x - this.start0.x), 2) + Math.pow((this.start1.y - this.start0.y), 2));
    this.zooming = true;
};

pnw.DicomViewer.prototype.isHandlingEvents = function () {
    "use strict";
    return this.getToolsContainer(this.currentSOP).isHandlingEvent();
};

pnw.DicomViewer.prototype.onDragStart = function (event) {
    "use strict";

    var toolsContainer = this.getToolsContainer(this.currentSOP);
    toolsContainer.hitTest(event, this.newOffset, this.newContinuousZoom);

    // check if toolsContainer should handle events
    if (toolsContainer.isHandlingEvent()) {
        toolsContainer.onDragStart(event, this.newOffset, this.newContinuousZoom);
        this.redraw();
        return;
    }

    // get touch coordinates
    if (event.gesture.touches.length === 1) {
        this.start0.x = event.gesture.touches[0].pageX;
        this.start0.y = event.gesture.touches[0].pageY;
    } else if (event.gesture.touches.length === 2) {
        this.start0.x = event.gesture.touches[0].pageX;
        this.start0.y = event.gesture.touches[0].pageY;
        this.start1.x = event.gesture.touches[1].pageX;
        this.start1.y = event.gesture.touches[1].pageY;
        this.preparePinch();
    } else {
        log.warn('invalid touch event');
        return;
    }

};

pnw.DicomViewer.prototype.onDrag = function (event) {
    "use strict";

    var delta = 0,
        end0 = new pnw.Point2D(),
        end1 = new pnw.Point2D(),
        endDistanceBetweenFingers = 0.0,
        pinchRatio = 1.0,
        centerPointEnd = new pnw.Point2D(),
        translateFromZooming = new pnw.Point2D(),
        translateFromTranslating = new pnw.Point2D(),
        translateTotal = new pnw.Point2D(),
        toolsContainer = this.getToolsContainer(this.currentSOP);

    // check if toolsContainer should handle events
    if (toolsContainer.isHandlingEvent()) {
        toolsContainer.onDrag(event, this.newOffset, this.newContinuousZoom);
        this.redraw();
        return;
    }

    // get touch coordinates
    if (event.gesture.touches.length === 1) {
        end0.x = event.gesture.touches[0].pageX;
        end0.y = event.gesture.touches[0].pageY;
        end1.x = this.start1.x;
        end1.y = this.start1.y;
    } else if (event.gesture.touches.length === 2) {

        // make sure that we got our start points
        if (!this.zooming) {
            this.start1.x = event.gesture.touches[1].pageX;
            this.start1.y = event.gesture.touches[1].pageY;
            this.preparePinch();
            return;
        }

        // Get the second touch point
        end0.x = event.gesture.touches[0].pageX;
        end0.y = event.gesture.touches[0].pageY;
        end1.x = event.gesture.touches[1].pageX;
        end1.y = event.gesture.touches[1].pageY;
    } else {
        log.warn('invalid touch event');
        return;
    }

    // Calculate translation
    translateFromTranslating.x = end0.x - this.start0.x;
    translateFromTranslating.y = end0.y - this.start0.y;

    // Check if there is a translation difference to the last update
    if (this.lastTranslation) {
        if (this.lastTranslation.x === translateFromTranslating.x && this.lastTranslation.y === translateFromTranslating.y) {
            return;
        }
        this.lastTranslation = translateFromTranslating;
    }

    // only process interaction events for 1 finger
    if (event.gesture.touches.length === 1) {

        switch (this.interactionMode) {
        case 0: // Stack
            return;
        case 1: // pan
            // Compute new offset
            this.newOffset.x = this.currentOffset.x + translateFromTranslating.x;
            this.newOffset.y = this.currentOffset.y + translateFromTranslating.y;
            this.drawImage();
            return;
        case 2: // zoom (one finger)
            delta = translateFromTranslating.y;
            this.zoomto(delta - this.lastDelta, this.start0.x, this.start0.y);
            this.lastDelta = delta;
            return;
        case 3: // WL
            this.start0.x = end0.x;
            this.start0.y = end0.y;
            this.wc = parseInt(this.wc + translateFromTranslating.x, 10);
            this.ww = parseInt(this.ww + translateFromTranslating.y, 10);
            this.customWL = true;
            // apply wl
            if (this.dicomObject) {
                this.imageData = this.dicomProcessor.getRenderData(this.dicomObject, this.wc, this.ww);
                this.drawImage();
            }
            return;
        case 4:
            return;
        default:
            log.warn('default not implemented');
            return;
        }
    } else if (this.zooming) {
        if (this.startDistanceBetweenFingers === 0) {
            log.warn('invalid distance of zero');
            return;
        }


        // Calculate current distance between points to get new-to-old pinch ratio and calc width and height
        endDistanceBetweenFingers = Math.sqrt(Math.pow((end1.x - end0.x), 2) + Math.pow((end1.y - end0.y), 2));

        if (this.endDistanceBetweenFingers === 0) {
            log.warn('invalid distance of zero');
            return;
        }
        pinchRatio = endDistanceBetweenFingers / this.startDistanceBetweenFingers;

        if (pinchRatio > 10 || pinchRatio < 0.1) {
            log.warn('invalid ratio');
            return;
        }

        this.newContinuousZoom = pinchRatio * this.currentContinuousZoom;
        this.newWidth = this.imageCanvas.width * this.newContinuousZoom;
        this.newHeight = this.imageCanvas.height * this.newContinuousZoom;

        // Get the point between the two touches, relative to upper-left corner of image
        centerPointEnd.x = ((end0.x + end1.x) / 2.0);
        centerPointEnd.y = ((end0.y + end1.y) / 2.0);

        // This is the translation due to pinch-zooming
        translateFromZooming.x = (this.currentWidth - this.newWidth) * this.percentageOfImageAtPinchPoint.x;
        translateFromZooming.y = (this.currentHeight - this.newHeight) * this.percentageOfImageAtPinchPoint.y;

        // And this is the translation due to translation of the centerpoint between the two fingers
        translateFromTranslating.x = centerPointEnd.x - this.centerPointStart.x;
        translateFromTranslating.y = centerPointEnd.y - this.centerPointStart.y;

        // Total translation is from two components: (1) changing height and width from zooming and (2) from the two fingers translating in unity
        translateTotal.x = translateFromZooming.x + translateFromTranslating.x;
        translateTotal.y = translateFromZooming.y + translateFromTranslating.y;

        // the new offset is the old/current one plus the total translation component
        this.newOffset.x = this.currentOffset.x + translateTotal.x;
        this.newOffset.y = this.currentOffset.y + translateTotal.y;

        this.drawImage();
    }
};

pnw.DicomViewer.prototype.onDragEnd = function (event) {
    "use strict";

    var toolsContainer = this.getToolsContainer(this.currentSOP);

    // check if toolsContainer should handle events
    if (toolsContainer.isHandlingEvent()) {
        toolsContainer.onDragEnd(event, this.newOffset, this.newContinuousZoom);
        this.redraw();
        return;
    }

    this.currentOffset.x = this.newOffset.x;
    this.currentOffset.y = this.newOffset.y;
    this.currentWidth = this.newWidth;
    this.currentHeight = this.newHeight;
    this.currentContinuousZoom = this.newContinuousZoom;
    this.zooming = false;
    this.lastTranslation = null;
    this.lastDelta = 0;
};

pnw.DicomViewer.prototype.zoomto = function (delta, x, y) {
    "use strict";
    var ratio = delta * this.newContinuousZoom / 100,
        worldPt = new pnw.Point2D(x, y);

    // calculate new offset;
    this.newOffset = pnw.MathHelper.world2Offset(worldPt, this.newOffset, this.newContinuousZoom, this.newContinuousZoom + ratio);
    this.newContinuousZoom = this.newContinuousZoom + ratio;

    this.currentOffset.x = this.newOffset.x;
    this.currentOffset.y = this.newOffset.y;
    this.currentWidth = this.newWidth;
    this.currentHeight = this.newHeight;
    this.currentContinuousZoom = this.newContinuousZoom;
    this.zooming = false;

    this.drawImage();
    this.currentContinuousZoom = this.newContinuousZoom;
};

pnw.DicomViewer.prototype.onMouseWheelMove = function (e, delta) {
    "use strict";
    this.zoomto(delta * 10, e.pageX, e.pageY);
};

pnw.DicomViewer.prototype.init = function (base, pData, cache) {
    "use strict";

    this.baseURL = base;
    this.patientData = pData;
    this.cacheMgr = cache;

    this.imageLoaded = false;
    this.preview = true;
    this.customWL = false;
    this.dicomObject = null;

};

pnw.DicomViewer.prototype.loadDicom = function (currentSOP) {
    "use strict";
    this.currentSOP = currentSOP;
    var that = this;

    function loadData(dicomObject) {

        if (!dicomObject) {
            log.warn('invalid dicomObject');
            return;
        }

        that.dicomObject = dicomObject;

        var header = dicomObject.getHeader(),
            rows = header.rows(),
            cols = header.cols(),
            wc = header.windowCenter(),
            ww = header.windowWidth(),
            proc = that.dicomProcessor,
            prom = null;

        // apply defaults only if not modified before
        if (!that.customWL) {
            that.wc = wc;
            that.ww = ww;
        }

        // the real canvas    
        that.viewerCtx.fillRect(0, 0, cols, rows);
        that.imageData = proc.getRenderData(dicomObject, that.wc, that.ww);

        // the fake canvas
        that.imageCanvas.width = cols;
        that.imageCanvas.height = rows;
        that.centerImage = true;

        if (dicomObject.getQuality() !== 100) {
            that.imageQuality = 'lossy';

            // loading data asynchronous via promise
            log.debug('loading full version');
            prom = that.dicomLoader.load(that.baseURL + that.currentSOP, 200, 100);

            // register a function to get called when the data is resolved
            prom.then(loadData);
        } else {
            that.imageQuality = 'lossless';
            // storing in cache manager
            //that.cacheMgr.add(that.currentSOP, dicomObject);
            window.pubsub.pub("sliceLoadStop", that.currentSOP);
        }

        that.drawImage();
    }

    // check cache 
    this.cacheMgr.get(currentSOP).then(dicomObject => {
        log.debug('cache hit', currentSOP);
        loadData(dicomObject);
    }, () => {

        window.pubsub.pub("sliceLoadStart", currentSOP);

        // loading data asynchronous via promise
        var dataPromise = that.dicomLoader.load(that.baseURL + that.currentSOP, 30, 50);

        // register a function to get called when the data is resolved
        dataPromise.then(loadData);
    });

};

pnw.DicomViewer.prototype.drawImage = function () {
    "use strict";
    this.imageCtx.putImageData(this.imageData, 0, 0);

    this.imageLoaded = true;
    this.redraw();
};

pnw.DicomViewer.prototype.redraw = function () {
    "use strict";

    if (this.currentSOP === "") {
        return;
    }

    var toolMgr = this.getToolsContainer(this.currentSOP),
        ratio = 1.0,
        offX = 0,
        offY = 0,
        width,
        height,
        shutter,
        rect,
        w1,
        w2,
        w,
        h,
        i;

    if (!this.viewerCtx) {
        log.error("context not available");
        return;
    }

    // draw black background
    this.viewerCtx.fillStyle = "rgb(0,0,0)";
    this.viewerCtx.fillRect(0, 0, this.viewerCanvas.width, this.viewerCanvas.height);

    if (this.centerImage && this.currentContinuousZoom === 1.0) {
        // compute ratio to fit screen
        if (this.viewerHeight > this.viewerWidth) {
            ratio = this.viewerWidth / this.imageCanvas.width;
        } else {
            ratio = this.viewerHeight / this.imageCanvas.height;
        }
        this.newContinuousZoom = this.newContinuousZoom * ratio;
        this.currentContinuousZoom = this.newContinuousZoom;
        this.newWidth = this.imageCanvas.width * this.newContinuousZoom;
        this.newHeight = this.imageCanvas.height * this.newContinuousZoom;
    }


    // the scaled properties
    width = this.imageCanvas.width * this.newContinuousZoom;
    height = this.imageCanvas.height * this.newContinuousZoom;

    // center image
    if (this.centerImage && (this.newOffset.x === 0) && (this.newOffset.y === 0)) {
        this.centerImage = false;
        offX = (this.viewerWidth - width) / 2;
        offY = (this.viewerHeight - height) / 2;
        this.newOffset.x += offX;
        this.newOffset.y += offY;
        this.currentOffset.x = this.newOffset.x;
        this.currentOffset.y = this.newOffset.y;
    }

    // round
    width = Math.ceil(width);
    height = Math.ceil(height);

    if (width < 1) {
        log.warn('width ', width);
        return;
    }

    if (height < 1) {
        log.warn('height ', height);
        return;
    }

    shutter = this.getToolsContainer(this.currentSOP).getShutter();

    if (shutter.length > 0) {
        this.viewerCtx.save();
        this.viewerCtx.beginPath();
        for (i = 0; i < shutter.length; i += 1) {
            rect = shutter[i].rect();
            w1 = pnw.MathHelper.image2World(rect.p1, this.newOffset, this.newContinuousZoom);
            w2 = pnw.MathHelper.image2World(rect.p2, this.newOffset, this.newContinuousZoom);
            w = w2.x - w1.x;
            h = w2.y - w1.y;
            this.viewerCtx.rect(w1.x, w1.y, w, h);
            this.viewerCtx.closePath();
        }
        this.viewerCtx.clip();
    }

    // draw on viewer, pan and scale
    this.viewerCtx.drawImage(this.imageCanvas, this.newOffset.x, this.newOffset.y, width, height);

    if (shutter.length > 0) {
        this.viewerCtx.restore();
    }

    // draw tools
    this.getToolsContainer(this.currentSOP).drawTools(this.dicomObject, this.viewerCtx, this.newOffset, this.newContinuousZoom);

    // draw overlay on top
    if (!toolMgr.isHandlingEvent()) {
        this.drawOverlay();
    }
};

pnw.DicomViewer.prototype.drawOverlay = function () {
    "use strict";
    if (this.patientData === 'undefined' || this.patientData === null) {
        return;
    }

    var offset = 20,
        left = offset,
        height = this.viewerCanvas.height,
        right = this.viewerCanvas.width - offset,
        center = this.viewerCanvas.width / 2,
        lineHeight = parseFloat(this.viewerCanvas.height / 25),
        fontSize = parseInt(lineHeight / 1.5, 10),
        tl1 = "",
        tl2 = "",
        tl3 = "",
        tc1 = "",
        tr1 = "",
        tr2 = "",
        tr3 = "",
        bl1 = "",
        bl2 = "",
        bl3 = "",
        bc1 = "",
        br1 = "",
        br2 = "";

    this.viewerCtx.font = fontSize + "pt Helvetica bold, sans-serif";
    this.viewerCtx.fillStyle = "White";
    this.viewerCtx.strokeStyle = "black";

    // top left
    this.viewerCtx.textAlign = 'left';
    tl1 = "Name: " + this.patientData.DCM_PatientName;
    this.viewerCtx.fillText(tl1, left, lineHeight);
    tl2 = "ID: " + this.patientData.DCM_PatientID;
    this.viewerCtx.fillText(tl2, left, 2 * lineHeight);
    tl3 = "Acc: " + this.patientData.DCM_AccessionNumber;
    this.viewerCtx.fillText(tl3, left, 3 * lineHeight);
    // show instance number
    if (this.dicomObject) {
        tc1 = "ImageNr: " + this.dicomObject.getHeader().dicomData.DCM_InstanceNumber;
        this.viewerCtx.fillText(tc1, left, 4 * lineHeight);
    }

    // top right
    this.viewerCtx.textAlign = 'right';
    tr1 = this.patientData.DCM_StudyDescription;
    this.viewerCtx.fillText(tr1, right, lineHeight);
    tr2 = this.patientData.DCM_SeriesDescription;
    this.viewerCtx.fillText(tr2, right, 2 * lineHeight);
    tr3 = "Ref: " + this.patientData.DCM_ReferringPhysicianName;
    this.viewerCtx.fillText(tr3, right, 3 * lineHeight);

    // bottom left
    this.viewerCtx.textAlign = 'left';
    if (this.imageQuality === 'lossless') {
        this.viewerCtx.fillStyle = "Green";
    } else {
        this.viewerCtx.fillStyle = "Red";
    }
    bc1 = "Quality: " + this.imageQuality;
    this.viewerCtx.fillText(bc1, left, height - (3 * lineHeight));
    this.viewerCtx.fillStyle = "White";
    bl2 = "SeriesDate: " + this.patientData.DCM_SeriesDate;
    this.viewerCtx.fillText(bl2, left, height - (2 * lineHeight));
    bl3 = "SeriesTime: " + this.patientData.DCM_SeriesTime;
    this.viewerCtx.fillText(bl3, left, height - (lineHeight));

    // bottom right
    this.viewerCtx.textAlign = 'right';
    bl1 = "W" + this.ww + " |  C" + this.wc;
    this.viewerCtx.fillText(bl1, right, height - (3 * lineHeight));
    br1 = "BodyPart: " + this.patientData.DCM_BodyPartExamined;
    this.viewerCtx.fillText(br1, right, height - (2 * lineHeight));
    br2 = "Position: " + this.patientData.DCM_PatientPosition;
    this.viewerCtx.fillText(br2, right, height - (lineHeight));
};

pnw.DicomViewer.prototype.getToolsContainer = function (sop) {
    "use strict";

    if (sop === undefined || sop === "") {
        log.warn("sopInstanceUID not given");
        return;
    }

    if (!this.toolsHash.containsKey(sop)) {
        this.toolsHash.put(sop, new pnw.ToolContainer());
    }

    return this.toolsHash.get(sop);

};
