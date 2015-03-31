
require(["readium-cfi-js"], function () {
    
require(["cfi-parser", "cfi-instructions"], function (cfiParser, cfiInstructions) {
    
    $(document).ready(function () {
        console.log(window.EPUBcfi);
        /*
    EPUBcfi.Interpreter = cfiInterpreter;
    EPUBcfi.Generator = cfiGenerator;
    
    EPUBcfi.NodeTypeError= cfiRuntimeErrors.NodeTypeError;
    EPUBcfi.OutOfRangeError = cfiRuntimeErrors.OutOfRangeError;
    EPUBcfi.TerminusError = cfiRuntimeErrors.TerminusError;
    EPUBcfi.CFIAssertionError = cfiRuntimeErrors.CFIAssertionError;
    */
    
        if (cfiParser === window.EPUBcfi.Parser) {
            console.log("OKAY => EPUBcfi.Parser");
        } else {
            console.log("ERROR! => EPUBcfi.Parser");
        }
        
        if (cfiInstructions === window.EPUBcfi.CFIInstructions) {
            console.log("OKAY => EPUBcfi.CFIInstructions");
        } else {
            console.log("ERROR! => EPUBcfi.CFIInstructions");
        }
    });

});
});