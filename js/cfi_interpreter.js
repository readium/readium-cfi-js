//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//
//  Redistribution and use in source and binary forms, with or without modification,
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice,
//  this list of conditions and the following disclaimer in the documentation and/or
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be
//  used to endorse or promote products derived from this software without specific
//  prior written permission.

(function(global) {

var init = function($, cfiParser, cfiInstructions, cfiRuntimeErrors) {

    if (typeof cfiParser === "undefined") {
        throw new Error("UNDEFINED?! cfiParser");
    }

    if (typeof cfiInstructions === "undefined") {
        throw new Error("UNDEFINED?! cfiInstructions");
    }

    if (typeof cfiRuntimeErrors === "undefined") {
        throw new Error("UNDEFINED?! cfiRuntimeErrors");
    }

var obj = {

// Description: This is an interpreter that inteprets an Abstract Syntax Tree (AST) for a CFI. The result of executing the interpreter
//   is to inject an element, or set of elements, into an EPUB content document (which is just an XHTML document). These element(s) will
//   represent the position or area in the EPUB referenced by a CFI.
// Rationale: The AST is a clean and readable expression of the step-terminus structure of a CFI. Although building an interpreter adds to the
//   CFI infrastructure, it provides a number of benefits. First, it emphasizes a clear separation of concerns between lexing/parsing a
//   CFI, which involves some complexity related to escaped and special characters, and the execution of the underlying set of steps
//   represented by the CFI. Second, it will be easier to extend the interpreter to account for new/altered CFI steps (say for references
//   to vector objects or multiple CFIs) than if lexing, parsing and interpretation were all handled in a single step. Finally, Readium's objective is
//   to demonstrate implementation of the EPUB 3.0 spec. An implementation with a strong separation of concerns that conforms to
//   well-understood patterns for DSL processing should be easier to communicate, analyze and understand.
// REFACTORING CANDIDATE: node type errors shouldn't really be possible if the CFI syntax is correct and the parser is error free.
//   Might want to make the script die in those instances, once the grammar and interpreter are more stable.
// REFACTORING CANDIDATE: The use of the 'nodeType' property is confusing as this is a DOM node property and the two are unrelated.
//   Whoops. There shouldn't be any interference, however, I think this should be changed.

    // ------------------------------------------------------------------------------------ //
    //  "PUBLIC" METHODS (THE API)                                                          //
    // ------------------------------------------------------------------------------------ //

    // Description: Find the content document referenced by the spine item. This should be the spine item
    //   referenced by the first indirection step in the CFI.
    // Rationale: This method is a part of the API so that the reading system can "interact" the content document
    //   pointed to by a CFI. If this is not a separate step, the processing of the CFI must be tightly coupled with
    //   the reading system, as it stands now.
    getContentDocHref : function (CFI, packageDocument, classBlacklist, elementBlacklist, idBlacklist) {

        var $packageDocument = $(packageDocument);
        var decodedCFI = decodeURI(CFI);
        var CFIAST = cfiParser.parse(decodedCFI);

        if (!CFIAST || CFIAST.type !== "CFIAST") {
            throw cfiRuntimeErrors.NodeTypeError(CFIAST, "expected CFI AST root node");
        }

        // Interpet the path node (the package document step)
        $packageElement = $(packageDocument.querySelector("package"));
        var $currElement = this.interpretIndexStepNode(CFIAST.cfiString.path, $packageElement, classBlacklist, elementBlacklist, idBlacklist);
        foundHref = this.searchLocalPathForHref($currElement, $packageDocument, CFIAST.cfiString.localPath, classBlacklist, elementBlacklist, idBlacklist);

        if (foundHref) {
            return foundHref;
        }
        else {
            return undefined;
        }
    },

    // Description: Inject an arbitrary html element into a position in a content document referenced by a CFI
    injectElement : function (CFI, contentDocument, elementToInject, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(CFI);
        var CFIAST = cfiParser.parse(decodedCFI);
        var indirectionNode;
        var indirectionStepNum;
        var $currElement;

        // Rationale: Since the correct content document for this CFI is already being passed, we can skip to the beginning
        //   of the indirection step that referenced the content document.
        // Note: This assumes that indirection steps and index steps conform to an interface: an object with stepLength, idAssertion
        indirectionStepNum = this.getFirstIndirectionStepNum(CFIAST);
        indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
        indirectionNode.type = "indexStep";

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, indirectionStepNum, $(contentDocument.documentElement, contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // TODO: detect what kind of terminus; for now, text node termini are the only kind implemented
        $currElement = this.interpretTextTerminusNode(CFIAST.cfiString.localPath.termStep, $currElement, elementToInject);

        // Return the element that was injected into
        return $currElement;
    },

    // Description: Inject an arbitrary html element into a position in a content document referenced by a CFI
    injectRangeElements : function (rangeCFI, contentDocument, startElementToInject, endElementToInject, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(rangeCFI);
        var CFIAST = cfiParser.parse(decodedCFI);
        var indirectionNode;
        var indirectionStepNum;
        var $currElement;
        var $range1TargetElement;
        var $range2TargetElement;

        // Rationale: Since the correct content document for this CFI is already being passed, we can skip to the beginning
        //   of the indirection step that referenced the content document.
        // Note: This assumes that indirection steps and index steps conform to an interface: an object with stepLength, idAssertion
        indirectionStepNum = this.getFirstIndirectionStepNum(CFIAST);
        indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
        indirectionNode.type = "indexStep";

        // Interpret the rest of the steps in the first local path
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, indirectionStepNum, $(contentDocument.documentElement, contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // Interpret the first range local_path
        $range1TargetElement = this.interpretLocalPath(CFIAST.cfiString.range1, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);
        $range1TargetElement = this.interpretTextTerminusNode(CFIAST.cfiString.range1.termStep, $range1TargetElement, startElementToInject);

        // Interpret the second range local_path
        $range2TargetElement = this.interpretLocalPath(CFIAST.cfiString.range2, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);
        $range2TargetElement = this.interpretTextTerminusNode(CFIAST.cfiString.range2.termStep, $range2TargetElement, endElementToInject);

        // Return the element that was injected into
        return {
            startElement : $range1TargetElement[0],
            endElement : $range2TargetElement[0]
        };
    },

    // Description: This method will return the element or node (say, a text node) that is the final target of the
    //   the CFI.
    getTargetElement : function (CFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(CFI);
        var CFIAST = cfiParser.parse(decodedCFI);
        var indirectionNode;
        var indirectionStepNum;
        var $currElement;

        // Rationale: Since the correct content document for this CFI is already being passed, we can skip to the beginning
        //   of the indirection step that referenced the content document.
        // Note: This assumes that indirection steps and index steps conform to an interface: an object with stepLength, idAssertion
        indirectionStepNum = this.getFirstIndirectionStepNum(CFIAST);
        indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
        indirectionNode.type = "indexStep";

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, indirectionStepNum, $(contentDocument.documentElement, contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // Return the element at the end of the CFI
        return $currElement;
    },

    // Description: This method will return the start and end elements (along with their char offsets) that are the final targets of the range CFI.
    getRangeTargetElements : function (rangeCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(rangeCFI);
        var CFIAST = cfiParser.parse(decodedCFI);
        var indirectionNode;
        var indirectionStepNum;
        var $currElement;
        var $range1TargetElement;
        var $range2TargetElement;

        // Rationale: Since the correct content document for this CFI is already being passed, we can skip to the beginning
        //   of the indirection step that referenced the content document.
        // Note: This assumes that indirection steps and index steps conform to an interface: an object with stepLength, idAssertion
        indirectionStepNum = this.getFirstIndirectionStepNum(CFIAST);
        indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
        indirectionNode.type = "indexStep";

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, indirectionStepNum, $(contentDocument.documentElement, contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // Interpret first range local_path
        $range1TargetElement = this.interpretLocalPath(CFIAST.cfiString.range1, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);

        // Interpret second range local_path
        $range2TargetElement = this.interpretLocalPath(CFIAST.cfiString.range2, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);

        // Get the start and end character offsets
        var startOffset = parseInt(CFIAST.cfiString.range1.termStep.offsetValue) || undefined;
        var endOffset = parseInt(CFIAST.cfiString.range2.termStep.offsetValue) || undefined;

        // Return the element (and char offsets) at the end of the CFI
        return {
            startElement: $range1TargetElement[0],
            startOffset: startOffset,
            endElement: $range2TargetElement[0],
            endOffset: endOffset
        };
    },

    // Description: This method allows a "partial" CFI to be used to reference a target in a content document, without a
    //   package document CFI component.
    // Arguments: {
    //     contentDocumentCFI : This is a partial CFI that represents a path in a content document only. This partial must be
    //        syntactically valid, even though it references a path starting at the top of a content document (which is a CFI that
    //        that has no defined meaning in the spec.)
    //     contentDocument : A DOM representation of the content document to which the partial CFI refers.
    // }
    // Rationale: This method exists to meet the requirements of the Readium-SDK and should be used with care
    getTargetElementWithPartialCFI : function (contentDocumentCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(contentDocumentCFI);
        var CFIAST = cfiParser.parse(decodedCFI);
        var indirectionNode;

        // Interpret the path node
        var $currElement = this.interpretIndexStepNode(CFIAST.cfiString.path, $(contentDocument.documentElement, contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);

        // Return the element at the end of the CFI
        return $currElement;
    },

    // Description: This method allows a "partial" CFI to be used, with a content document, to return the text node and offset
    //    referenced by the partial CFI.
    // Arguments: {
    //     contentDocumentCFI : This is a partial CFI that represents a path in a content document only. This partial must be
    //        syntactically valid, even though it references a path starting at the top of a content document (which is a CFI that
    //        that has no defined meaning in the spec.)
    //     contentDocument : A DOM representation of the content document to which the partial CFI refers.
    // }
    getTextTerminusInfoWithPartialCFI : function (contentDocumentCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(contentDocumentCFI);
        var CFIAST = cfiParser.parse(decodedCFI);
        var indirectionNode;
        var textOffset;

        // Interpret the path node
        var $currElement = this.interpretIndexStepNode(CFIAST.cfiString.path, $(contentDocument.documentElement, contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);

        // Return the element at the end of the CFI
        textOffset = parseInt(CFIAST.cfiString.localPath.termStep.offsetValue);
        return {
            textNode: $currElement[0],
            textOffset: textOffset
        };
    },

    // Description: This method will return the element or node (say, a text node) that is the final target of the
    //   the CFI, along with the text terminus offset.
    getTextTerminusInfo : function (CFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(CFI);
        var CFIAST = cfiParser.parse(decodedCFI);
        var indirectionNode;
        var indirectionStepNum;
        var $currElement;
        var textOffset;

        // Rationale: Since the correct content document for this CFI is already being passed, we can skip to the beginning
        //   of the indirection step that referenced the content document.
        // Note: This assumes that indirection steps and index steps conform to an interface: an object with stepLength, idAssertion
        indirectionStepNum = this.getFirstIndirectionStepNum(CFIAST);
        indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
        indirectionNode.type = "indexStep";

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, indirectionStepNum, $(contentDocument.documentElement, contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // Return the element at the end of the CFI
        textOffset = parseInt(CFIAST.cfiString.localPath.termStep.offsetValue);
        return {
            textNode: $currElement[0],
            textOffset: textOffset
        };
    },

    // Description: This function will determine if the input "partial" CFI is expressed as a range
    isRangeCfi: function (cfi) {
        var CFIAST = cfiParser.parse(cfi);
        return CFIAST.cfiString.range1 ? true : false;
    },

    // Description: This function will determine if the input "partial" CFI has a text terminus step
    hasTextTerminus: function (cfi) {
        var CFIAST = cfiParser.parse(cfi);
        return CFIAST.cfiString.localPath.termStep ? true : false;
    },

    // ------------------------------------------------------------------------------------ //
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //

    getFirstIndirectionStepNum : function (CFIAST) {

        // Find the first indirection step in the local path; follow it like a regular step, as the step in the content document it
        //   references is already loaded and has been passed to this method
        var stepNum = 0;
        for (stepNum; stepNum <= CFIAST.cfiString.localPath.steps.length - 1 ; stepNum++) {

            nextStepNode = CFIAST.cfiString.localPath.steps[stepNum];
            if (nextStepNode.type === "indirectionStep") {
                return stepNum;
            }
        }
    },

    // REFACTORING CANDIDATE: cfiString node and start step num could be merged into one argument, by simply passing the
    //   starting step... probably a good idea, this would make the meaning of this method clearer.
    interpretLocalPath : function (localPathNode, startStepNum, $currElement, classBlacklist, elementBlacklist, idBlacklist) {

        var stepNum = startStepNum;
        var nextStepNode;
        for (stepNum; stepNum <= localPathNode.steps.length - 1 ; stepNum++) {

            nextStepNode = localPathNode.steps[stepNum];
            if (nextStepNode.type === "indexStep") {

                $currElement = this.interpretIndexStepNode(nextStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist);
            }
            else if (nextStepNode.type === "indirectionStep") {

                $currElement = this.interpretIndirectionStepNode(nextStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist);
            }
        }

        return $currElement;
    },

    interpretIndexStepNode : function (indexStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist) {

        // Check node type; throw error if wrong type
        if (indexStepNode === undefined || indexStepNode.type !== "indexStep") {

            throw cfiRuntimeErrors.NodeTypeError(indexStepNode, "expected index step node");
        }

        // Index step
        var $stepTarget = cfiInstructions.getNextNode(indexStepNode.stepLength, $currElement, classBlacklist, elementBlacklist, idBlacklist);

        // Check the id assertion, if it exists
        if (indexStepNode.idAssertion) {

            if (!cfiInstructions.targetIdMatchesIdAssertion($stepTarget, indexStepNode.idAssertion)) {

                throw cfiRuntimeErrors.CFIAssertionError(indexStepNode.idAssertion, $stepTarget.attr('id'), "Id assertion failed");
            }
        }

        return $stepTarget;
    },

    interpretIndirectionStepNode : function (indirectionStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist) {

        // Check node type; throw error if wrong type
        if (indirectionStepNode === undefined || indirectionStepNode.type !== "indirectionStep") {

            throw cfiRuntimeErrors.NodeTypeError(indirectionStepNode, "expected indirection step node");
        }

        // Indirection step
        var $stepTarget = cfiInstructions.followIndirectionStep(
            indirectionStepNode.stepLength,
            $currElement,
            classBlacklist,
            elementBlacklist);

        // Check the id assertion, if it exists
        if (indirectionStepNode.idAssertion) {

            if (!cfiInstructions.targetIdMatchesIdAssertion($stepTarget, indirectionStepNode.idAssertion)) {

                throw cfiRuntimeErrors.CFIAssertionError(indirectionStepNode.idAssertion, $stepTarget.attr('id'), "Id assertion failed");
            }
        }

        return $stepTarget;
    },

    // REFACTORING CANDIDATE: The logic here assumes that a user will always want to use this terminus
    //   to inject content into the found node. This will not always be the case, and different types of interpretation
    //   are probably desired.
    interpretTextTerminusNode : function (terminusNode, $currElement, elementToInject) {

        if (terminusNode === undefined || terminusNode.type !== "textTerminus") {

            throw cfiRuntimeErrors.NodeTypeError(terminusNode, "expected text terminus node");
        }

        var $injectedElement = cfiInstructions.textTermination(
            $currElement,
            terminusNode.offsetValue,
            elementToInject
            );

        return $injectedElement;
    },

    searchLocalPathForHref : function ($currElement, $packageDocument, localPathNode, classBlacklist, elementBlacklist, idBlacklist) {

        // Interpret the first local_path node, which is a set of steps and and a terminus condition
        var stepNum = 0;
        var nextStepNode;
        for (stepNum = 0 ; stepNum <= localPathNode.steps.length - 1 ; stepNum++) {

            nextStepNode = localPathNode.steps[stepNum];
            if (nextStepNode.type === "indexStep") {

                $currElement = this.interpretIndexStepNode(nextStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist);
            }
            else if (nextStepNode.type === "indirectionStep") {

                $currElement = this.interpretIndirectionStepNode(nextStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist);
            }

            // Found the content document href referenced by the spine item
            if (cfiInstructions._matchesLocalNameOrElement($currElement[0], "itemref")) {
                return cfiInstructions.retrieveItemRefHref($currElement, $packageDocument);
            }
        }

        return undefined;
    }
};

return obj;
}










if (typeof define == 'function' && typeof define.amd == 'object') {
    console.log("RequireJS ... cfi_interpreter");

    define(['jquery', 'readium_cfi_js/cfi_parser', './cfi_instructions', './cfi_runtime_errors'],
    function ($, cfiParser, cfiInstructions, cfiRuntimeErrors) {
        return init($, cfiParser, cfiInstructions, cfiRuntimeErrors);
    });
} else {
    console.log("!RequireJS ... cfi_interpreter");

    if (!global["EPUBcfi"]) {
        throw new Error("EPUBcfi not initialised on global object?! (window or this context)");
    }
    global.EPUBcfi.Interpreter =
    init($,
        global.EPUBcfi.Parser,
        global.EPUBcfi.CFIInstructions,
        {
            NodeTypeError: global.EPUBcfi.NodeTypeError,
            OutOfRangeError: global.EPUBcfi.OutOfRangeError,
            TerminusError: global.EPUBcfi.TerminusError,
            CFIAssertionError: global.EPUBcfi.CFIAssertionError
        });
}

})(typeof window !== "undefined" ? window : this);
