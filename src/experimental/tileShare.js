/*global LookupTable, window */

/**
 *  The tileshare is a singleton to reuse the same objects per tile (e.g. lookup table)
 *  http://code.google.com/p/jslibs/wiki/JavascriptTips#Singleton_pattern
 */
(function (global) {
    "use strict";
    var TileShare = function () {

            if (TileShare.prototype.singletonInstance) {
                return TileShare.prototype.singletonInstance;
            }
            TileShare.prototype.singletonInstance = this;

            // this is what should be shared
            this.lookup = new LookupTable();
        },
        a = new TileShare(),
        b = TileShare; // TileShare()
    global.result = a === b;

}(window));
