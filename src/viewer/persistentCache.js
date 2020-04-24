/*jslint browser: true*/
/*global log, DicomObject, DicomHeader, Q */

var pnw = pnw || {}; // global namespace

/**
 * Controls storing and retrieving persistent data. Currently uses indexedDb with a shim (webSql)
 * @constructor
 */
pnw.PersistentCache = function () {
    "use strict";
    this.db = null;
    this.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    this.storeName = "image_cache";
};

pnw.PersistentCache.prototype.init = function () {
    "use strict";

    if (this.db) {
        var def = Q.defer();
        def.resolve();
        return def.promise;
    }

    var request = this.indexedDB.open(this.storeName, 1),
        that = this,
        dfd = Q.defer();


    request.onsuccess = function (evt) {
        log.debug('success');
        that.db = request.result;
        dfd.resolve();
    };

    request.onerror = function (evt) {
        log.error("IndexedDB error: " + evt.target.errorCode);
        dfd.reject();
    };

    request.onupgradeneeded = function (evt) {
        log.debug('onupgradeneeded');
        var objectStore = evt.target.result.createObjectStore(that.storeName, {
            keyPath: "id",
            autoIncrement: true
        });

        objectStore.createIndex("path", "path", {
            unique: true
        });
        objectStore.createIndex("buffer", "buffer", {
            unique: false
        });

    };

    return dfd.promise;
};

// add new data to store
pnw.PersistentCache.prototype.add = function (path, buffer) {
    "use strict";

    var dfd = Q.defer(),
        that = this;

    this.init().then(function () {

        var transaction = that.db.transaction(that.storeName, "readwrite"),
            objectStore = transaction.objectStore(that.storeName),
            request = objectStore.add({
                path: path,
                buffer: buffer
            });

        request.onsuccess = function (evt) {
            // do something when the add succeeded
            log.debug('added data for', path);
            dfd.resolve();
        };

        request.onerror = function (evt) {
            log.warn('failed to add data to ', path);
            dfd.reject();
        };
    }, function () {
        log.warn('failed to initialize');
        dfd.reject();
    });


    return dfd.promise;
};

// returns a DicomObject for a given uid
pnw.PersistentCache.prototype.get = function (ident) {
    "use strict";

    var dfd = Q.defer(),
        that = this;

    this.init().then(function () {

        var transaction = that.db.transaction(that.storeName),
            objectStore = transaction.objectStore(that.storeName),
            index = objectStore.index("path"),
            request = index.get(ident);

        request.onsuccess = function (evt) {
            if (typeof request.result === 'undefined') {
                log.debug('nothing stored, cannot get data', ident);
                dfd.reject();
            } else {
                log.debug('getting data for', ident);
                var value = request.result.buffer;
                // recreating dicomObject from stripped buffer
                dfd.resolve(new pnw.DicomObject(new pnw.DicomHeader(value.header.dicomData), value.imageData, value.header.minPx, value.header.maxPx, value.q));
            }
        };

        request.onerror = function (evt) {
            log.warn('failed to get data: ', ident);
            dfd.reject();
        };

    }, function () {
        log.warn('failed to initialize');
        dfd.reject();
    });

    return dfd.promise;
};

// remove object with given uid
pnw.PersistentCache.prototype.remove = function (ident) {
    "use strict";

    var dfd = Q.defer(),
        that = this;

    this.init().then(function () {

        var transaction = that.db.transaction(that.storeName),
            objectStore = transaction.objectStore(that.storeName),
            request = objectStore.delete(ident);

        request.onsuccess = function (evt) {
            log.debug("deleted: " + ident);
            dfd.resolve();
        };

        request.onerror = function (evt) {
            log.warn('failed to remove data: ', ident);
            dfd.reject();
        };
    }, function () {
        log.warn('failed to initialize');
        dfd.reject();
    });

    return dfd.promise;
};

// check if a value exists, without loading it
pnw.PersistentCache.prototype.contains = function (ident) {
    "use strict";

    var dfd = Q.defer(),
        that = this;

    this.init().then(function () {

        var transaction = that.db.transaction(that.storeName),
            objectStore = transaction.objectStore(that.storeName),
            index = objectStore.index("path"),
            request = index.openCursor(ident);

        request.onsuccess = function (evt) {
            var cursor = request.result || evt.result;
            if (cursor) { // key already exist
                log.debug('key exists', ident);
                dfd.resolve();
            } else { // key not exist
                log.debug('key not found', ident);
                dfd.reject();
            }
        };

        request.onerror = function (evt) {
            log.warn('contains failed', ident);
            dfd.reject();
        };
    }, function () {
        log.warn('failed to initialize');
        dfd.reject();
    });

    return dfd.promise;
};

// clear all
pnw.PersistentCache.prototype.clear = function () {
    "use strict";

    var dfd = Q.defer(),
        that = this;

    this.init().then(function () {

        var transaction = that.db.transaction(that.storeName, "readwrite"),
            objectStore = transaction.objectStore(that.storeName),
            request = objectStore.clear();

        request.onsuccess = function (evt) {
            log.debug("clearing cache");
            dfd.resolve();
        };

        request.onerror = function (evt) {
            log.warn('failed to clear storage');
            dfd.reject();
        };
    }, function () {
        log.warn('failed to initialize');
        dfd.reject();
    });

    return dfd.promise;
};
