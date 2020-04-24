/*jslint browser: true*/
/*global log,$, Image, layer, Tile, TileShare, PngLoader */
/**
 *  DicomImage contains of a buffer and header data
 */
function DicomImage(that, cb) {
    "use strict";
    this.parent = that;
    this.callback = cb;
    this.singleton = new TileShare();
    this.pngLoader = new PngLoader(this, this.processBuffer, this.singleton.lookup);
}

DicomImage.prototype.processBuffer = function (that) {
    "use strict";
    //forward to caller
    var ref = that;

    setTimeout(function () {
        ref.callback.call(ref, ref.parent);
    }, 100);
};

DicomImage.prototype.load = function (url) {
    "use strict";
    this.pngLoader.cancel();
    this.pngLoader.load(url, true);
};

DicomImage.prototype.image = function () {
    "use strict";
    return this.pngLoader.canvas;
};


/**
 *  The TileViewer loads tiles and provides functionality (WL, pan etc.)
 */
function TileViewer(canvas_id) {
    "use strict";

    this.master = null;
    this.canvas = window.document.getElementById(canvas_id);

    this.options = {
        src: "",
        width: 1024, //canvas width - not image width
        height: 1024, //canvas height - not image height
        zoom_sensitivity: 32,
        maximum_pixelsize: 1, //set this to >1 if you want to let user to zoom image after reaching its original resolution
    };

    this.pan = {
        //pan destination
        xdest: null, //(pixel pos)
        ydest: null, //(pixel pos)
        leveldest: null
    };

    this.needdraw = false; //flag used to request for frame redraw 
    this.xnow = null;
    this.ynow = null;

    // reset singleton
    var share = new TileShare();
    share.lookup.header = undefined;

    // touch event handing helpers
    this.lastDelta = 0;
    this.ignoreEvent = false;

    this.pData = null;
    this.baseUrl = "";
    this.interactionMode = 0;
}

TileViewer.prototype.setInteractionMode = function (mode) {
    "use strict";
    this.interactionMode = mode;
};

TileViewer.prototype.init = function (base, pData) {
    "use strict";
    this.baseUrl = base;
    this.pData = pData;
};

TileViewer.prototype.loadDicom = function (currentSop) {
    "use strict";

    var srcUrl = "/tile/" + this.baseUrl + currentSop + "&static=",
        that = this;

    if (this.baseUrl === "") {
        log.warn('invalid base url given');
        return;
    }

    // add master layer
    this.addlayer({
        id: "master",
        src: srcUrl,
        enable: true
    });

    //redraw thread - read http://ejohn.org/blog/how-javascript-timers-work/
    setInterval(function () {
        if (that.pan.xdest) {
            that.pan();
        }
        if (that.needdraw) {
            that.draw();
        }
    }, 16);

};

TileViewer.prototype.onCanvasResize = function (w, h) {
    "use strict";
    this.options.width = w;
    this.options.height = h;

    // first attempt to center the image in the view
    var layer = this.master;
    layer.xpos = (w - (layer.xtilenum * layer.tilesize_xlast)) / 2;
    layer.ypos = (h - (layer.ytilenum * layer.tilesize_ylast)) / 2;
    this.needdraw = true;
    log.debug('tile viewer on resize ' + w + ' | ' + h);
};

TileViewer.prototype.onDragStart = function (ev) {
    "use strict";
    var offset = $(this.canvas).offset(),
        x = ev.gesture.center.pageX - offset.left,
        y = ev.gesture.center.pageY - offset.top,
        layer = this.master;

    this.pan.xdest = null; //cancel pan
    this.pan.xhot = x - layer.xpos;
    this.pan.yhot = y - layer.ypos;
    this.ignoreEvent = false;
};

TileViewer.prototype.onDrag = function (ev) {
    "use strict";
    var that = this,
        offset = $(that.canvas).offset(),
        x = ev.gesture.center.pageX - offset.left,
        y = ev.gesture.center.pageY - offset.top,
        delta = ev.gesture.deltaY * -1 * 2,
        x1,
        x2,
        y1,
        y2;

    that.xnow = x;
    that.ynow = y;

    // pinch hack
    if (ev.gesture.touches.length === 2) {
        that.ignoreEvent = true;
        // http://jsfromhell.com/math/line-length
        x1 = ev.gesture.touches[0].pageX - offset.left;
        y1 = ev.gesture.touches[0].pageY - offset.top;
        x2 = ev.gesture.touches[1].pageX - offset.left;
        y2 = ev.gesture.touches[1].pageY - offset.top;
        delta = Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
        //delta = Math.abs(x1 - x2);
        if (that.lastDelta === 0) {
            that.lastDelta = delta;
            return;
        }
        if (delta < that.lastDelta) {
            that.lastDelta = delta;
            delta *= -1;
        } else {
            that.lastDelta = delta;
        }
        that.pan.xdest = null; //cancel pan
        delta = delta * that.options.zoom_sensitivity;
        that.change_zoom(delta * 0.003, ev.gesture.center.pageX - offset.left, ev.gesture.center.pageY - offset.top);
        that.needdraw = true;
    } else {
        if (that.ignoreEvent) {
            return;
        }
        switch (that.interactionMode) {
        case 0: // stacking
            break;
        case 1: // WL
            log.warn('WL not implemented yet');
            break;
        case 2: // zoom
            that.pan.xdest = null; //cancel pan
            delta = delta * that.options.zoom_sensitivity;
            that.change_zoom(delta * 0.003, ev.gesture.center.pageX - offset.left, ev.gesture.center.pageY - offset.top);
            that.needdraw = true;
            break;
        case 3: // pan
            that.master.xpos = x - that.pan.xhot;
            that.master.ypos = y - that.pan.yhot;
            that.needdraw = true;
            break;
        default:
            log.warn("interaction not implemented: " + that.interactionMode);
            break;
        }
    }
};

TileViewer.prototype.onDragEnd = function (e) {
    "use strict";
};

TileViewer.prototype.onMouseWheelMove = function (e, delta) {
    "use strict";
    this.pan.xdest = null; //cancel pan
    delta = delta * this.options.zoom_sensitivity;
    var offset = $(this.canvas).offset();
    this.change_zoom(delta, e.pageX - offset.left, e.pageY - offset.top);
    this.needdraw = true;

};

TileViewer.prototype.draw = function () {
    "use strict";
    if (this.master === null) {
        return;
    }

    this.needdraw = false;
    var ctx = this.canvas.getContext("2d");
    this.canvas.width = this.options.width; //clear canvas
    this.canvas.height = this.options.height; //clear canvas

    // draw black background
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.draw_tiles(this.master, ctx);
};

TileViewer.prototype.draw_tiles = function (layer, ctx) {
    "use strict";
    var x = 0,
        y = 0,
        xmin = Math.max(0, Math.floor(-layer.xpos / layer.tilesize)),
        ymin = Math.max(0, Math.floor(-layer.ypos / layer.tilesize)),
        xmax = Math.min(layer.xtilenum, Math.ceil((this.canvas.clientWidth - layer.xpos) / layer.tilesize)),
        ymax = Math.min(layer.ytilenum, Math.ceil((this.canvas.clientHeight - layer.ypos) / layer.tilesize));

    for (y = ymin; y < ymax; y++) {
        for (x = xmin; x < xmax; x++) {
            this.draw_tile(layer, ctx, x, y);
        }
    }
    this.loader_process(layer);
};

TileViewer.prototype.draw_tile = function (layer, ctx, x, y) {
    "use strict";
    var tileid = x + y * layer.xtilenum,
        url = layer.src + "/level" + layer.level + "/" + tileid,
        img = layer.tiles[url],
        xsize = 0,
        ysize = 0,
        down = 1,
        factor = 1,
        dodraw = function () {
            var xsize = layer.tilesize,
                ysize = layer.tilesize,
                xpos = 0,
                ypos = 0;

            if (x === layer.xtilenum - 1) {
                xsize = (layer.tilesize / layer.info.tilesize) * layer.tilesize_xlast;
            }
            if (y === layer.ytilenum - 1) {
                ysize = (layer.tilesize / layer.info.tilesize) * layer.tilesize_ylast;
            }

            //try to align at N.5 position TODO: check this
            xpos = ((layer.xpos + x * layer.tilesize) | 0); // ?
            ypos = ((layer.ypos + y * layer.tilesize) | 0); // ?
            ctx.drawImage(img.image(), xpos, ypos, xsize + 1, ysize + 1);

            //update last access timestamp
            img.timestamp = new Date().getTime();
        };

    if (img === null || img === undefined) {
        //don't load overlay with sub-0 layer level
        if (layer.level >= 0) {
            this.loader_request(layer, url);
        }
    } else {
        if (img.loaded) {
            //good.. we have the image.. dodraw
            dodraw();
            return;
        }
        if (!img.loading) {
            //not loaded yet ... re-request using the same img to raise queue position
            this.loader_request(layer, url, img);
        }
    }

    //meanwhile .... draw sub-tile
    xsize = layer.tilesize;
    ysize = layer.tilesize;
    if (x === layer.xtilenum - 1) {
        xsize = (layer.tilesize / layer.info.tilesize) * layer.tilesize_xlast;
    }
    if (y === layer.ytilenum - 1) {
        ysize = (layer.tilesize / layer.info.tilesize) * layer.tilesize_ylast;
    }

    //look for available sub-tile of the highest quality
    while (layer.level + down <= layer.info.maxlevel) {
        factor <<= 1; // ???
        var xtilenum_up = Math.ceil(layer.info.width / Math.pow(2, layer.level + down) / layer.info.tilesize),
            subtileid = Math.floor(x / factor) + Math.floor(y / factor) * xtilenum_up,
            half_tilesize = layer.info.tilesize / factor,
            sx = (x % factor) * half_tilesize,
            sy = (y % factor) * half_tilesize,
            sw = half_tilesize,
            sh = half_tilesize;

        url = layer.src + "/level" + (layer.level + down) + "/" + subtileid;
        img = layer.tiles[url];

        if (img && img.loaded) {
            //crop the source section

            if (x === layer.xtilenum - 1) {
                sw = layer.tilesize_xlast / factor;
            }
            if (y === layer.ytilenum - 1) {
                sh = layer.tilesize_ylast / factor;
            }
            ctx.drawImage(img.image(), sx, sy, sw, sh, layer.xpos + x * layer.tilesize, layer.ypos + y * layer.tilesize, xsize, ysize);
            img.timestamp = new Date().getTime(); //update last access time-stamp
            return;
        }
        //try another level
        down++;
    }
};

TileViewer.prototype.loader_request = function (layer, url, img) {
    "use strict";
    var id = 0,
        request = 0;

    if (img === undefined) {
        //brand new tile.. queue as non-loading image
        img = new Tile(layer, this, url);
        layer.tiles[url] = img; //register in dictionary
        layer.loader.tile_count++;
    }

    //remove if already requested (so that I can add it back at the top)
    for (id = 0; id < layer.loader.queue.length; id++) {
        request = layer.loader.queue[id];
        if (request === img) {
            layer.loader.queue = layer.loader.queue.splice(id, 1);
            break;
        }
    }
    layer.loader.queue.push(img);
    return img;
};

TileViewer.prototype.loader_process = function (layer) {
    "use strict";

    var img,
        oldest_img,
        url;

    //if we can load more image, load it
    while (layer.loader.queue.length > 0 && layer.loader.loading < layer.loader.max_loading) {
        img = layer.loader.queue.pop();

        if (img.loaded === false && img.loading === false) {

            //do load the image
            img.load(img.request_src + ".png");
            layer.loader.loading++;
            img.loading = true;
        }
    }

    //if we have too many requests, shift old ones out.
    while (layer.loader.queue.length >= layer.loader.max_queue) {
        img = layer.loader.queue.shift();
    }

    //if we have too many images in the tiles ... remove last accessed image
    while (layer.loader.tile_count >= layer.loader.max_tiles) {
        oldest_img = null;
        for (url in layer.tiles) {
            if (layer.tiles.hasOwnProperty(url)) {
                img = layer.tiles[url];
                if (img.loaded === true && (oldest_img === null || img.timestamp < oldest_img.timestamp)) {
                    oldest_img = img;
                }
            }
        }
        if (oldest_img !== null) {
            delete layer.tiles[oldest_img.src];
            layer.loader.tile_count--;
        }
    }
};

TileViewer.prototype.recalc_viewparams = function (layer) {
    "use strict";
    var factor = Math.pow(2, layer.level);

    //calculate number of tiles on current level
    layer.xtilenum = Math.ceil(layer.info.width / factor / layer.info.tilesize);
    layer.ytilenum = Math.ceil(layer.info.height / factor / layer.info.tilesize);

    //calculate size of the last tile
    layer.tilesize_xlast = layer.info.width / factor % layer.info.tilesize;
    layer.tilesize_ylast = layer.info.height / factor % layer.info.tilesize;

    if (layer.tilesize_xlast === 0) {
        layer.tilesize_xlast = layer.info.tilesize;
    }
    if (layer.tilesize_ylast === 0) {
        layer.tilesize_ylast = layer.info.tilesize;
    }
};

TileViewer.prototype.get_viewpos = function (layer) {
    "use strict";
    var factor = Math.pow(2, layer.level) * layer.info.tilesize / layer.tilesize;
    return {
        x: -layer.xpos * factor,
        y: -layer.ypos * factor,
        width: this.canvas.clientWidth * factor,
        height: this.canvas.clientHeight * factor
    };
};

TileViewer.prototype.client2pixel = function (layer, client_x, client_y) {
    "use strict";
    var factor = Math.pow(2, layer.level) * layer.info.tilesize / layer.tilesize,
        pixel_x = Math.round((client_x - layer.xpos) * factor),
        pixel_y = Math.round((client_y - layer.ypos) * factor);
    return {
        x: pixel_x,
        y: pixel_y
    };
};

TileViewer.prototype.center_pixelpos = function (layer) {
    "use strict";
    return this.client2pixel(layer, this.canvas.clientWidth / 2, this.canvas.clientHeight / 2);
};

TileViewer.prototype.change_zoom = function (delta, x, y) {
    "use strict";
    var layer = this.master,
        dist_from_x0,
        dist_from_y0;

    if (!layer.info) {
        return; //master not loaded yet
    }

    //prevent delta to be too large to skip level increment
    if (layer.tilesize + delta < layer.tilesize / 2) {
        delta = layer.tilesize / 2 - layer.tilesize;
    }
    //don't let it shrink too much
    if (layer.level === layer.info.maxlevel - 1 && layer.tilesize + delta < layer.info.tilesize / 2) {
        return false;
    }
    //don't let overzoom
    if (layer.level === 0 && layer.tilesize + delta > layer.info.tilesize * this.options.maximum_pixelsize) {
        return false;
    }

    //before changing tilesize, adjust offset so that we will zoom into where the cursor is
    dist_from_x0 = x - layer.xpos;
    dist_from_y0 = y - layer.ypos;

    layer.xpos -= dist_from_x0 / layer.tilesize * delta;
    layer.ypos -= dist_from_y0 / layer.tilesize * delta;

    layer.tilesize += delta;

    //adjust level
    if (layer.tilesize > layer.info.tilesize) { //level down
        if (layer.level !== 0) {
            layer.level--;
            layer.tilesize /= 2; //we can't use bitoperation here.. need to preserve floating point
            this.recalc_viewparams(layer);
        }
    }
    if (layer.tilesize < layer.info.tilesize / 2) { //level up
        if (layer.level !== layer.info.maxlevel) {
            layer.level++;
            layer.tilesize *= 2; //we can't use bitoperation here.. need to preserve floating point
            this.recalc_viewparams(layer);
        }
    }

};

TileViewer.prototype.pan = function () {
    "use strict";
    var layer = this.master,
        factor = Math.pow(2, layer.level) * layer.info.tilesize / layer.tilesize,
        xdest_client = this.pan.xdest / factor + layer.xpos,
        ydest_client = this.pan.ydest / factor + layer.ypos,
        center = this.center_pixelpos(layer),
        dx = center.x - this.pan.xdest,
        dy = center.y - this.pan.ydest,
        current_level,
        level_dist,
        dzoom,
        dist;


    //Step 1) if destination is not in client view - zoom out until we do (or we can't zoom out anymore)
    if (layer.level !== layer.info.maxlevel && (xdest_client < 0 || ydest_client < 0 || xdest_client > this.canvas.clientWidth || ydest_client > this.canvas.clientHeight)) {
        this.change_zoom(-5, this.canvas.clientWidth / 2 + dx / dist * factor * 50, this.canvas.clientHeight / 2 + dy / dist * factor * 50);
    } else {
        //Step 2a) Pan to destination
        if (dist >= factor) {
            layer.xpos += dx / factor / 10;
            layer.ypos += dy / factor / 10;
        }

        //Step 2b) Also, zoom in/out until destination level is reached
        current_level = layer.level + layer.info.tilesize / layer.tilesize - 1;
        level_dist = Math.abs(this.pan.leveldest - current_level);
        if (level_dist >= 0.1) {
            dzoom = 4;
            if (current_level < this.pan.leveldest) {
                dzoom = -dzoom;
            }
            this.change_zoom(dzoom, xdest_client * 2 - this.canvas.clientWidth / 2, ydest_client * 2 - this.canvas.clientHeight / 2);
        }

        if (dist < factor && level_dist < 0.1) {
            //reached destination
            this.pan.xdest = null;
        }
    }
    this.needdraw = true;
};

TileViewer.prototype.process_layer_info = function (data, layer) {
    "use strict";
    layer.info = data;

    var v1 = 0,
        min = 0,
        factor = 0,
        thumb_url = '';

    //calculate metadata
    v1 = Math.max(layer.info.width, layer.info.height) / layer.info.tilesize;
    layer.info.maxlevel = Math.ceil(Math.log(v1) / Math.log(2));
    if (layer.info.maxlevel > 3) {
        log.warn('forcing max level to 3');
        layer.info.maxlevel = 3;
    }

    //set initial level/size to fit the entire view
    min = Math.min(this.canvas.width, this.canvas.height) / layer.info.tilesize; //number of tiles that can fit
    layer.level = layer.info.maxlevel - Math.floor(min) - 1;
    layer.tilesize = layer.info.tilesize / 2;
    if (layer.level < 0) {
        log.warn('forcing initial level to zero: ' + layer.level);
        layer.level = 0;
    }
    layer.level = layer.info.maxlevel - 1;

    //center image
    factor = Math.pow(2, layer.level) * layer.info.tilesize / layer.tilesize;
    layer.xpos = this.canvas.clientWidth / 2 - layer.info.width / 2 / factor;
    layer.ypos = this.canvas.clientHeight / 2 - layer.info.height / 2 / factor;


    //cache level0 image (so that we don't have to use the green rect too long..) and use it as thumbnail
    thumb_url = layer.src + "/level" + layer.info.maxlevel + "/0";
    layer.thumb = this.loader_request(layer, thumb_url);
    this.loader_process(layer);
    this.recalc_viewparams(layer);
    this.needdraw = true;
};

TileViewer.prototype.addlayer = function (options) {
    "use strict";
    var that = this,
        layer = {
            //json.info will be loaded here (static information about the image)
            info: null,
            src: null,
            id: null,
            enable: false,

            //current view offset - not absolute pixel offset
            xpos: 0,
            ypos: 0,

            //number of tiles on the current level
            xtilenum: null,
            ytilenum: null,

            //current tile level/size (size is usually 128-256)
            level: null,
            tilesize: null,

            thumb: null, //thumbnail image

            //tile loader
            loader: {
                loading: 0, //actual number of images that are currently loaded
                max_loading: 3, //max number of image that can be loaded simultaneously
                max_queue: 50, //max number of images that can be queued to be loaded
                queue: [], //FIFO queue for requested images
                tile_count: 0, //number of tiles in tile dictionary (not all of them are actually loaded)
                max_tiles: 200 //max number of images that can be stored in tiles dictionary
            },
            tiles: [] //tiles dictionary 
        };

    layer = $.extend(layer, options);
    this.master = layer;

    $.ajax({
        url: layer.src + "/info.json",
        dataType: "json",
        success: function (data) {
            that.process_layer_info(data, layer);
        }
    });

};
