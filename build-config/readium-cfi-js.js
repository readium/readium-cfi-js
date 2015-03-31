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

define(['cfi-parser', 'cfi-interpreter', 'cfi-instructions', 'cfi-runtime-errors', 'cfi-generator'],
function (cfiParser, cfiInterpreter, cfiInstructions, cfiRuntimeErrors, cfiGenerator) {

    var EPUBcfi = {
        getContentDocHref : function (CFI, packageDocument) {
            return cfiInterpreter.getContentDocHref(CFI, packageDocument);
        },
        injectElement : function (CFI, contentDocument, elementToInject, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiInterpreter.injectElement(CFI, contentDocument, elementToInject, classBlacklist, elementBlacklist, idBlacklist);
        },
        getTargetElement : function (CFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiInterpreter.getTargetElement(CFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist);
        },
        getTargetElementWithPartialCFI : function (contentDocumentCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiInterpreter.getTargetElementWithPartialCFI(contentDocumentCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist);
        },
        injectRangeElements : function (rangeCFI, contentDocument, startElementToInject, endElementToInject, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiInterpreter.injectRangeElements(rangeCFI, contentDocument, startElementToInject, endElementToInject, classBlacklist, elementBlacklist, idBlacklist);
        },
        getRangeTargetElements : function (rangeCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiInterpreter.getRangeTargetElements(rangeCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist);
        },
        isRangeCfi : function (cfi) {
          return cfiInterpreter.isRangeCfi(cfi);
        },
        getTextTerminusInfoWithPartialCFI : function (contentDocumentCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiInterpreter.getTextTerminusInfoWithPartialCFI(contentDocumentCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist);
        },
        generateCharacterOffsetCFIComponent : function (startTextNode, characterOffset, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiGenerator.generateCharacterOffsetCFIComponent(startTextNode, characterOffset, classBlacklist, elementBlacklist, idBlacklist);
        },
        generateElementCFIComponent : function (startElement, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiGenerator.generateElementCFIComponent(startElement, classBlacklist, elementBlacklist, idBlacklist);
        },
        generatePackageDocumentCFIComponent : function (contentDocumentName, packageDocument, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiGenerator.generatePackageDocumentCFIComponent(contentDocumentName, packageDocument, classBlacklist, elementBlacklist, idBlacklist);
        },
        generatePackageDocumentCFIComponentWithSpineIndex : function (spineIndex, packageDocument, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiGenerator.generatePackageDocumentCFIComponentWithSpineIndex(spineIndex, packageDocument, classBlacklist, elementBlacklist, idBlacklist);
        },
        generateCompleteCFI : function (packageDocumentCFIComponent, contentDocumentCFIComponent) {
            return cfiGenerator.generateCompleteCFI(packageDocumentCFIComponent, contentDocumentCFIComponent);
        },
        generateCharOffsetRangeComponent : function (rangeStartElement, startOffset, rangeEndElement, endOffset, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiGenerator.generateCharOffsetRangeComponent(rangeStartElement, startOffset, rangeEndElement, endOffset, classBlacklist, elementBlacklist, idBlacklist);
        },
        generateElementRangeComponent : function (rangeStartElement, rangeEndElement, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiGenerator.generateElementRangeComponent(rangeStartElement, rangeEndElement, classBlacklist, elementBlacklist, idBlacklist);
        },
        generateRangeComponent : function (rangeStartElement, startOffset, rangeEndElement, endOffset, classBlacklist, elementBlacklist, idBlacklist) {
            return cfiGenerator.generateRangeComponent(rangeStartElement, startOffset, rangeEndElement, endOffset, classBlacklist, elementBlacklist, idBlacklist);
        },
        injectElementAtOffset : function ($textNodeList, textOffset, elementToInject) {
            return cfiInstructions.injectCFIMarkerIntoText($textNodeList, textOffset, elementToInject);
        }
    };
    
    
    // TODO: remove global (should not be necessary in properly-configured RequireJS build!)
    // -----
    EPUBcfi.CFIInstructions = cfiInstructions;
    EPUBcfi.Parser = cfiParser;
    EPUBcfi.Interpreter = cfiInterpreter;
    EPUBcfi.Generator = cfiGenerator;
    
    EPUBcfi.NodeTypeError= cfiRuntimeErrors.NodeTypeError;
    EPUBcfi.OutOfRangeError = cfiRuntimeErrors.OutOfRangeError;
    EPUBcfi.TerminusError = cfiRuntimeErrors.TerminusError;
    EPUBcfi.CFIAssertionError = cfiRuntimeErrors.CFIAssertionError;
    
    window.EPUBcfi = EPUBcfi;
    // -----
    
    
    return EPUBcfi;
});
