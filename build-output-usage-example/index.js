var check = function(cfiParser, cfiInterpreter, cfiInstructions, cfiRuntimeErrors, cfiGenerator) {
    
    $(document).ready(function () {
        
        console.log(window.EPUBcfi);
        
        function checkAPI(obj, globalName) {
                
            if (obj && obj === window.EPUBcfi[globalName]) {
                console.log("OKAY => EPUBcfi." + globalName);
            } else {
                console.log("ERROR! => EPUBcfi." + globalName);
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
        
    });
};


if (typeof define == 'function' && typeof define.amd == 'object') {
    console.log("RequireJS ... index.js");
    
    // For attaching the global window objects
    require(["readium-cfi-js"], function () {
        
    // to access individual feature APIs, via dependency injection (not the global window-attached objects)
    require(['jquery', 'readium_cfi_js/cfi_parser', 'readium_cfi_js/cfi_interpreter', 'readium_cfi_js/cfi_instructions', 'readium_cfi_js/cfi_runtime_errors', 'readium_cfi_js/cfi_generator'],
    function ($, cfiParser, cfiInterpreter, cfiInstructions, cfiRuntimeErrors, cfiGenerator) {
        
        check(cfiParser, cfiInterpreter, cfiInstructions, cfiRuntimeErrors, cfiGenerator);
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
        window.EPUBcfi.Generator);
}
