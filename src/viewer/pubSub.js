/*jslint browser: true*/
/*global log*/

/**
 * Simple Publish/Subscribe implemenation of the observer pattern
 */
window.pubsub = (() => {
    "use strict";
    var eventToListeners = {},
        i;

    return {
        sub: function (event, callback) {
            if (!eventToListeners.hasOwnProperty(event)) {
                eventToListeners[event] = [];
            }
            eventToListeners[event].push(callback);
        },
        pub: function (event, args) {
            if (eventToListeners.hasOwnProperty(event)) {
                for (i = 0; i < eventToListeners[event].length; i += 1) {
                    try {
                        eventToListeners[event][i].call(null, args);
                    } catch (e) {
                        log.error(e);
                    }
                }
            }
        }
    };
})();
