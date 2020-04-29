 // import DicomViewer, Hammer, $, log, Preloader, CacheManager
 // todo: remove jquery and hammer dependencies

/**
 * This is the main entry point for integration the viewer into an application
 * The controller manages multiple specialized viewers and manages slice stacks
 * Viewers only handle single images, while the task of the controller is to operate on a stack of objects
 * @constructor
 */
class ViewMaster {
    constructor(viewer_id, overlay_id) {
        this.viewer_id = viewer_id;
        this.viewerCanvas = window.document.getElementById(viewer_id);
        this.overlayCanvas = window.document.getElementById(overlay_id);
        this.singleViewer = new pnw.DicomViewer(viewer_id);
        this.viewer = this.singleViewer;
        this.cache = new pnw.CacheManager();
        this.slider = new pnw.Slider(overlay_id);

        // open cache database
        this.cache.init();

        // helper
        this.interactionMode = 0;
        this.currentSliderPos = 0;
        this.sopInstances = {};
        this.sliderPosTemp = 0;
        this.lastSOP = '';
        this.lastPosY = 0;
        this.preloaderTimeout = 0;

        /*
            var that = this;
            this.preloader = new pnw.Preloader(this.cache, function (percentage, remaining) {
                that.drawPreloadingLabel(percentage, remaining);
            });

            // prepare handlers
            this.prepare();

            window.pubsub.sub("sliceLoadStart", function (e) {
                if (that.preloader.isRunning()) {
                    that.preloader.stop();
                }
            });

            window.pubsub.sub("sliceLoadStop", function (e) {
                log.debug('slice loading finished', e);
                if (!that.preloader.isRunning()) {
                    log.debug("slice loading finished, restarting preloader");
                    if (that.preloaderTimeout !== 0) {
                        window.clearTimeout(that.preloaderTimeout);
                        that.preloaderTimeout = 0;
                    }
                    that.preloaderTimeout = setTimeout(function () {
                        that.preloader.start(e);
                    }, 500);
                }
            });
        */
    },
    reset() {
        this.interactionMode = 0;
        this.currentSliderPos = 0;
        this.sopInstances = {};
        this.sliderPosTemp = 0;
        this.lastPosY = 0;
        this.sliderTimeout = 0;
        this.preloaderTimeout = 0;
    },
    prepare() {
    /*
    var that = this,
        hammertime = new Hammer(this.overlayCanvas, {
            drag_min_distance: 1,
            drag_horizontal: true,
            drag_vertical: true,
            transform: true,
            hold: false,
            prevent_default: true,
            drag_max_touches: 2
        });

    hammertime.on("dragstart", function (ev) {

        that.sliderPosTemp = that.currentSliderPos;
        that.lastPosY = ev.gesture.center.pageY;

        that.viewer.onDragStart(ev);
    });

    hammertime.on("drag", function (ev) {

        // change of slice only when draging with 1 finger
        if ((ev.gesture.touches.length === 1) && (that.viewer.isHandlingEvents() === false) && (that.viewer.interactionMode === 0)) {

            var sliceCount = that.sopInstances.length,
                delta = 0,
                diffY = 0,
                deltaSliderPos = 0,
                currentSOP = "",
                //curPosX = ev.gesture.center.pageX,
                curPosY = ev.gesture.center.pageY;

            // compute difference
            diffY = (that.lastPosY - curPosY) * (-1);

            // handle stacking here
            if (that.interactionMode === 0) {
                // not the best solution but so far helps with series that have only a few slices
                if (sliceCount < 10) {
                    sliceCount = 10;
                }
                // slicing
                delta = parseInt(sliceCount / that.viewerCanvas.height * diffY, 10);
                if (delta !== 0) {
                    deltaSliderPos = parseInt(that.sliderPosTemp + delta, 10);
                    deltaSliderPos = pnw.MathHelper.clamp(deltaSliderPos, 0, that.sopInstances.length - 1);
                    currentSOP = that.getCurrentSOP(deltaSliderPos);
                }
                if ((that.lastSOP !== currentSOP) && (currentSOP !== '')) {
                    // now load a new image
                    that.viewer.loadDicom(currentSOP);
                    that.drawSlider(deltaSliderPos);
                    that.lastSOP = currentSOP;
                }
                return;
            }
                }

                // forward to viewer
                that.viewer.onDrag(ev);
            });

            hammertime.on("dragend", function (ev) {
                that.viewer.onDragEnd(ev);
            });

            // mouseweel plugin
            $(this.overlayCanvas).bind("mousewheel.TileViewerer", function (e, delta) {
                that.viewer.onMouseWheelMove(e, delta);
            });

            */
        },
    onResize(width, height) {
        this.viewer.onCanvasResize(width, height);
        this.overlayCanvas.width = width;
        this.overlayCanvas.height = height;

        this.slider.draw();
    },
    init(base, studyUid, seriesUid) {

        var that = this,
            pData = null,
            currentSOP = "";

        if (studyUid === null || studyUid === '' || seriesUid === null || seriesUid === '') {
            log.warning('init failed, invalid input' + studyUid + seriesUid);
            return;
        }

        // reset all variables
        this.reset();

         // TODO replace with fetch api
        /*
        $.ajax({
                url: "/queryStudyAndSeriesInfo",
                dataType: "json",
                data: {
                    stdUID: studyUid,
                    serUID: seriesUid
                }
            })
            .then(function (response) {
                $.each(response, function (i, val) {
                    pData = val;
                });
                that.sopInstances = pData.LocalInstances.split("#");
                that.currentSliderPos = parseInt(that.sopInstances.length / 2, 10);
                that.getViewer(pData.DCM_Modality);
                that.viewer.init(base, pData, that.cache);
                that.preloader.init(base, that.sopInstances);
                currentSOP = that.getCurrentSOP(that.currentSliderPos);
                // load the first image
                that.viewer.setInteractionMode(that.interactionMode);
                that.viewer.loadDicom(currentSOP);
                if (that.sopInstances.length > 1) {
                    that.drawSlider(that.currentSliderPos);
                }
                // make sure to resize
                that.viewer.onCanvasResize(that.viewerCanvas.width, that.viewerCanvas.height);
            });
          */
    },
    drawSlider(sliderPos) {
        this.slider.setSliderPosition(0, this.sopInstances.length - 1, sliderPos);
    },
    drawPreloadingLabel(percentage, remaining) {
        this.slider.setLabel(percentage, remaining);
    },
    setInteractionMode(mode) {
        this.interactionMode = mode;
        this.viewer.setInteractionMode(mode);
    },
    createTool(toolId) {
        
        this.viewer.createTool(toolId);
    },
    getCurrentSOP(position) {
        
        var parsedPos = pnw.MathHelper.clamp(parseInt(position, 10), 0, this.sopInstances.length - 1);
        this.currentSliderPos = parsedPos;
        return this.sopInstances[parsedPos];
    },
    getViewer(modality) {
        
        this.viewer = null;
        this.viewer = new pnw.DicomViewer(this.viewer_id);
        this.interactionMode = 0; // force stack mode
        return this.viewer;
    },
    stringContains(input, substring) {
        return (input.search(substring) !== -1) ? true : false;
    }
}
