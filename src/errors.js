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

// Description: This is a set of runtime errors that the CFI interpreter can throw.
// Rationale: These error types extend the basic javascript error object so error things like
//  the stack trace are included with the runtime errors.

// REFACTORING CANDIDATE: This type of error may not be required in the long run.
//   The parser should catch any syntax errors,
//   provided it is error-free, and as such, the AST should never really have any node type errors,
//   which are essentially errors
//   in the structure of the AST. This error should probably be refactored out when the grammar and
//   interpreter are more stable.

export class NodeTypeError extends Error {
  constructor(node, message) {
    super(message);
    this.node = node;
  }
}

// REFACTORING CANDIDATE: Might make sense to include some more specifics about
//   the out-of-rangeyness.
export class OutOfRangeError extends Error {
  constructor(targetIndex, maxIndex, message) {
    super(message);
    this.targetIndex = targetIndex;
    this.maxIndex = maxIndex;
  }
}

// REFACTORING CANDIDATE: This is a bit too general to be useful.
//   When I have a better understanding of the type of errors that can occur with
//   the various terminus conditions, it'll make more sense to revisit this.
export class TerminusError extends Error {
  constructor(terminusType, terminusCondition, message) {
    super(message);
    this.terminusType = terminusType;
    this.terminusCondition = terminusCondition;
  }
}

export class CFIAssertionError extends Error {
  constructor(expectedAssertion, targetElementAssertion, message) {
    super(message);
    this.expectedAssertion = expectedAssertion;
    this.targetElementAssertion = targetElementAssertion;
  }
}
