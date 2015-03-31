window.__karma__.loaded = function() {};

// For attaching the global window objects
require(["readium-cfi-js"], function () {
    window.__karma__.start();
});
