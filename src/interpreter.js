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

import $ from 'jquery';
import { parse as parseCFI } from './parser';
import { CFIAssertionError, NodeTypeError } from './errors';
import { matchesLocalNameOrElement, retrieveItemRefHref } from './util';
import {
  followIndirectionStep,
  followIndexStep,
  targetIdMatchesIdAssertion,
  textTermination,
} from './instructions';

// Description: This is an interpreter that inteprets an Abstract Syntax Tree (AST) for a CFI.
//   The result of executing the interpreter
//   is to inject an element, or set of elements, into an EPUB content document
//   (which is just an XHTML document). These element(s) will
//   represent the position or area in the EPUB referenced by a CFI.
// Rationale: The AST is a clean and readable expression of the step-terminus structure of a CFI.
//   Although building an interpreter adds to the
//   CFI infrastructure, it provides a number of benefits.
//   First, it emphasizes a clear separation of concerns between lexing/parsing a
//   CFI, which involves some complexity related to escaped and special characters,
//   and the execution of the underlying set of steps
//   represented by the CFI. Second, it will be easier to extend the interpreter to account for
//   new/altered CFI steps (say for references
//   to vector objects or multiple CFIs) than if lexing, parsing and
//   interpretation were all handled in a single step. Finally, Readium's objective is
//   to demonstrate implementation of the EPUB 3.0 spec. An implementation with a
//   strong separation of concerns that conforms to
//   well-understood patterns for DSL processing should be easier to communicate,
//   analyze and understand.
// REFACTORING CANDIDATE: node type errors shouldn't really be possible if the CFI syntax is correct
//   and the parser is error free.
//   Might want to make the script die in those instances,
//   once the grammar and interpreter are more stable.
// REFACTORING CANDIDATE: The use of the 'nodeType' property is confusing as this is a
//   DOM node property and the two are unrelated.
//   Whoops. There shouldn't be any interference, however, I think this should be changed.

// ------------------------------------------------------------------------------------ //
//  "PUBLIC" METHODS (THE API) are exported using the `export` keyword                  //
// ------------------------------------------------------------------------------------ //

function getFirstIndirectionStepNum(CFIAST) {
  // Find the first indirection step in the local path; follow it like a regular step,
  //   as the step in the content document it references is already loaded
  //   and has been passed to this method
  for (let stepNum = 0; stepNum <= CFIAST.cfiString.localPath.steps.length - 1; stepNum += 1) {
    const nextStepNode = CFIAST.cfiString.localPath.steps[stepNum];
    if (nextStepNode.type === 'indirectionStep') {
      return stepNum;
    }
  }

  return undefined;
}

function splitRangeCFIAST(CFIAST, firstRange) {
  const outCFIAST = $.extend(true, {}, CFIAST);
  const targetRange = firstRange ? CFIAST.cfiString.range1 : CFIAST.cfiString.range2;

  delete outCFIAST.cfiString.range1;
  delete outCFIAST.cfiString.range2;
  outCFIAST.cfiString.type = 'path';

  outCFIAST.cfiString.localPath.steps =
    outCFIAST.cfiString.localPath.steps.concat(targetRange.steps);

  outCFIAST.cfiString.localPath.termStep = targetRange.termStep;

  return outCFIAST;
}

function decomposeCFI(CFI) {
  const decodedCFI = decodeURI(CFI);
  const CFIAST = parseCFI(decodedCFI);

  if (!CFIAST || CFIAST.type !== 'CFIAST') {
    throw new NodeTypeError(CFIAST, 'expected CFI AST root node');
  }

  const decomposedASTs = [];
  if (CFIAST.cfiString.type === 'range') {
    decomposedASTs.push(splitRangeCFIAST(CFIAST, true));
    decomposedASTs.push(splitRangeCFIAST(CFIAST, false));
  } else {
    decomposedASTs.push(CFIAST);
  }

  return decomposedASTs;
}

function concatStepsFromCFIAST(CFIAST) {
  return CFIAST.cfiString.localPath.steps.map(o => parseInt(o.stepLength, 10));
}

function compareCFIASTs(CFIAST1, CFIAST2) {
  let result = null;
  let index = 0;
  const steps1 = concatStepsFromCFIAST(CFIAST1);
  const steps2 = concatStepsFromCFIAST(CFIAST2);
  const term1 = CFIAST1.cfiString.localPath.termStep;
  const term2 = CFIAST2.cfiString.localPath.termStep;

  for (; ;) {
    const L = steps1[index];
    const R = steps2[index];
    if (!L || !R) {
      if (result === 0 && (term1.offsetValue || term2.offsetValue)) {
        const tL = parseInt(term1.offsetValue, 10) || 0;
        const tR = parseInt(term2.offsetValue, 10) || 0;
        if (tL > tR) {
          result = 1;
        } else if (tL < tR) {
          result = -1;
        } else {
          result = 0;
        }
      }
      break;
    }
    if (L > R) {
      result = 1;
      break;
    } else if (L < R) {
      result = -1;
      break;
    } else {
      result = 0;
    }
    index += 1;
  }

  return result;
}

export function interpretIndexStepNode(
  indexStepNode,
  $currElement,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  // Check node type; throw error if wrong type
  if (indexStepNode === undefined || indexStepNode.type !== 'indexStep') {
    throw new NodeTypeError(indexStepNode, 'expected index step node');
  }

  // Index step
  const $stepTarget = followIndexStep(
    indexStepNode.stepLength,
    $currElement,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Check the id assertion, if it exists
  if (indexStepNode.idAssertion) {
    if (!targetIdMatchesIdAssertion($stepTarget, indexStepNode.idAssertion)) {
      throw new CFIAssertionError(
        indexStepNode.idAssertion,
        $stepTarget.attr('id'),
        'Id assertion failed',
      );
    }
  }

  return $stepTarget;
}

export function interpretIndirectionStepNode(
  indirectionStepNode,
  $currElement,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  // Check node type; throw error if wrong type
  if (indirectionStepNode === undefined || indirectionStepNode.type !== 'indirectionStep') {
    throw new NodeTypeError(indirectionStepNode, 'expected indirection step node');
  }

  // Indirection step
  const $stepTarget = followIndirectionStep(
    indirectionStepNode.stepLength,
    $currElement,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Check the id assertion, if it exists
  if (indirectionStepNode.idAssertion) {
    if (!targetIdMatchesIdAssertion($stepTarget, indirectionStepNode.idAssertion)) {
      throw new CFIAssertionError(
        indirectionStepNode.idAssertion,
        $stepTarget.attr('id'),
        'Id assertion failed',
      );
    }
  }

  return $stepTarget;
}

function searchLocalPathForHref(
  $currElement,
  packageDocument,
  localPathNode,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  // Interpret the first local_path node, which is a set of steps and and a terminus condition
  let nextStepNode;
  let $foundElement;
  for (let stepNum = 0; stepNum <= localPathNode.steps.length - 1; stepNum += 1) {
    nextStepNode = localPathNode.steps[stepNum];
    if (nextStepNode.type === 'indexStep') {
      $foundElement = interpretIndexStepNode(
        nextStepNode,
        $currElement,
        classBlacklist,
        elementBlacklist,
        idBlacklist,
      );
    } else if (nextStepNode.type === 'indirectionStep') {
      $foundElement = interpretIndirectionStepNode(
        nextStepNode,
        $currElement,
        classBlacklist,
        elementBlacklist,
        idBlacklist,
      );
    }
    const [foundElement] = $foundElement;
    // Found the content document href referenced by the spine item
    if (matchesLocalNameOrElement(foundElement, 'itemref')) {
      return retrieveItemRefHref(foundElement, packageDocument);
    }
  }

  return undefined;
}

// REFACTORING CANDIDATE: cfiString node and start step num could be merged into one argument,
//   by simply passing the starting step...
//   probably a good idea, this would make the meaning of this method clearer.
function interpretLocalPath(
  localPathNode,
  startStepNum,
  $currElement,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  let nextStepNode;
  for (let stepNum = startStepNum; stepNum <= localPathNode.steps.length - 1; stepNum += 1) {
    nextStepNode = localPathNode.steps[stepNum];
    if (nextStepNode.type === 'indexStep') {
      // TODO: parameter reassignment side-effect is critical for the usage of this function
      // eslint-disable-next-line no-param-reassign
      $currElement = interpretIndexStepNode(
        nextStepNode,
        $currElement,
        classBlacklist,
        elementBlacklist,
        idBlacklist,
      );
    } else if (nextStepNode.type === 'indirectionStep') {
      // TODO: parameter reassignment side-effect is critical for the usage of this function
      // eslint-disable-next-line no-param-reassign
      $currElement = interpretIndirectionStepNode(
        nextStepNode,
        $currElement,
        classBlacklist,
        elementBlacklist,
        idBlacklist,
      );
    }
  }

  return $currElement;
}

// REFACTORING CANDIDATE: The logic here assumes that a user will always want to use this terminus
//   to inject content into the found node. This will not always be the case,
//   and different types of interpretation are probably desired.
export function interpretTextTerminusNode(terminusNode, $currElement, elementToInject) {
  if (terminusNode === undefined || terminusNode.type !== 'textTerminus') {
    throw new NodeTypeError(terminusNode, 'expected text terminus node');
  }

  return textTermination(
    $currElement,
    terminusNode.offsetValue,
    elementToInject,
  );
}

// Description: Find the content document referenced by the spine item.
//   This should be the spine item referenced by the first indirection step in the CFI.
// Rationale: This method is a part of the API so that the
//   reading system can "interact" the content document
//   pointed to by a CFI. If this is not a separate step, the processing of the CFI must be
//   tightly coupled with the reading system, as it stands now.
export function getContentDocHref(
  CFI,
  packageDocument,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  const decodedCFI = decodeURI(CFI);
  const CFIAST = parseCFI(decodedCFI);

  if (!CFIAST || CFIAST.type !== 'CFIAST') {
    throw new NodeTypeError(CFIAST, 'expected CFI AST root node');
  }

  // Interpet the path node (the package document step)
  const $packageElement = $(packageDocument.getElementsByTagNameNS('*', 'package'));
  const $currElement = interpretIndexStepNode(
    CFIAST.cfiString.path,
    $packageElement,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );
  const foundHref = searchLocalPathForHref(
    $currElement,
    packageDocument,
    CFIAST.cfiString.localPath,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  if (foundHref) {
    return foundHref;
  }

  return undefined;
}

// Description: Compare two given CFIs
//  Either CFI can be expressed in range form.
//  Assuming the CFIs reference the same content document (partial CFIs)
//  Because of this the output is an array with two integers.
//  If both integers are the same then you can simplify the results into a single integer.
//  The integer indicates that:
//      -1 | CFI location point A is located before CFI location point B
//       0 | CFI location point A is the same as CFI location point B
//       1 | CFI location point A is located after CFI location point B
//  If both integers are different then the first integer is
//      a comparison between the start location of CFI range A and the start location of CFI range B
//  The second integer is
//      a comparison between the end location of CFI range A and the end location of CFI range B.
export function compareCFIs(cfiA, cfiB) {
  const decomposedCFI1 = decomposeCFI(cfiA);
  const decomposedCFI2 = decomposeCFI(cfiB);

  if (decomposedCFI1.length > 1 && decomposedCFI2.length > 1) {
    return [
      compareCFIASTs(decomposedCFI1[0], decomposedCFI2[0]),
      compareCFIASTs(decomposedCFI1[1], decomposedCFI2[1]),
    ];
  } else if (decomposedCFI1.length > 1 && decomposedCFI2.length === 1) {
    return [
      compareCFIASTs(decomposedCFI1[0], decomposedCFI2[0]),
      compareCFIASTs(decomposedCFI1[1], decomposedCFI2[0]),
    ];
  } else if (decomposedCFI1.length === 1 && decomposedCFI2.length > 1) {
    return [
      compareCFIASTs(decomposedCFI1[0], decomposedCFI2[0]),
      compareCFIASTs(decomposedCFI1[0], decomposedCFI2[1]),
    ];
  }
  const result = compareCFIASTs(decomposedCFI1[0], decomposedCFI2[0]);
  return [result, result];
}

// Description: Inject an arbitrary html element into a position
//   in a content document referenced by a CFI
export function injectElement(
  CFI,
  contentDocument,
  elementToInject,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  const decodedCFI = decodeURI(CFI);
  const CFIAST = parseCFI(decodedCFI);
  let $currElement;

  // Rationale: Since the correct content document for this CFI is already being passed,
  //   we can skip to the beginning of the indirection step that referenced the content document.
  // Note: This assumes that indirection steps and index steps conform to an interface:
  //   an object with stepLength, idAssertion
  const indirectionStepNum = getFirstIndirectionStepNum(CFIAST);
  const indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
  indirectionNode.type = 'indexStep';

  // Interpret the rest of the steps
  $currElement = interpretLocalPath(
    CFIAST.cfiString.localPath,
    indirectionStepNum,
    $(contentDocument.documentElement, contentDocument),
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // TODO: detect what kind of terminus; for now, text node termini are the only kind implemented
  $currElement = interpretTextTerminusNode(
    CFIAST.cfiString.localPath.termStep,
    $currElement,
    elementToInject,
  );

  // Return the element that was injected into
  return $currElement;
}

// Description: Inject an arbitrary html element into a position in
//   a content document referenced by a CFI
export function injectRangeElements(
  rangeCFI,
  contentDocument,
  startElementToInject,
  endElementToInject,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  const decodedCFI = decodeURI(rangeCFI);
  const CFIAST = parseCFI(decodedCFI);
  let $range1TargetElement;
  let $range2TargetElement;

  // Rationale: Since the correct content document for this CFI is already being passed,
  //   we can skip to the beginning
  //   of the indirection step that referenced the content document.
  // Note: This assumes that indirection steps and index steps conform to an interface:
  //   an object with stepLength, idAssertion
  const indirectionStepNum = getFirstIndirectionStepNum(CFIAST);
  const indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
  indirectionNode.type = 'indexStep';

  // Interpret the rest of the steps in the first local path
  const $currElement = interpretLocalPath(
    CFIAST.cfiString.localPath,
    indirectionStepNum,
    $(contentDocument.documentElement, contentDocument),
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Interpret the first range local_path
  $range1TargetElement = interpretLocalPath(
    CFIAST.cfiString.range1,
    0,
    $currElement,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );
  $range1TargetElement = interpretTextTerminusNode(
    CFIAST.cfiString.range1.termStep,
    $range1TargetElement,
    startElementToInject,
  );

  // Interpret the second range local_path
  $range2TargetElement = interpretLocalPath(
    CFIAST.cfiString.range2,
    0,
    $currElement,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );
  $range2TargetElement = interpretTextTerminusNode(
    CFIAST.cfiString.range2.termStep,
    $range2TargetElement,
    endElementToInject,
  );

  // Return the element that was injected into
  return {
    startElement: $range1TargetElement[0],
    endElement: $range2TargetElement[0],
  };
}

// Description: This method will return the element or node (say, a text node)
//   that is the final target of the the CFI.
export function getTargetElement(
  CFI,
  contentDocument,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  const decodedCFI = decodeURI(CFI);
  const CFIAST = parseCFI(decodedCFI);

  // Rationale: Since the correct content document for this CFI is already being passed,
  //   we can skip to the beginning of the indirection step that referenced the content document.
  // Note: This assumes that indirection steps and index steps conform to an interface:
  //   an object with stepLength, idAssertion
  const indirectionStepNum = getFirstIndirectionStepNum(CFIAST);
  const indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
  indirectionNode.type = 'indexStep';

  // Interpret the rest of the steps and eturn the element at the end of the CFI
  return interpretLocalPath(
    CFIAST.cfiString.localPath,
    indirectionStepNum,
    $(contentDocument.documentElement, contentDocument),
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );
}

// Description: This method will return the start and end elements (along with their char offsets)
//   hat are the final targets of the range CFI.
export function getRangeTargetElements(
  rangeCFI,
  contentDocument,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  const decodedCFI = decodeURI(rangeCFI);
  const CFIAST = parseCFI(decodedCFI);

  // Rationale: Since the correct content document for this CFI is already being passed,
  //   we can skip to the beginning of the indirection step that referenced the content document.
  // Note: This assumes that indirection steps and index steps conform to an interface:
  //   an object with stepLength, idAssertion
  const indirectionStepNum = getFirstIndirectionStepNum(CFIAST);
  const indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
  indirectionNode.type = 'indexStep';

  // Interpret the rest of the steps
  const $currElement = interpretLocalPath(
    CFIAST.cfiString.localPath,
    indirectionStepNum,
    $(contentDocument.documentElement, contentDocument),
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Interpret first range local_path
  const $range1TargetElement = interpretLocalPath(
    CFIAST.cfiString.range1,
    0,
    $currElement,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Interpret second range local_path
  const $range2TargetElement = interpretLocalPath(
    CFIAST.cfiString.range2,
    0,
    $currElement,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Get the start and end character offsets
  const startOffset = parseInt(CFIAST.cfiString.range1.termStep.offsetValue, 10) || undefined;
  const endOffset = parseInt(CFIAST.cfiString.range2.termStep.offsetValue, 10) || undefined;

  // Return the element (and char offsets) at the end of the CFI
  return {
    startElement: $range1TargetElement[0],
    startOffset,
    endElement: $range2TargetElement[0],
    endOffset,
  };
}

// Description: This method allows a "partial" CFI to be used to reference
//   a target in a content document, without a package document CFI component.
// Arguments: {
//     contentDocumentCFI:
//        This is a partial CFI that represents a path in a content document only.
//        This partial must be syntactically valid, even though it references a path starting at
//        the top of a content document (which is a CFI that has no defined meaning in the spec.)
//     contentDocument:
//        A DOM representation of the content document to which the partial CFI refers.
// }
// Rationale: This method exists to meet the requirements of the Readium-SDK
//   and should be used with care
export function getTargetElementWithPartialCFI(
  contentDocumentCFI,
  contentDocument,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  const decodedCFI = decodeURI(contentDocumentCFI);
  const CFIAST = parseCFI(decodedCFI);

  // Interpret the path node
  let $currElement = interpretIndexStepNode(
    CFIAST.cfiString.path,
    $(contentDocument.documentElement, contentDocument),
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Interpret the rest of the steps
  $currElement = interpretLocalPath(
    CFIAST.cfiString.localPath,
    0,
    $currElement,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Return the element at the end of the CFI
  return $currElement;
}

// Description: This method allows a "partial" CFI to be used, with a content document,
//   to return the text node and offset referenced by the partial CFI.
// Arguments: {
//     contentDocumentCFI:
//        This is a partial CFI that represents a path in a content document only.
//        This partial must be syntactically valid, even though it references a path starting at
//        the top of a content document (which is a CFI that has no defined meaning in the spec.)
//     contentDocument:
//        A DOM representation of the content document to which the partial CFI refers.
// }
export function getTextTerminusInfoWithPartialCFI(
  contentDocumentCFI,
  contentDocument,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  const decodedCFI = decodeURI(contentDocumentCFI);
  const CFIAST = parseCFI(decodedCFI);

  // Interpret the path node
  let $currElement = interpretIndexStepNode(
    CFIAST.cfiString.path,
    $(contentDocument.documentElement, contentDocument),
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Interpret the rest of the steps
  $currElement = interpretLocalPath(
    CFIAST.cfiString.localPath,
    0,
    $currElement,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Return the element at the end of the CFI
  const textOffset = parseInt(CFIAST.cfiString.localPath.termStep.offsetValue, 10);
  return {
    textNode: $currElement[0],
    textOffset,
  };
}

// Description: This method will return the element or node (say, a text node)
//   that is the final target of the the CFI, along with the text terminus offset.
export function getTextTerminusInfo(
  CFI,
  contentDocument,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  const decodedCFI = decodeURI(CFI);
  const CFIAST = parseCFI(decodedCFI);

  // Rationale: Since the correct content document for this CFI is already being passed,
  //   we can skip to the beginning of the indirection step that referenced the content document.
  // Note: This assumes that indirection steps and index steps conform to an interface:
  //   an object with stepLength, idAssertion
  const indirectionStepNum = getFirstIndirectionStepNum(CFIAST);
  const indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
  indirectionNode.type = 'indexStep';

  // Interpret the rest of the steps
  const $currElement = interpretLocalPath(
    CFIAST.cfiString.localPath,
    indirectionStepNum,
    $(contentDocument.documentElement, contentDocument),
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Return the element at the end of the CFI
  const textOffset = parseInt(CFIAST.cfiString.localPath.termStep.offsetValue, 10);
  return {
    textNode: $currElement[0],
    textOffset,
  };
}

// Description: This function will determine if the input "partial" CFI is expressed as a range
export function isRangeCfi(CFI) {
  const decodedCFI = CFI ? decodeURI(CFI) : undefined;
  const CFIAST = parseCFI(decodedCFI);
  if (!CFIAST || CFIAST.type !== 'CFIAST') {
    throw new NodeTypeError(CFIAST, 'expected CFI AST root node');
  }
  return CFIAST.cfiString.type === 'range';
}

// Description: This function will determine if the input "partial" CFI has a text terminus step
export function hasTextTerminus(CFI) {
  const decodedCFI = CFI ? decodeURI(CFI) : undefined;
  const CFIAST = parseCFI(decodedCFI);
  if (!CFIAST || CFIAST.type !== 'CFIAST') {
    throw new NodeTypeError(CFIAST, 'expected CFI AST root node');
  }
  return !!CFIAST.cfiString.localPath.termStep;
}
