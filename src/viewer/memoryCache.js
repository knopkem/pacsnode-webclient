/*jslint browser: true*/
/*global log, DicomObject, DicomHeader, Q, Hashtable */

var pnw = pnw || {}; // global namespace

/**
 * storing and retrieving non-persistent data
 * @constructor
 */
pnw.MemoryCache = function () {
    "use strict";
    this.hash = new Hashtable();
};

pnw.MemoryCache.prototype.init = function () {
    "use strict";
    var dfd = Q.defer();
    dfd.resolve();
    return dfd.promise;
};

// add new data to store
pnw.MemoryCache.prototype.add = function (path, buffer) {
    "use strict";
    var dfd = Q.defer();
    dfd.resolve();
    log.debug('adding to memory cache', path);
    this.hash.put(path, buffer);
    return dfd.promise;
};

// returns a DicomObject for a given uid
pnw.MemoryCache.prototype.get = function (ident) {
    "use strict";
    var dfd = Q.defer();
    if (this.hash.containsKey(ident)) {
        dfd.resolve(this.hash.get(ident));
    } else {
        dfd.reject();
    }

    return dfd.promise;
};

// remove object with given uid
pnw.MemoryCache.prototype.remove = function (ident) {
    "use strict";
    var dfd = Q.defer();
    dfd.resolve();
    log.debug('removing from memory cache', ident);
    this.hash.remove(ident);
    return dfd.promise;
};

// check if a value exists, without loading it
pnw.MemoryCache.prototype.contains = function (ident) {
    "use strict";
    var dfd = Q.defer();
    if (this.hash.containsKey(ident)) {
        dfd.resolve();
    } else {
        dfd.reject();
    }
    return dfd.promise;
};

// clear all
pnw.MemoryCache.prototype.clear = function () {
    "use strict";
    var dfd = Q.defer();
    dfd.resolve();
    log.debug('clear all memory cache');
    this.hash.clear();
    return dfd.promise;
};
