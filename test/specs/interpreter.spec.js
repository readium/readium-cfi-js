import $ from 'jquery';
import { Interpreter, Instructions, Parser } from '../../src/index';
import { CFIAssertionError, NodeTypeError } from '../../src/errors';

import fixtureMobyDickPackage from '../fixtures/moby_dick_package.opf';
import fixtureMobyDickContentDoc from '../fixtures/moby_dick_content_doc.xhtml';

describe('CFI INTERPRETER OBJECT', () => {
  let testCFI;
  let testCFIAST;
  let $packageDocument;
  let contentDocument;
  let $contentDocument;

  beforeEach(() => {
    // Generate CFI AST to reference a paragraph in the Moby Dick test features
    testCFI = 'epubcfi(/6/14!/4/2/14/1:4)';
    testCFIAST = Parser.parse(testCFI);

    // Set up package document
    const domParser = new window.DOMParser();
    const packageDocXML = fixtureMobyDickPackage;
    $packageDocument = $(domParser.parseFromString(packageDocXML, 'text/xml'));

    // Set up content document
    const contentDocXHTML = fixtureMobyDickContentDoc;
    contentDocument = domParser.parseFromString(contentDocXHTML, 'text/xml');
    $contentDocument = $(contentDocument);

    spyOn($, 'ajax').and.callFake((params) => {
      params.success(domParser.parseFromString(contentDocXHTML, 'text/xml'));
    });
  });

  it('can inject into text when supplied with a content document', () => {
    const expectedResult = 'c01p0006';
    const $injectedElement = Interpreter.injectElement(testCFI, contentDocument, '<span></span>');
    expect($injectedElement.parent().attr('id')).toBe(expectedResult);
  });

  it('can inject into a node containing comments', () => {
    const dom =
      '<html>' +
      '<div></div>' +
      '<div>' +
      "<div id='startParent'>" +
      '<!-- comment -->' + // size=16
      'text1 text2 text3' +
      '</div>' +
      '</div>' +
      '<div></div>' +
      '</html>';

    const $dom = $(new window.DOMParser().parseFromString(dom, 'text/xml'));

    const CFI = 'epubcfi(/6/14!/4/2[startParent],/1:22,/1:27)';

    Interpreter.injectRangeElements(
      CFI,
      $dom[0],
      "<span id='start' class='cfi-marker'></span>",
      "<span id='end' class='cfi-marker'></span>",
      ['cfi-marker'],
    );

    const result = $($($($dom.contents()).contents()[1]).contents()).contents()[3];
    expect(result.data).toEqual('text2');
  });

  it('can inject into a node containing processing instructions', () => {
    const dom =
      '<html>' +
      '<div></div>' +
      '<div>' +
      "<div id='startParent'>" +
      "<?xml-stylesheet type='text/css' href='style.css'?>" + // size=51
      'text1 text2 text3' +
      '</div>' +
      '</div>' +
      '<div></div>' +
      '</html>';

    const $dom = $(new window.DOMParser().parseFromString(dom, 'text/xml'));

    const CFI = 'epubcfi(/6/14!/4/2[startParent],/1:57,/1:62)';

    Interpreter.injectRangeElements(
      CFI,
      $dom[0],
      "<span id='start' class='cfi-marker'></span>",
      "<span id='end' class='cfi-marker'></span>",
      ['cfi-marker'],
    );

    const result = $($($($dom.contents()).contents()[1]).contents()).contents()[3];
    expect(result.data).toEqual('text2');
  });

  it('can inject into a node containing processing instructions and comments', () => {
    const dom =
      '<html>' +
      '<div></div>' +
      '<div>' +
      "<div id='startParent'>" +
      "<?xml-stylesheet type='text/css' href='style.css'?>" + // size=51
      '<!-- comment -->' + // size=16
      'text1 text2 text3' +
      '</div>' +
      '</div>' +
      '<div></div>' +
      '</html>';

    const $dom = $(new window.DOMParser().parseFromString(dom, 'text/xml'));

    const CFI = 'epubcfi(/6/14!/4/2[startParent],/1:73,/1:78)';

    Interpreter.injectRangeElements(
      CFI,
      $dom[0],
      "<span id='start' class='cfi-marker'></span>",
      "<span id='end' class='cfi-marker'></span>",
      ['cfi-marker'],
    );

    const result = $($($($dom.contents()).contents()[1]).contents()).contents()[4];

    expect(result.data).toEqual('text2');
  });

  it('can inject into previously injected text node (dmitry)', () => {
    const dom =
      '<html>' +
      '<div></div>' +
      '<div>' +
      "<div id='startParent'>" +
      '012' +
      "<span class='cfi-marker' id='start'></span>" +
      '34' +
      "<span class='cfi-marker' id='end'></span>" +
      '56789' +
      '</div>' +
      '</div>' +
      '<div></div>' +
      '</html>';

    const $dom = $(new window.DOMParser().parseFromString(dom, 'text/xml'));

    const CFI = 'epubcfi(/6/14!/4/2[startParent],/1:6,/1:7)';

    Interpreter.injectRangeElements(
      CFI,
      $dom[0],
      "<span id='start' class='cfi-marker'></span>",
      "<span id='end' class='cfi-marker'></span>",
      ['cfi-marker'],
    );

    const result = $($($($dom.contents()).contents()[1]).contents()).contents()[6];
    expect(result.data).toEqual('6');
  });

  it('can inject a marker properly (dmitry)', () => {
    const $currNode = $(
      '<div>0<div class="cfiMarker"></div>12345<div class="cfiMarker"></div>6789</div>',
    );
    const $targetTextNodeList = Instructions.followIndexStep(1, $currNode, ['cfiMarker'], []);

    const injectedNode = Instructions.injectCFIMarkerIntoText(
      $targetTextNodeList,
      6,
      "<span id='start' class='cfi-marker'></span>",
    );
    expect(injectedNode.parent().contents()[5].nodeValue).toBe('6789');
  });

  it('can inject a marker properly #2 (dmitry)', () => {
    const $currNode = $(
      '<div>012<div class="cfiMarker"></div>34<div class="cfiMarker"></div>56789</div>',
    );
    const $targetTextNodeList = Instructions.followIndexStep(1, $currNode, ['cfiMarker'], []);

    const injectedNode = Instructions.injectCFIMarkerIntoText(
      $targetTextNodeList,
      6,
      "<span id='start' class='cfi-marker'></span>",
    );
    expect(injectedNode.parent().contents()[4].nodeValue).toBe('5');
  });

  it('can inject into a node with a period in the id', () => {
    const dom =
      '<html>' +
      '<div></div>' +
      '<div>' +
      "<div id='start.Parent'>" +
      '0' +
      "<span class='cfi-marker' id='start'></span>" +
      '12345' +
      "<span class='cfi-marker' id='end'></span>" +
      '6789' +
      '</div>' +
      '</div>' +
      '<div></div>' +
      '</html>';

    const $dom = $(new window.DOMParser().parseFromString(dom, 'text/xml'));

    const CFI = 'epubcfi(/6/14!/4/2[start.Parent],/1:6,/1:8)';

    Interpreter.injectRangeElements(
      CFI,
      $dom[0],
      "<span id='start' class='cfi-marker'></span>",
      "<span id='end' class='cfi-marker'></span>",
      ['cfi-marker'],
    );

    // Whitespace text-nodes and changing jquery implementation may break this
    const result = $($($($dom.contents()).contents()[1]).contents()).contents()[6];
    expect(result.data).toEqual('67');
  });

  it('can inject into previously injected text node #2', () => {
    const dom =
      '<html>' +
      '<div></div>' +
      '<div>' +
      "<div id='startParent'>" +
      '0' +
      "<span class='cfi-marker' id='start'></span>" +
      '12345' +
      "<span class='cfi-marker' id='end'></span>" +
      '6789' +
      '</div>' +
      '</div>' +
      '<div></div>' +
      '</html>';

    const $dom = $(new window.DOMParser().parseFromString(dom, 'text/xml'));

    const CFI = 'epubcfi(/6/14!/4/2[startParent],/1:6,/1:8)';

    Interpreter.injectRangeElements(
      CFI,
      $dom[0],
      "<span id='start' class='cfi-marker'></span>",
      "<span id='end' class='cfi-marker'></span>",
      ['cfi-marker'],
    );

    // Whitespace text-nodes and changing jquery implementation may break this
    const result = $($($($dom.contents()).contents()[1]).contents()).contents()[6];
    expect(result.data).toEqual('67');
  });

  it('returns a text node CFI target', () => {
    const CFI = 'epubcfi(/6/14!/4/2/14/1:4)';
    const textNode = 3;
    const $result = Interpreter.getTargetElement(CFI, contentDocument);
    expect($result[0].nodeType).toEqual(textNode);
  });

  it('returns an element target for a CFI with no terminus', () => {
    const CFI = 'epubcfi(/6/14!/4/2/14)';
    const expectedResult = 'c01p0006';
    const $result = Interpreter.getTargetElement(CFI, contentDocument);
    expect($result.attr('id')).toEqual(expectedResult);
  });

  it('interprets an index step node without an id assertion', () => {
    const $expectedResult = $($('spine', $packageDocument)[0]);
    const $result = Interpreter.interpretIndexStepNode(
      testCFIAST.cfiString.path,
      $($packageDocument.children()[0]),
    );

    expect($result.children()[0]).toEqual($expectedResult.children()[0]);
  });

  it('injects an element for a text terminus with a text location assertion', () => {
    const $injectedElement = Interpreter.interpretTextTerminusNode(
      testCFIAST.cfiString.localPath.termStep,
      $($('#c01p0002', $contentDocument)[0].firstChild),
      '<span class="cfi_marker"></span>',
    );

    expect($injectedElement.parent().contents().length).toBe(3);
  });

  // Rationale: This test is really only testing the decodeURI() method, which does not require testing. This spec exists
  //   as a reminder that the interpreter currently uses this method to decode URI-encoded CFIs.
  it('decodes a CFI for URI escape characters', () => {
    const cfi = 'epubcfi(/2[%20%25%22af]/4/1:4)';
    const decodedCFI = decodeURI(cfi);
    expect(decodedCFI).toBe('epubcfi(/2[ %"af]/4/1:4)');
  });

  it('returns the href of a content document for the first indirection step of a cfi', () => {
    const result = Interpreter.getContentDocHref(testCFI, $packageDocument[0]);
    expect(result).toBe('chapter_001.xhtml');
  });

  describe('range CFI interpretation', () => {
    it('can determine that a CFI is a range CFI or not', () => {
      const rangeCFI = 'epubcfi(/6/14!/4,/2/14/1:4,/2/16/1:7)';

      const singleTextTerminusCfi = 'epubcfi(/6/14!/4/2/14[c01p0006]/1:4)';
      expect(Interpreter.isRangeCfi(rangeCFI)).toEqual(true);
      expect(Interpreter.isRangeCfi(singleTextTerminusCfi)).toEqual(false);
    });

    it('can determine that a CFI has a text terminus CFI or not', () => {
      const rangeCFI = 'epubcfi(/6/14!/4,/2/14/1:4,/2/16/1:7)';

      const singleTextTerminusCfi = 'epubcfi(/6/14!/4/2/14[c01p0006]/1:4)';
      expect(Interpreter.hasTextTerminus(rangeCFI)).toEqual(false);
      expect(Interpreter.hasTextTerminus(singleTextTerminusCfi)).toEqual(true);
    });

    it('returns the href of a content document in the first local path', () => {
      const CFI = 'epubcfi(/6/14!/4,/4/4,/4/6)';
      const href = Interpreter.getContentDocHref(CFI, $packageDocument[0]);
      expect(href).toBe('chapter_001.xhtml');
    });

    it('can inject into the same text node', () => {
      const CFI = 'epubcfi(/6/14!/4,/2/14/1:4,/2/14/1:18)';
      const expectedResult = 'c01p0006';
      const rangeInfo = Interpreter.injectRangeElements(
        CFI,
        contentDocument,
        "<span id='start' class='injected-element'></span>",
        "<span id='end' class='injected-element'></span>",
        ['injected-element'],
      );
      expect(rangeInfo.startElement.id).toBe('start');
      expect(rangeInfo.endElement.id).toBe('end');
      expect(rangeInfo.startElement.parentElement.id).toBe(expectedResult);
      expect(rangeInfo.endElement.parentElement.id).toBe(expectedResult);
    });

    it('can inject into different text nodes', () => {
      const CFI = 'epubcfi(/6/14!/4,/2/14/1:4,/2/16/1:7)';
      const targetElement1 = 'c01p0006';
      const targetElement2 = 'c01p0007';
      const rangeInfo = Interpreter.injectRangeElements(
        CFI,
        contentDocument,
        "<span id='start' class='injected-element'></span>",
        "<span id='end' class='injected-element'></span>",
        ['injected-element'],
      );
      expect(rangeInfo.startElement.id).toBe('start');
      expect(rangeInfo.endElement.id).toBe('end');
      expect(rangeInfo.startElement.parentElement.id).toBe(targetElement1);
      expect(rangeInfo.endElement.parentElement.id).toBe(targetElement2);
    });

    it('can return target nodes when the target is the same text node', () => {
      const CFI = 'epubcfi(/6/14!/4,/2/14/1:4,/2/14/1:7)';
      const rangeInfo = Interpreter.getRangeTargetElements(CFI, contentDocument);
      expect(rangeInfo.startElement.nodeType).toBe(Node.TEXT_NODE);
      expect(rangeInfo.endElement.nodeType).toBe(Node.TEXT_NODE);
      expect(rangeInfo.startElement).toBe(rangeInfo.endElement);
      expect(rangeInfo.startOffset).toEqual(4);
      expect(rangeInfo.endOffset).toEqual(7);
    });

    it('can return target elements when the target is the same element', () => {
      const CFI = 'epubcfi(/6/14!/4,/2/14,/2/14)';
      const targetElement1 = 'c01p0006';
      const targetElement2 = 'c01p0006';
      const rangeInfo = Interpreter.getRangeTargetElements(CFI, contentDocument);
      expect(rangeInfo.startElement.id).toBe(targetElement1);
      expect(rangeInfo.endElement.id).toBe(targetElement2);
    });

    it('can return target nodes when the targets are different text nodes', () => {
      const CFI = 'epubcfi(/6/14!/4,/2/14/1:4,/2/16/1:7)';
      const rangeInfo = Interpreter.getRangeTargetElements(CFI, contentDocument);
      expect(rangeInfo.startElement.nodeType).toBe(Node.TEXT_NODE);
      expect(rangeInfo.endElement.nodeType).toBe(Node.TEXT_NODE);
      expect(rangeInfo.startElement).not.toBe(rangeInfo.endElement);
      expect(rangeInfo.startOffset).toEqual(4);
      expect(rangeInfo.endOffset).toEqual(7);
    });

    it('can return target elements when the targets are different elements', () => {
      const CFI = 'epubcfi(/6/14!/4,/2/14,/2/16)';
      const targetElement1 = 'c01p0006';
      const targetElement2 = 'c01p0007';
      const rangeInfo = Interpreter.getRangeTargetElements(CFI, contentDocument);
      expect(rangeInfo.startElement.id).toBe(targetElement1);
      expect(rangeInfo.endElement.id).toBe(targetElement2);

      // there should be no character offset data
      expect(rangeInfo.startOffset).toBeUndefined();
      expect(rangeInfo.endOffset).toBeUndefined();
    });
  });

  describe('The hack zone! Interpretation of partial CFIs', () => {
    it('can interpret a partial CFI for a content document', () => {
      const CFI = 'epubcfi(/4/2/14)';
      const expectedResult = 'c01p0006';
      const $result = Interpreter.getTargetElementWithPartialCFI(CFI, contentDocument);
      expect($result.attr('id')).toBe(expectedResult);
    });

    it('finds a text node and offset for a partial terminus CFI', () => {
      const CFI = 'epubcfi(/4/2/14/1:4)';
      const textNodeType = 3;
      const textTerminusInfo = Interpreter.getTextTerminusInfoWithPartialCFI(CFI, contentDocument);
      const { textNode, textOffset } = textTerminusInfo;

      expect(textNode.nodeType).toBe(textNodeType);
      expect(textOffset).toBe(4);
    });
  });

  describe('CFI comparison', () => {
    // -1 is cfiA is located before cfiB
    // 0 is cfiA is equal to cfiB
    // 1 is cfiA is located after cfiB

    it('can compare a CFI with equal paths', () => {
      const CFI1 = 'epubcfi(/4/2/14)';
      const CFI2 = 'epubcfi(/4/2/14)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([0, 0]);
    });

    it('can compare a CFI with equal paths and terminus', () => {
      const CFI1 = 'epubcfi(/4/2/14/1:123)';
      const CFI2 = 'epubcfi(/4/2/14/1:123)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([0, 0]);
    });

    it('can compare an equal CFI with a mix of assertions', () => {
      const CFI1 = 'epubcfi(/4/2[id]/14[0]/2/1:123)';
      const CFI2 = 'epubcfi(/4/2/14/2/1[abc123]:123[aaa,000;z=1])';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([0, 0]);
    });

    it("can compare CFIs where the first CFI has a location that's further ahead", () => {
      const CFI1 = 'epubcfi(/4/2/18/14/4/2/16)';
      const CFI2 = 'epubcfi(/4/2/14)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, 1]);
    });

    it("can compare CFIs where the first CFI has a location that's before the other", () => {
      const CFI1 = 'epubcfi(/4/2/1:123)';
      const CFI2 = 'epubcfi(/4/2/14)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, -1]);
    });

    it("can compare CFIs where the CFIs have equal paths but the first has a terminus step that's further ahead", () => {
      const CFI1 = 'epubcfi(/4/2/1:123)';
      const CFI2 = 'epubcfi(/4/2/1:0)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, 1]);
    });

    it("can compare CFIs where the CFIs have equal paths but the first has a terminus step that's before the other", () => {
      const CFI1 = 'epubcfi(/4/2/1:123)';
      const CFI2 = 'epubcfi(/4/2/1:456)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, -1]);
    });

    it('can compare CFIs where the CFIs have equal paths but the second has an implied terminus step, therefore further ahead', () => {
      const CFI1 = 'epubcfi(/4/2/1:456)';
      const CFI2 = 'epubcfi(/4/2/1)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, 1]);
    });

    it('can compare CFIs where the CFIs have equal paths but the first has an implied terminus step, therefore before the other', () => {
      const CFI1 = 'epubcfi(/4/2/1)';
      const CFI2 = 'epubcfi(/4/2/1:456)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, -1]);
    });

    it("can compare given range CFI inputs: equal start span, end span has the first path that's after", () => {
      const CFI1 = 'epubcfi(/4/2,/2,/6)';
      const CFI2 = 'epubcfi(/4/2,/2,/4)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([0, 1]);
    });

    it("can compare given range CFI inputs: equal start span, end span has the first path that's before", () => {
      const CFI1 = 'epubcfi(/4/2,/2,/4)';
      const CFI2 = 'epubcfi(/4/2,/2,/6)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([0, -1]);
    });

    it("can compare given range CFI inputs: start span has the first path that's after, equal end span", () => {
      const CFI1 = 'epubcfi(/4/2,/6,/2)';
      const CFI2 = 'epubcfi(/4/2,/4,/2)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, 0]);
    });

    it("can compare given range CFI inputs: start span has the first path that's before, equal end span", () => {
      const CFI1 = 'epubcfi(/4/2,/4,/2)';
      const CFI2 = 'epubcfi(/4/2,/6,/2)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, 0]);
    });

    it("can compare given range CFI inputs: start span has the first path that's after, end span has the first path that's after", () => {
      const CFI1 = 'epubcfi(/4/2,/6,/16)';
      const CFI2 = 'epubcfi(/4/2,/4,/14)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, 1]);
    });

    it("can compare given range CFI inputs: start span has the first path that's before, end span has the first path that's before", () => {
      const CFI1 = 'epubcfi(/4/2,/4,/14)';
      const CFI2 = 'epubcfi(/4/2,/6,/16)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, -1]);
    });

    it("can compare given range CFI inputs: start span has the first path that's after, end span has the first path that's before", () => {
      const CFI1 = 'epubcfi(/4/2,/6,/14)';
      const CFI2 = 'epubcfi(/4/2,/4,/16)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, -1]);
    });

    it("can compare given range CFI inputs: start span has the first path that's before, end span has the first path that's after", () => {
      const CFI1 = 'epubcfi(/4/2,/4,/16)';
      const CFI2 = 'epubcfi(/4/2,/6,/14)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, 1]);
    });

    it("can compare given range CFI inputs: the ranges don't overlap, the first range is ahead", () => {
      const CFI1 = 'epubcfi(/4/2,/6,/8)';
      const CFI2 = 'epubcfi(/4/2,/2,/4)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, 1]);
    });

    it("can compare given range CFI inputs: the ranges don't overlap, the first range is before", () => {
      const CFI1 = 'epubcfi(/4/2,/2,/4)';
      const CFI2 = 'epubcfi(/4/2,/4,/6)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, -1]);
    });

    it("can compare given range CFI inputs: the ranges don't overlap, the first range is ahead, the common component differs", () => {
      const CFI1 = 'epubcfi(/4/106,/6,/8)';
      const CFI2 = 'epubcfi(/4/62,/2,/4)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, 1]);
    });

    it("can compare given range CFI inputs: the ranges don't overlap, the first range is before, the common component differs", () => {
      const CFI1 = 'epubcfi(/4/62,/2,/4)';
      const CFI2 = 'epubcfi(/4/106,/4,/6)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, -1]);
    });

    it("can compare given character offset range CFI inputs: equal start span, end span has the first path that's after", () => {
      const CFI1 = 'epubcfi(/4/2,/1:2,/1:6)';
      const CFI2 = 'epubcfi(/4/2,/1:2,/1:4)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([0, 1]);
    });

    it("can compare given character offset range CFI inputs: equal start span, end span has the first path that's before", () => {
      const CFI1 = 'epubcfi(/4/2,/1:2,/1:4)';
      const CFI2 = 'epubcfi(/4/2,/1:2,/1:6)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([0, -1]);
    });

    it("can compare given character offset range CFI inputs: start span has the first path that's after, equal end span", () => {
      const CFI1 = 'epubcfi(/4/2,/1:6,/1:2)';
      const CFI2 = 'epubcfi(/4/2,/1:4,/1:2)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, 0]);
    });

    it("can compare given character offset range CFI inputs: start span has the first path that's before, equal end span", () => {
      const CFI1 = 'epubcfi(/4/2,/1:4,/1:2)';
      const CFI2 = 'epubcfi(/4/2,/1:6,/1:2)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, 0]);
    });

    it("can compare given character offset range CFI inputs: start span has the first path that's after, end span has the first path that's after", () => {
      const CFI1 = 'epubcfi(/4/2,/1:6,/1:16)';
      const CFI2 = 'epubcfi(/4/2,/1:4,/1:14)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, 1]);
    });

    it("can compare given character offset range CFI inputs: start span has the first path that's before, end span has the first path that's before", () => {
      const CFI1 = 'epubcfi(/4/2,/1:4,/1:14)';
      const CFI2 = 'epubcfi(/4/2,/1:6,/1:16)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, -1]);
    });

    it("can compare given character offset range CFI inputs: start span has the first path that's after, end span has the first path that's before", () => {
      const CFI1 = 'epubcfi(/4/2,/1:6,/1:14)';
      const CFI2 = 'epubcfi(/4/2,/1:4,/1:16)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, -1]);
    });

    it("can compare given character offset range CFI inputs: start span has the first path that's before, end span has the first path that's after", () => {
      const CFI1 = 'epubcfi(/4/2,/1:4,/1:16)';
      const CFI2 = 'epubcfi(/4/2,/1:6,/1:14)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, 1]);
    });

    it("can compare given character offset range CFI inputs: the ranges don't overlap, the first range is ahead", () => {
      const CFI1 = 'epubcfi(/4/2,/1:6,/1:8)';
      const CFI2 = 'epubcfi(/4/2,/1:2,/1:4)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, 1]);
    });

    it("can compare given character offset range CFI inputs: the ranges don't overlap, the first range is before", () => {
      const CFI1 = 'epubcfi(/4/2,/1:0,/1:2)';
      const CFI2 = 'epubcfi(/4/2,/1:2,/1:4)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, -1]);
    });

    it("can compare given character offset range CFI inputs: the ranges don't overlap, the first range is ahead, the common component differs", () => {
      const CFI1 = 'epubcfi(/4/106,/1:6,/1:8)';
      const CFI2 = 'epubcfi(/4/62,/3:2,/3:4)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([1, 1]);
    });

    it("can compare given character offset range CFI inputs: the ranges don't overlap, the first range is before, the common component differs", () => {
      const CFI1 = 'epubcfi(/4/62,/3:0,/3:2)';
      const CFI2 = 'epubcfi(/4/106,/1:2,/1:4)';

      expect(Interpreter.compareCFIs(CFI1, CFI2)).toEqual([-1, -1]);
    });
  });
});

describe('CFI INTERPRETER ERROR HANDLING', () => {
  describe('ERROR HANDLING FOR "NODE TYPE" ERRORS', () => {
    it('detects an index step "node type" error', () => {
      expect(() => {
        Interpreter.interpretIndexStepNode(undefined, undefined);
      }).toThrow(new NodeTypeError(undefined, 'expected index step node'));
    });

    it('detects an indirection step "node type" error', () => {
      expect(() => {
        Interpreter.interpretIndirectionStepNode(
          undefined,
          $('<itemref linear="yes" idref="xchapter_001"/>'),
        );
      }).toThrow(new NodeTypeError(undefined, 'expected indirection step node'));
    });

    it('detects a text terminus "node type" error', () => {
      expect(() => {
        Interpreter.interpretTextTerminusNode(undefined, undefined);
      }).toThrow(new NodeTypeError(undefined, 'expected text terminus node'));
    });
  });

  describe('ERROR HANDLING FOR ID AND TEXT ASSERTIONS', () => {
    let CFIAST;
    let $contentDocument;

    beforeEach(() => {
      // Set up package document
      const domParser = new window.DOMParser();

      // Set up content document
      const contentDocXHTML = fixtureMobyDickContentDoc;
      $contentDocument = $(domParser.parseFromString(contentDocXHTML, 'text/xml'));

      spyOn($, 'ajax').and.callFake((params) => {
        params.success(domParser.parseFromString(contentDocXHTML, 'text/xml'));
      });
    });

    it('detects a mis-match between an id assertion and a target element id, for an index step', () => {
      // Generate CFI AST to reference a paragraph in the Moby Dick test features
      CFIAST = Parser.parse('epubcfi(/6/14!/4/2/14[c01p0002]/1:4)');

      expect(() => {
        Interpreter.interpretIndexStepNode(
          CFIAST.cfiString.localPath.steps[3],
          $('section', $contentDocument),
        );
      }).toThrow(new CFIAssertionError('c01p0002', 'c01p0006', 'Id assertion failed'));
    });

    it('does not throw an error when the id assertion matches the target element id, for an index step', () => {
      // Generate CFI AST to reference a paragraph in the Moby Dick test features
      CFIAST = Parser.parse('epubcfi(/6/14!/4/2/14[c01p0006]/1:4)');

      // Expecting that no error is thrown; if one is, it'll cause this test to fail
      Interpreter.interpretIndexStepNode(
        CFIAST.cfiString.localPath.steps[3],
        $('section', $contentDocument),
      );
    });

    // Skip. It looks hard to mock ES6 module functions right now..
    xit('detects a mis-match between an id assertion and a target element id, for an indirection step', () => {
      // Generate CFI AST to reference a paragraph in the Moby Dick test features
      CFIAST = Parser.parse('epubcfi(/6/14!/4[body2]/2/14[c01p0006]/1:4)');

      // Faking the follow indirection step, it'll return an element with an id that doesn't match the assertion
      spyOn(Instructions, 'followIndirectionStep').and.callFake(() =>
        $('<body></body>').attr('id', 'body1'),
      );

      expect(() => {
        Interpreter.interpretIndirectionStepNode(CFIAST.cfiString.localPath.steps[1], undefined);
      }).toThrow(new CFIAssertionError('body2', 'body1', 'Id assertion failed'));
    });

    // Skip. It looks hard to mock ES6 module functions right now..
    xit('does not throw an error when the id assertion matches the target element id, for an indirection step', () => {
      // Generate CFI AST to reference a paragraph in the Moby Dick test features
      CFIAST = Parser.parse('epubcfi(/6/14!/4[body1]/2/14[c01p0002]/1:4)');

      // Faking the follow indirection step, it'll return an element with an id that matches the assertion
      spyOn(Instructions, 'followIndirectionStep').and.callFake(() =>
        $('<body></body>').attr('id', 'body1'),
      );

      // Expecting that no error is thrown; if one is, it'll cause this test to fail
      Interpreter.interpretIndirectionStepNode(CFIAST.cfiString.localPath.steps[1], undefined);
    });
  });
});
