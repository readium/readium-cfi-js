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
import { NodeTypeError, OutOfRangeError, TerminusError } from './errors';
import { applyBlacklist, matchesLocalNameOrElement } from './util';

// Description: This model contains the implementation for "instructions" included in the
//   EPUB CFI domain specific language (DSL).
//   Lexing and parsing a CFI produces a set of executable instructions for
//   processing a CFI (represented in the AST).
//   This object contains a set of functions that implement each of the
//   executable instructions in the AST.

// ------------------------------------------------------------------------------------ //
//  "PUBLIC" METHODS (THE API) are exported using the `export` keyword                  //
// ------------------------------------------------------------------------------------ //

function indexOutOfRange(targetIndex, numChildElements) {
  return targetIndex > numChildElements - 1;
}

// Description: Step reference for xml element node. Expected that CFIStepValue is an even integer
function elementNodeStep(CFIStepValue, $currNode, classBlacklist, elementBlacklist, idBlacklist) {
  const jqueryTargetNodeIndex = (CFIStepValue / 2) - 1;

  const $blacklistExcluded = $(applyBlacklist(
    $currNode.children().toArray(),
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  ));
  const numElements = $blacklistExcluded.length;

  if (indexOutOfRange(jqueryTargetNodeIndex, numElements)) {
    throw new OutOfRangeError(jqueryTargetNodeIndex, numElements - 1, '');
  }

  return $($blacklistExcluded[jqueryTargetNodeIndex]);
}

// Rationale: In order to inject an element into a specific position, access to the parent object
//   is required. This is obtained with the jquery parent() method. An alternative would be to
//   pass in the parent with a filtered list containing only children that
//   are part of the target text node.
export function injectCFIMarkerIntoText($textNodeList, textOffset, elementToInject) {
  const $textNodeListToMutate = $textNodeList;
  const { ownerDocument } = $textNodeList[0];

  let currTextPosition = 0;
  // The iteration counter may be incorrect here (should be $textNodeList.length - 1 ??)
  for (let nodeNum = 0; nodeNum <= $textNodeList.length; nodeNum += 1) {
    if ($textNodeList[nodeNum].nodeType === Node.TEXT_NODE) {
      let $injectedNode;
      const currNodeMaxIndex = $textNodeList[nodeNum].nodeValue.length + currTextPosition;
      const nodeOffset = textOffset - currTextPosition;
      if (currNodeMaxIndex > textOffset) {
        // This node is going to be split and the components re-inserted
        const originalText = $textNodeList[nodeNum].nodeValue;

        // Before part
        $textNodeListToMutate[nodeNum].nodeValue = originalText.slice(0, nodeOffset);

        // Injected element
        $injectedNode = $(elementToInject).insertAfter($textNodeList.eq(nodeNum));

        // After part
        const newText = originalText.slice(nodeOffset, originalText.length);
        const newTextNode = ownerDocument.createTextNode(newText);

        $(newTextNode).insertAfter($injectedNode);

        return $injectedNode;
      } else if (currNodeMaxIndex === textOffset) {
        $injectedNode = $(elementToInject).insertAfter($textNodeList.eq(nodeNum));
        return $injectedNode;
      }
      currTextPosition = currNodeMaxIndex;
    } else if ($textNodeList[nodeNum].nodeType === Node.COMMENT_NODE) {
      currTextPosition = $textNodeList[nodeNum].nodeValue.length + 7 + currTextPosition;
    } else if ($textNodeList[nodeNum].nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      currTextPosition =
        $textNodeList[nodeNum].nodeValue.length + $textNodeList[nodeNum].target.length + 5;
    }
  }

  throw new TerminusError(
    'Text',
    `Text offset:${textOffset}`,
    'The offset exceeded the length of the text',
  );
}

// Description: This method finds a target text node and then injects an element into the
//   appropriate node
// Rationale: The possibility that cfi marker elements have been injected into a
//   text node at some point previous to this method being called
//   (and thus splitting the original text node into two separate text nodes) necessitates that
//   the set of nodes that compromised the original target text node are inferred and returned.
// Notes: Passed a current node. This node should have a set of elements under it.
//   This will include at least one text node,
//   element nodes (maybe), or possibly a mix.
// REFACTORING CANDIDATE: This method is pretty long (and confusing).
//   Worth investigating to see if it can be refactored into something clearer.
function inferTargetTextNode(
  CFIStepValue,
  $currNode,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  let currLogicalTextNodeIndex;
  let prevNodeWasTextNode;

  // Remove any cfi marker elements from the set of elements.
  // Rationale: A filtering function is used, as simply using a class selector with
  //   jquery appears to result in behaviour where text nodes are also filtered out,
  //   along with the class element being filtered.
  const $elementsWithoutMarkers = $(applyBlacklist(
    $currNode.contents().toArray(),
    classBlacklist,
    elementBlacklist,
    idBlacklist,
  ));

  // Convert CFIStepValue to logical index; assumes odd integer for the step value
  const targetLogicalTextNodeIndex = ((parseInt(CFIStepValue, 10) + 1) / 2) - 1;

  // Set text node position counter
  currLogicalTextNodeIndex = 0;
  prevNodeWasTextNode = false;
  const $targetTextNodeList = $elementsWithoutMarkers.filter(function filter() {
    if (currLogicalTextNodeIndex === targetLogicalTextNodeIndex) {
      // If it's a text node
      if (
        this.nodeType === Node.TEXT_NODE ||
        this.nodeType === Node.COMMENT_NODE ||
        this.nodeType === Node.PROCESSING_INSTRUCTION_NODE
      ) {
        prevNodeWasTextNode = true;
        return true;
      } else if (prevNodeWasTextNode && this.nodeType !== Node.TEXT_NODE) {
        // Rationale: The logical text node position is only incremented once a group of text nodes
        //   (a single logical text node) has been passed by the loop.
        currLogicalTextNodeIndex += 1;
        prevNodeWasTextNode = false;
        return false;
      }
      return false;
    }
    // Don't return any elements
    if (
      this.nodeType === Node.TEXT_NODE ||
      this.nodeType === Node.COMMENT_NODE ||
      this.nodeType === Node.PROCESSING_INSTRUCTION_NODE
    ) {
      prevNodeWasTextNode = true;
    } else if (!prevNodeWasTextNode && this.nodeType === Node.ELEMENT_NODE) {
      currLogicalTextNodeIndex += 1;
      prevNodeWasTextNode = true;
    } else if (
      prevNodeWasTextNode &&
      this.nodeType !== Node.TEXT_NODE &&
      this !== $elementsWithoutMarkers.lastChild
    ) {
      currLogicalTextNodeIndex += 1;
      prevNodeWasTextNode = false;
    }

    return false;
  });

  // The filtering above should have counted the number of "logical" text nodes; this can be used to
  // detect out of range errors
  if ($targetTextNodeList.length === 0) {
    throw new OutOfRangeError(
      targetLogicalTextNodeIndex,
      currLogicalTextNodeIndex,
      'Index out of range',
    );
  }

  // return the text node list
  return $targetTextNodeList;
}

// Description: Follows a step
// Rationale: The use of children() is important here
//   as this jQuery method returns a tree of xml nodes, EXCLUDING
//   CDATA and text nodes. When we index into the set of child elements,
//   we are assuming that text nodes have been
//   excluded.
export function followIndexStep(
  CFIStepValue,
  $currNode,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  // Find the jquery index for the current node
  let $targetNode;
  if (CFIStepValue % 2 === 0) {
    $targetNode = elementNodeStep(
      CFIStepValue,
      $currNode,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    );
  } else {
    $targetNode = inferTargetTextNode(
      CFIStepValue,
      $currNode,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    );
  }

  return $targetNode;
}

// Rationale: Compatibility.
//   `followIndexStep` used to be named `getNextNode`
export { followIndexStep as getNextNode };

// Description: This instruction executes an indirection step, where a resource is retrieved using a
//   link contained on a attribute of the target element.
//   The attribute that contains the link differs depending on the target.
// Note: Iframe indirection will (should) fail if the iframe is not from the same domain as
//   it's containing script due to the cross origin security policy
export function followIndirectionStep(
  CFIStepValue,
  $currNode,
  classBlacklist,
  elementBlacklist,
  idBlacklist,
) {
  let $contentDocument;
  let $blacklistExcluded;
  let $startElement;
  let $targetNode;

  // TODO: This check must be expanded to all the different types of indirection step
  // Only expects iframes, at the moment
  if ($currNode === undefined || !matchesLocalNameOrElement($currNode[0], 'iframe')) {
    throw new NodeTypeError($currNode, 'expected an iframe element');
  }

  // Check node type; only iframe indirection is handled, at the moment
  if (matchesLocalNameOrElement($currNode[0], 'iframe')) {
    // Get content
    $contentDocument = $currNode.contents();

    // Go to the first XHTML element, which will be the first child of the top-level document object
    $blacklistExcluded = $(applyBlacklist(
      $contentDocument.children().toArray(),
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    ));
    $startElement = $($blacklistExcluded[0]);

    // Follow an index step
    $targetNode = followIndexStep(
      CFIStepValue,
      $startElement,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    );

    return $targetNode;
  }

  // TODO: Other types of indirection
  // TODO: $targetNode.is("embed")) : src
  // TODO: ($targetNode.is("object")) : data
  // TODO: ($targetNode.is("image") || $targetNode.is("xlink:href")) : xlink:href

  return undefined;
}

// Description: Injects an element at the specified text node
// Arguments: a cfi text termination string, a jquery object to the current node
// REFACTORING CANDIDATE: Rename this to indicate that it injects into a text terminus
export function textTermination($currNode, textOffset, elementToInject) {
  // Get the first node, this should be a text node
  if ($currNode === undefined) {
    throw new NodeTypeError($currNode, 'expected a terminating node, or node list');
  } else if ($currNode.length === 0) {
    throw new TerminusError(
      'Text',
      `Text offset:${textOffset}`,
      'no nodes found for termination condition',
    );
  }

  return injectCFIMarkerIntoText($currNode, textOffset, elementToInject);
}

// Description: Checks that the id assertion for the node target matches that on
//   the found node.
export function targetIdMatchesIdAssertion($foundNode, idAssertion) {
  return $foundNode.attr('id') === idAssertion;
}

// Rationale: Compatibility.
//   `applyBlacklist` used to be exported by this module
export { applyBlacklist };
