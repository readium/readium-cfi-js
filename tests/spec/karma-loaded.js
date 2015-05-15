window.__karma__.loaded = function() {

// For attaching the global window objects
if (typeof require !== "undefined")
require(["readium_cfi_js/cfi_API"], function () {
    window.__karma__.start();
});
else window.__karma__.start();

};
