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

import intersection from 'lodash-es/intersection';

export function matchesLocalNameOrElement(element, otherNameOrElement) {
  if (typeof otherNameOrElement === 'string') {
    return (element.localName || element.nodeName) === otherNameOrElement;
  }
  return element === otherNameOrElement;
}

function getClassNameArray(element) {
  const { className } = element;
  if (typeof className === 'string') {
    return className.split(/\s/);
  }
  if (typeof className === 'object' && 'baseVal' in className) {
    return className.baseVal.split(/\s/);
  }
  return [];
}

function isElementBlacklisted(element, classBlacklist, elementBlacklist, idBlacklist) {
  if (classBlacklist && classBlacklist.length) {
    const classList = getClassNameArray(element);
    if (classList.length === 1 && classBlacklist.includes(classList[0])) {
      return false;
    }
    if (classList.length && intersection(classBlacklist, classList).length) {
      return false;
    }
  }

  if (elementBlacklist && elementBlacklist.length) {
    if (element.tagName) {
      const isElementInBlacklist = elementBlacklist.find((blacklistedTag) =>
        matchesLocalNameOrElement(element, blacklistedTag.toLowerCase()),
      );

      if (isElementInBlacklist) {
        return false;
      }
    }
  }

  if (idBlacklist && idBlacklist.length) {
    const { id } = element;
    if (id && id.length && idBlacklist.includes(id)) {
      return false;
    }
  }

  return true;
}

export function applyBlacklist(elements, classBlacklist, elementBlacklist, idBlacklist) {
  return [...elements].filter((element) =>
    isElementBlacklisted(element, classBlacklist, elementBlacklist, idBlacklist),
  );
}

export function retrieveItemRefHref(itemRefElement, packageDocument) {
  const idref = itemRefElement.getAttribute('idref');
  if (idref) {
    const node = packageDocument.querySelector(`[id=${idref}]`);
    if (node) {
      return node.getAttribute('href');
    }
  }
  return undefined;
}
