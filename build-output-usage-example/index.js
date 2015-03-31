var check = function(cfiParser, cfiInterpreter, cfiInstructions, cfiRuntimeErrors, cfiGenerator) {
    $(document).ready(function () {
        
        console.log(window.EPUBcfi);
        
        function checkAPI(obj, globalName) {
                
            if (obj === window.EPUBcfi[globalName]) {
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

    // For attaching the global window objects
    require(["readium-cfi-js"], function () {
        
    // to access individual feature APIs, via dependency injection (not the global window-attached objects)
    require(['jquery', 'cfi-parser', 'cfi-interpreter', 'cfi-instructions', 'cfi-runtime-errors', 'cfi-generator'],
    function ($, cfiParser, cfiInterpreter, cfiInstructions, cfiRuntimeErrors, cfiGenerator) {
        
        check(cfiParser, cfiInterpreter, cfiInstructions, cfiRuntimeErrors, cfiGenerator);
    });
    });

} else {
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
