/*global log, Q */

var pnw = pnw || {}; // global namespace

/**
 * Controls storing and retrieving persistent data. Currently uses indexedDb with a shim (webSql)
 * @constructor
 */
pnw.CacheManager = function () {
    "use strict";
    this.cObject = new pnw.MemoryCache();
    this.init();

    // clearing cache
    this.clear();
};

pnw.CacheManager.prototype.init = function () {
    "use strict";

    return this.cObject.init();
};

// add new data to store
pnw.CacheManager.prototype.add = function (path, buffer) {
    "use strict";

    return this.cObject.add(path, buffer);
};

// returns a DicomObject for a given uid
pnw.CacheManager.prototype.get = function (ident) {
    "use strict";

    return this.cObject.get(ident);
};

// remove object with given uid
pnw.CacheManager.prototype.remove = function (ident) {
    "use strict";

    return this.cObject.remove(ident);
};

// check if a value exists, without loading it
pnw.CacheManager.prototype.contains = function (ident) {
    "use strict";

    return this.cObject.contains(ident);
};

// clear all
pnw.CacheManager.prototype.clear = function () {
    "use strict";

    return this.cObject.clear();
};
