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
import { NodeTypeError, OutOfRangeError } from './errors';
import { applyBlacklist, matchesLocalNameOrElement } from './util';

// ------------------------------------------------------------------------------------ //
//  "PUBLIC" METHODS (THE API) are exported using the `export` keyword                  //
// ------------------------------------------------------------------------------------ //

function validateStartTextNode(startTextNode, characterOffset) {
  // Check that the text node to start from IS a text node
  if (!startTextNode) {
    throw new NodeTypeError(
      startTextNode,
      'Cannot generate a character offset from a starting point that is not a text node',
    );
  } else if (startTextNode.nodeType !== 3) {
    throw new NodeTypeError(
      startTextNode,
      'Cannot generate a character offset from a starting point that is not a text node',
    );
  }

  // Check that the character offset is within a valid range for the text node supplied
  if (characterOffset < 0) {
    throw new OutOfRangeError(characterOffset, 0, 'Character offset cannot be less than 0');
  } else if (characterOffset > startTextNode.nodeValue.length) {
    throw new OutOfRangeError(
      characterOffset,
      startTextNode.nodeValue.length - 1,
      'character offset cannot be greater than the length of the text node',
    );
  }
}

function validateTargetElement(startElement) {
  if (!startElement) {
    throw new NodeTypeError(startElement, 'CFI target element is undefined');
  }
}

export function validateStartElement(startElement) {
  validateTargetElement(startElement);

  if (!(startElement.nodeType && startElement.nodeType === 1)) {
    throw new NodeTypeError(startElement, 'CFI target element is not an HTML element');
  }
}

function validateContentDocumentName(contentDocumentName) {
  // Check that the idref for the content document has been provided
  if (!contentDocumentName) {
    throw new Error('The idref for the content document, as found in the spine, must be supplied');
  }
}

function findSpineItemNode(packageDocument, idref) {
  return [...packageDocument.getElementsByTagNameNS('*', 'itemref')].find(
    (element) => element.getAttribute('idref') === idref,
  );
}

function validatePackageDocument(packageDocument, contentDocumentName) {
  // Check that the package document is non-empty and contains
  // an itemref element for the supplied idref
  if (!packageDocument) {
    throw new Error('A package document must be supplied to generate a CFI');
  }

  const spineItemNode = findSpineItemNode(packageDocument, contentDocumentName);

  if (!spineItemNode) {
    throw new Error('The idref of the content document could not be found in the spine');
  }
}

function validNodeTypesFilter(node) {
  return node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE;
}

function normalizeDomRange(domRange) {
  const { startContainer, endContainer, commonAncestorContainer } = domRange;

  if (commonAncestorContainer.nodeType !== Node.ELEMENT_NODE) {
    // No need for normalization on ranges where the ancestor is not an element
    return;
  }

  if (startContainer.nodeType !== Node.TEXT_NODE && endContainer.nodeType !== Node.TEXT_NODE) {
    // and one of the start/end nodes must be a text node
    return;
  }

  if (startContainer === commonAncestorContainer) {
    const [firstChildNode] = [...startContainer.childNodes].filter(validNodeTypesFilter);
    if (firstChildNode) {
      domRange.setStart(firstChildNode, 0);
    }
  }

  if (endContainer === commonAncestorContainer) {
    const [lastChildNode] = [...endContainer.childNodes].filter(validNodeTypesFilter).slice(-1);
    if (lastChildNode) {
      if (lastChildNode.length) {
        domRange.setEnd(lastChildNode, lastChildNode.length);
      } else if (lastChildNode.hasChildNodes()) {
        domRange.setEnd(lastChildNode, lastChildNode.childNodes.length);
      } else {
        domRange.setEnd(lastChildNode, 1);
      }
    }
  }
}

// Description: Creates a CFI terminating step to a text node, with a character offset
// REFACTORING CANDIDATE: Some of the parts of this method
//   could be refactored into their own methods
export function createCFITextNodeStep(
  $startTextNode,
  characterOffset,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  let indexOfTextNode = -1;

  // Find text node position in the set of child elements, ignoring any blacklisted elements
  const $parentNode = $startTextNode.parent();
  const $contentsExcludingMarkers = $(
    applyBlacklist($parentNode.contents().toArray(), classBlacklist, elementBlacklist, idBlacklist),
  );

  // Find the text node index in the parent list,
  // inferring nodes that were originally a single text node
  let prevNodeWasTextNode;
  let indexOfFirstInSequence;
  let textNodeOnlyIndex = 0;
  let characterOffsetSinceUnsplit = 0;
  let finalCharacterOffsetInSequence = 0;
  $.each($contentsExcludingMarkers, function each() {
    // If this is a text node, check if it matches and return the current index
    if (this.nodeType === Node.TEXT_NODE || !prevNodeWasTextNode) {
      if (this.nodeType === Node.TEXT_NODE) {
        if (this === $startTextNode[0]) {
          // Set index as the first in the adjacent sequence of text nodes,
          // or as the index of the current node if this
          //   node is a standard one sandwiched between two element nodes.
          if (prevNodeWasTextNode) {
            indexOfTextNode = indexOfFirstInSequence;
            finalCharacterOffsetInSequence = characterOffsetSinceUnsplit;
          } else {
            indexOfTextNode = textNodeOnlyIndex;
          }

          // Break out of .each loop
          return false;
        }

        // Save this index as the first in sequence of adjacent text nodes,
        // if it is not already set by this point
        prevNodeWasTextNode = true;
        characterOffsetSinceUnsplit += this.length;
        if (indexOfFirstInSequence === undefined) {
          indexOfFirstInSequence = textNodeOnlyIndex;
          textNodeOnlyIndex += 1;
        }
      } else if (this.nodeType === Node.ELEMENT_NODE) {
        textNodeOnlyIndex += 1;
      } else if (this.nodeType === Node.COMMENT_NODE) {
        prevNodeWasTextNode = true;
        // 7 is the size of the html comment tag <!--[comment]-->
        characterOffsetSinceUnsplit = characterOffsetSinceUnsplit + this.length + 7;
        if (indexOfFirstInSequence === undefined) {
          indexOfFirstInSequence = textNodeOnlyIndex;
        }
      } else if (this.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
        prevNodeWasTextNode = true;
        // 5 is the size of the instruction processing tag including the required space between
        // the target and the data <?[target] [data]?>
        characterOffsetSinceUnsplit =
          characterOffsetSinceUnsplit + this.data.length + this.target.length + 5;
        if (indexOfFirstInSequence === undefined) {
          indexOfFirstInSequence = textNodeOnlyIndex;
        }
      }
    } else if (this.nodeType === Node.ELEMENT_NODE) {
      // This node is not a text node
      prevNodeWasTextNode = false;
      indexOfFirstInSequence = undefined;
      characterOffsetSinceUnsplit = 0;
    } else if (this.nodeType === Node.COMMENT_NODE) {
      // <!--[comment]-->
      characterOffsetSinceUnsplit = characterOffsetSinceUnsplit + this.length + 7;
    } else if (this.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      // <?[target] [data]?>
      characterOffsetSinceUnsplit =
        characterOffsetSinceUnsplit + this.data.length + this.target.length + 5;
    }

    return true;
  });

  // Convert the text node index to a CFI odd-integer representation
  const CFIIndex = indexOfTextNode * 2 + 1;

  // TODO: text assertions are not in the grammar yet, I think, or they're just causing problems.
  // This has been temporarily removed.

  // Add pre- and post- text assertions
  // preAssertionStartIndex = (characterOffset - 3 >= 0) ? characterOffset - 3 : 0;
  // preAssertion = $startTextNode[0].nodeValue.substring(preAssertionStartIndex, characterOffset);

  // textLength = $startTextNode[0].nodeValue.length;
  // postAssertionEndIndex = (characterOffset + 3 <= textLength) ? characterOffset + 3 : textLength;
  // postAssertion = $startTextNode[0].nodeValue.substring(characterOffset, postAssertionEndIndex);

  // Gotta infer the correct character offset, as well

  // Return the constructed CFI text node step
  return `/${CFIIndex}:${finalCharacterOffsetInSequence + characterOffset}`;
  // + "[" + preAssertion + "," + postAssertion + "]";
}

export function createCFIElementSteps(
  $currNode,
  topLevelElement,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  let currNodePosition = -1;
  let elementStep;

  // Find position of current node in parent list
  const $blacklistExcluded = $(
    applyBlacklist(
      $currNode
        .parent()
        .children()
        .toArray(),
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    ),
  );
  $.each($blacklistExcluded, function each(index) {
    if (this === $currNode[0]) {
      currNodePosition = index;

      // Break loop
      return false;
    }
    return true;
  });

  // Convert position to the CFI even-integer representation
  const CFIPosition = (currNodePosition + 1) * 2;

  // Create CFI step with id assertion, if the element has an id
  if ($currNode.attr('id')) {
    elementStep = `/${CFIPosition}[${$currNode.attr('id')}]`;
  } else {
    elementStep = `/${CFIPosition}`;
  }

  // If a parent is an html element return the (last) step for
  //   this content document, otherwise, continue.
  //   Also need to check if the current node is the top-level element.
  //   This can occur if the start node is also the top level element.
  const $parentNode = $currNode.parent();
  if (
    (typeof topLevelElement === 'string' &&
      matchesLocalNameOrElement($parentNode[0], topLevelElement)) ||
    matchesLocalNameOrElement($currNode[0], topLevelElement)
  ) {
    return elementStep;
  }

  if ($parentNode[0] === topLevelElement || $currNode[0] === topLevelElement) {
    return elementStep;
  }

  return (
    createCFIElementSteps(
      $parentNode,
      topLevelElement,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    ) + elementStep
  );
}

export function generateDocumentRangeComponent(
  domRange,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  normalizeDomRange(domRange);

  const {
    startContainer, // Range Start Element
    endContainer, // Range End Element
    startOffset,
    endOffset,
    commonAncestorContainer,
  } = domRange;

  const { ownerDocument } = startContainer;

  let range1CFI;
  let range1OffsetStep;
  let range2CFI;
  let range2OffsetStep;
  let commonCFIComponent;

  if (startContainer.nodeType === Node.TEXT_NODE && endContainer.nodeType === Node.TEXT_NODE) {
    // Parent element is the same
    if ($(startContainer).parent()[0] === $(endContainer).parent()[0]) {
      range1OffsetStep = createCFITextNodeStep(
        $(startContainer),
        startOffset,
        classBlacklist,
        elementBlacklist,
        idBlacklist,
      );
      range2OffsetStep = createCFITextNodeStep(
        $(endContainer),
        endOffset,
        classBlacklist,
        elementBlacklist,
        idBlacklist,
      );
      commonCFIComponent = createCFIElementSteps(
        $(startContainer).parent(),
        ownerDocument.documentElement,
        classBlacklist,
        elementBlacklist,
        idBlacklist,
      );
      return `${commonCFIComponent},${range1OffsetStep},${range2OffsetStep}`;
    }
  }

  if (
    startContainer.nodeType === Node.ELEMENT_NODE &&
    endContainer.nodeType === Node.ELEMENT_NODE &&
    startContainer === endContainer &&
    commonAncestorContainer === startContainer
  ) {
    const startElement = commonAncestorContainer.childNodes[startOffset];
    let endElement;
    if (endOffset === commonAncestorContainer.childNodes.length) {
      endElement = commonAncestorContainer.childNodes[endOffset - 1];
    } else {
      endElement = commonAncestorContainer.childNodes[endOffset].previousSibling;
    }

    // Generate shared component
    commonCFIComponent = createCFIElementSteps(
      $(commonAncestorContainer),
      ownerDocument.documentElement,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    );

    range1CFI = createCFIElementSteps(
      $(startElement),
      commonAncestorContainer,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    );

    if (startElement === endElement) {
      return commonCFIComponent + range1CFI;
    }

    range2CFI = createCFIElementSteps(
      $(endElement),
      commonAncestorContainer,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    );

    // Return the result
    return `${commonCFIComponent},${range1CFI},${range2CFI}`;
  }
  if (startContainer.nodeType === Node.ELEMENT_NODE) {
    validateStartElement(startContainer);
    range1CFI = createCFIElementSteps(
      $(startContainer),
      commonAncestorContainer,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    );
  } else {
    validateStartTextNode(startContainer);
    // Generate terminating offset and range 1
    range1OffsetStep = createCFITextNodeStep(
      $(startContainer),
      startOffset,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    );
    if ($(startContainer).parent()[0] === commonAncestorContainer) {
      range1CFI = range1OffsetStep;
    } else {
      range1CFI =
        createCFIElementSteps(
          $(startContainer).parent(),
          commonAncestorContainer,
          classBlacklist,
          elementBlacklist,
          idBlacklist,
        ) + range1OffsetStep;
    }
  }

  if (endContainer.nodeType === Node.ELEMENT_NODE) {
    validateStartElement(endContainer);
    range2CFI = createCFIElementSteps(
      $(endContainer),
      commonAncestorContainer,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    );
  } else {
    validateStartTextNode(endContainer);
    // Generate terminating offset and range 2
    range2OffsetStep = createCFITextNodeStep(
      $(endContainer),
      endOffset,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    );
    if ($(endContainer).parent()[0] === commonAncestorContainer) {
      range2CFI = range2OffsetStep;
    } else {
      range2CFI =
        createCFIElementSteps(
          $(endContainer).parent(),
          commonAncestorContainer,
          classBlacklist,
          elementBlacklist,
          idBlacklist,
        ) + range2OffsetStep;
    }
  }

  // Generate shared component
  commonCFIComponent = createCFIElementSteps(
    $(commonAncestorContainer),
    ownerDocument.documentElement,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Return the result
  return `${commonCFIComponent},${range1CFI},${range2CFI}`;
}

export function generateRangeComponent(
  rangeStartElement,
  startOffset,
  rangeEndElement,
  endOffset,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  const { ownerDocument } = rangeStartElement;

  // Create a document range from inputs
  const docRange = ownerDocument.createRange();
  docRange.setStart(rangeStartElement, startOffset);
  docRange.setEnd(rangeEndElement, endOffset);

  return generateDocumentRangeComponent(docRange, classBlacklist, elementBlacklist, idBlacklist);
}

export function generateCharOffsetRangeComponent(
  rangeStartElement,
  startOffset,
  rangeEndElement,
  endOffset,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  const { ownerDocument } = rangeStartElement;

  validateStartTextNode(rangeStartElement);
  validateStartTextNode(rangeEndElement);

  // Create a document range to find the common ancestor
  const docRange = ownerDocument.createRange();
  docRange.setStart(rangeStartElement, startOffset);
  docRange.setEnd(rangeEndElement, endOffset);

  return generateDocumentRangeComponent(docRange, classBlacklist, elementBlacklist, idBlacklist);
}

export function generateElementRangeComponent(
  rangeStartElement,
  rangeEndElement,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  const { ownerDocument } = rangeStartElement;

  // Create a document range from inputs
  const docRange = ownerDocument.createRange();
  docRange.setStartBefore(rangeStartElement);
  docRange.setEndAfter(rangeEndElement);

  return generateDocumentRangeComponent(docRange, classBlacklist, elementBlacklist, idBlacklist);
}

// Description: Generates a character offset CFI
// Arguments: The text node that contains the offset referenced by the cfi,
//   the offset value, the name of the content document that contains
//   the text node, the package document for this EPUB.
export function generateCharacterOffsetCFIComponent(
  startTextNode,
  characterOffset,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  validateStartTextNode(startTextNode, characterOffset);

  // Create the text node step
  const textNodeStep = createCFITextNodeStep(
    $(startTextNode),
    characterOffset,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Call the recursive method to create all the steps up to the head element
  // of the content document
  // (typically the "html" element, or the "svg" element)
  return (
    createCFIElementSteps(
      $(startTextNode).parent(),
      startTextNode.ownerDocument.documentElement,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    ) + textNodeStep
  );
}

export function generateElementCFIComponent(
  startElement,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  validateStartElement(startElement);

  // Call the recursive method to create all the steps up to the head element
  // of the content document
  // (typically the "html" element, or the "svg" element)
  return createCFIElementSteps(
    $(startElement),
    startElement.ownerDocument.documentElement,
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );
}

export function generatePackageDocumentCFIComponent(
  contentDocumentName,
  packageDocument,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  validateContentDocumentName(contentDocumentName);
  validatePackageDocument(packageDocument, contentDocumentName);

  // Get the start node (itemref element) that references the content document
  const $itemRefStartNode = $(findSpineItemNode(packageDocument, contentDocumentName));

  // Create the steps up to the top element of the package document (the "package" element)
  const packageDocCFIComponent = createCFIElementSteps(
    $itemRefStartNode,
    'package',
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Append an !;
  // this assumes that a CFI content document CFI component will be appended at some point
  return `${packageDocCFIComponent}!`;
}

export function generatePackageDocumentCFIComponentWithSpineIndex(
  spineIndex,
  packageDocument,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  // Get the start node (itemref element) that references the content document
  const spineItemNode = packageDocument.getElementsByTagNameNS('*', 'spine');
  const $itemRefStartNode = $($(spineItemNode).children()[spineIndex]);

  // Create the steps up to the top element of the package document (the "package" element)
  const packageDocCFIComponent = createCFIElementSteps(
    $itemRefStartNode,
    'package',
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  );

  // Append an !;
  // this assumes that a CFI content document CFI component will be appended at some point
  return `${packageDocCFIComponent}!`;
}

export function generateCompleteCFI(packageDocumentCFIComponent, contentDocumentCFIComponent) {
  return `epubcfi(${packageDocumentCFIComponent}${contentDocumentCFIComponent})`;
}
