/**
 *  A tile loads a DicomImage which is a header an a bugger, returns a plain image
 */
function Tile(layerRef, viewRef, url) {
    "use strict";
    this.layer = layerRef;
    this.view = viewRef;
    this.level_loaded_for = layerRef.level;
    this.request_src = url;
    this.src = "";
    this.json = null;
    this.timestamp = new Date().getTime();
    this.img = new DicomImage(this, this.onload);
    this.loaded = false;
    this.loading = false;
}

Tile.prototype.load = function (url) {
    "use strict";
    this.src = url;
    this.loading = true;
    this.img.load(url);
};

Tile.prototype.onload = function (that) {
    "use strict";
    that.loaded = true;
    that.loading = false;
    if (that.level_loaded_for === that.layer.level) {
        that.view.needdraw = true;
    }
    that.layer.loader.loading--;
    that.view.loader_process(that.layer);
};

Tile.prototype.image = function () {
    "use strict";
    return this.img.image();
};
