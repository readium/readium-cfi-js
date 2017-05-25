var check = function(cfiParser, cfiInterpreter, cfiInstructions, cfiRuntimeErrors, cfiGenerator, xmlParse) {

    $(document).ready(function () {

        console.log(window.EPUBcfi);

        function checkAPI(obj, globalName, anchor) {

            if (!anchor) anchor = window.EPUBcfi;
            
            if (obj && obj === anchor[globalName]) {
                console.log("OKAY => " + globalName);
            } else {
                console.log("ERROR! => " + globalName);
            }
        }

        checkAPI(cfiParser, "Parser");
        checkAPI(cfiInstructions, "CFIInstructions");
        checkAPI(cfiInterpreter, "Interpreter");
        checkAPI(cfiGenerator, "Generator");
        checkAPI(cfiRuntimeErrors.NodeTypeError, "NodeTypeError");
        checkAPI(cfiRuntimeErrors.OutOfRangeError, "OutOfRangeError");
        checkAPI(cfiRuntimeErrors.TerminusError, "TerminusError");
        checkAPI(cfiRuntimeErrors.CFIAssertionError, "CFIAssertionError");
        checkAPI(xmlParse, "XmlParse", window);
    });
};


if (typeof define == 'function' && typeof define.amd == 'object') {
    console.log("RequireJS ... index.js");

    // For attaching the global window objects
    require(["readium_cfi_js/cfi_API"], function () {

    // to access individual feature APIs, via dependency injection (not the global window-attached objects)
    require(['jquery', 'underscore', 'readium_cfi_js/cfi_parser', 'readium_cfi_js/cfi_interpreter', 'readium_cfi_js/cfi_instructions', 'readium_cfi_js/cfi_runtime_errors', 'readium_cfi_js/cfi_generator', 'readium_cfi_js/XmlParse'],
    function ($, _, cfiParser, cfiInterpreter, cfiInstructions, cfiRuntimeErrors, cfiGenerator, xmlParse) {
        check(cfiParser, cfiInterpreter, cfiInstructions, cfiRuntimeErrors, cfiGenerator, xmlParse);
    });
    });

} else {
    console.log("!RequireJS ... index.js");

    if (!window["EPUBcfi"]) {
        throw new Error("EPUBcfi not initialised on global object?! (window or this context)");
    }

    check(
        window.EPUBcfi.Parser,
        window.EPUBcfi.Interpreter,
        window.EPUBcfi.CFIInstructions,
        {
            NodeTypeError: window.EPUBcfi.NodeTypeError,
            OutOfRangeError: window.EPUBcfi.OutOfRangeError,
            TerminusError: window.EPUBcfi.TerminusError,
            CFIAssertionError: window.EPUBcfi.CFIAssertionError
        },
        window.EPUBcfi.Generator,
        window.XmlParse);
}
