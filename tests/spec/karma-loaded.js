window.__karma__.loaded = function() {
    
// For attaching the global window objects
if (typeof require !== "undefined")
require(["readium-cfi-js"], function () {
    window.__karma__.start();
});
else window.__karma__.start();

};
