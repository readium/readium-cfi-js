describe("CFI GENERATOR", function () {

    describe("range generation", function () {

        it("can generate a range component that ends at an arbitrary element ancestor", function () {

            var dom = 
                "<html>"
                +    "<div></div>"
                +    "<div>"
                +         "<div id='startParent'>"
                +             "<div></div>"
                +             "textnode1"
                +             "<div></div>"
                +             "textNode2"
                +             "<div></div>"
                +         "</div>"
                +     "</div>"
                +     "<div></div>"
                + "</html>";
            var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

            var commonAncestor = $($dom.children()[0]).children()[1];
            var $startElement = $($('#startParent', $dom).contents()[0]);
            var generatedCFI = EPUBcfi.Generator.createCFIElementSteps($startElement, commonAncestor);
            expect(generatedCFI).toEqual("/2[startParent]/2"); 
        });

        it("can generate a range component between a text node and an element node", function () {

            var dom = 
                "<html>"
                +    "<div></div>"
                +    "<div>"
                +         "<div id='startParent'>"
                +             "textnode"
                +             "<div></div>"
                +             "textnode1"
                +             "<div></div>"
                +         "</div>"
                +     "</div>"
                +     "<div></div>"
                + "</html>";
            var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

            var $startElement1 = $($('#startParent', $dom).contents()[0]);
            var $startElement2 = $($('#startParent', $dom).contents()[1]);
            var generatedCFI = EPUBcfi.Generator.generateRangeComponent($startElement1[0], 1, $startElement2[0], 0);
            expect(generatedCFI).toEqual("/4/2[startParent],/1:1,/2");
        });

        it("can generate a range component between an element node and a text node", function () {

            var dom = 
                "<html>"
                +    "<div></div>"
                +    "<div>"
                +         "<div id='startParent'>"
                +             "textnode"
                +             "<div></div>"
                +             "textnode1"
                +             "<div></div>"
                +         "</div>"
                +     "</div>"
                +     "<div></div>"
                + "</html>";
            var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

            var $startElement1 = $($('#startParent', $dom).contents()[1]);
            var $startElement2 = $($('#startParent', $dom).contents()[2]);
            var generatedCFI = EPUBcfi.Generator.generateRangeComponent($startElement1[0], 0, $startElement2[0], 1);
            expect(generatedCFI).toEqual("/4/2[startParent],/2,/3:1");
        });

        it("can generate a range component between an element node and a text node with different parents", function () {

            var dom = 
                "<html>"
                +    "<div></div>"
                +    "<div>"
                +         "<div id='startParent'>"
                +             "textnode"
                +             "<div></div>"
                +             "textnode1"
                +             "<div></div>"
                +         "</div>"
                +     "</div>"
                +     "<div id='end'></div>"
                + "</html>";
            var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

            var $startElement1 = $($('#startParent', $dom).contents()[0]);
            var $startElement2 = $($('#end', $dom)[0]);
            var generatedCFI = EPUBcfi.Generator.generateRangeComponent($startElement1[0], 1, $startElement2[0], 0);
            expect(generatedCFI).toEqual("/2,/4/2[startParent]/1:1,/6[end]");
        });


        it("can generate an element range CFI for a node with a period in the ID", function () {

           var dom = 
                "<html>"
                +    "<div></div>"
                +    "<div>"
                +         "<div id='startParent'>"
                +             "<div id=\"period-.-in.id\"></div>"
                +             "textnode1"
                +             "<div></div>"
                +             "textNode2"
                +             "<div></div>"
                +         "</div>"
                +     "</div>"
                +     "<div></div>"
                + "</html>";
            var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

            var $startElement1 = $($('#startParent', $dom).children()[0]);
            var $startElement2 = $($('#startParent', $dom).children()[2]);
            var generatedCFI = EPUBcfi.Generator.generateElementRangeComponent($startElement1[0], $startElement2[0]);

            expect(generatedCFI).toEqual("/4/2[startParent],/2[period-.-in.id],/6");
        });


        it("can generate an element range CFI for different start nodes", function () {

           var dom = 
                "<html>"
                +    "<div></div>"
                +    "<div>"
                +         "<div id='startParent'>"
                +             "<div></div>"
                +             "textnode1"
                +             "<div></div>"
                +             "textNode2"
                +             "<div></div>"
                +         "</div>"
                +     "</div>"
                +     "<div></div>"
                + "</html>";
            var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

            var $startElement1 = $($('#startParent', $dom).children()[0]);
            var $startElement2 = $($('#startParent', $dom).children()[2]);
            var generatedCFI = EPUBcfi.Generator.generateElementRangeComponent($startElement1[0], $startElement2[0]);

            expect(generatedCFI).toEqual("/4/2[startParent],/2,/6");
        });

        it("throws an error if the start and end node is the same", function () {

           var dom = 
                "<html>"
                +    "<div></div>"
                +    "<div>"
                +         "<div id='startParent'>"
                +             "<div></div>"
                +             "textnode1"
                +             "<div></div>"
                +             "textNode2"
                +             "<div></div>"
                +         "</div>"
                +     "</div>"
                +     "<div></div>"
                + "</html>";
            var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

            var $startElement1 = $($('#startParent', $dom).children()[0]);
            var $startElement2 = $($('#startParent', $dom).children()[0]);

            expect(function () {
                EPUBcfi.Generator.generateElementRangeComponent($startElement1[0], $startElement2[0])})
            .toThrow(
                Error(
                    "Start and end element cannot be the same for a CFI range")
            ); 
        });

        describe("character offset range CFIs", function () {

            it("generates for different start and end nodes", function () {

               var dom = 
                    "<html>"
                    +    "<div></div>"
                    +    "<div>"
                    +         "<div id='startParent'>"
                    +             "<div>text target for start</div>"
                    +             "textnode1"
                    +             "<div></div>"
                    +             "textNode2"
                    +             "<div>text target for end</div>"
                    +         "</div>"
                    +     "</div>"
                    +     "<div></div>"
                    + "</html>";
                var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

                var $startElement = $($('#startParent', $dom).children()[0].firstChild);
                var $endElement = $($('#startParent', $dom).children()[2].firstChild);
                var generatedCFI = EPUBcfi.Generator.generateCharOffsetRangeComponent(
                    $startElement[0], 
                    6,
                    $endElement[0],
                    2
                );

                expect(generatedCFI).toEqual("/4/2[startParent],/2/1:6,/6/1:2");
            });

            it("generates for the same start and end node, with differet offsets", function () {

               var dom = 
                    "<html>"
                    +    "<div></div>"
                    +    "<div>"
                    +         "<div id='startParent'>"
                    +             "<div>text target for start</div>"
                    +             "textnode1"
                    +             "<div></div>"
                    +             "textNode2"
                    +             "<div>text target for end</div>"
                    +         "</div>"
                    +     "</div>"
                    +     "<div></div>"
                    + "</html>";
                var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

                var $startElement = $($('#startParent', $dom).children()[0].firstChild);
                var $endElement = $($('#startParent', $dom).children()[0].firstChild);
                var generatedCFI = EPUBcfi.Generator.generateCharOffsetRangeComponent(
                    $startElement[0], 
                    2,
                    $endElement[0],
                    6
                );

                expect(generatedCFI).toEqual("/4/2[startParent]/2,/1:2,/1:6");
            });

            it("generates for an element with multiple child text nodes", function () {

                var dom = 
                    "<html>"
                    +    "<div></div>"
                    +    "<div>"
                    +         "<div id='startParent'>"
                    +             "<div>content</div>"
                    +             "textnode1"
                    +             "<div></div>"
                    +             "textNode2"
                    +             "<div>content</div>"
                    +             "textNode3"
                    +             "textNode4"
                    +         "</div>"
                    +     "</div>"
                    +     "<div></div>"
                    + "</html>";
                var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

                var $startElement = $($('#startParent', $dom).contents()[1]);
                var $endElement = $($('#startParent', $dom).contents()[5]);
                var generatedCFI = EPUBcfi.Generator.generateCharOffsetRangeComponent(
                    $startElement[0], 
                    2,
                    $endElement[0],
                    6
                );

                expect(generatedCFI).toEqual("/4/2[startParent],/3:2,/7:6");
            });

            it("generates offsets with a simple node", function () {

                var dom = 
                    "<html>"
                    +    "<div></div>"
                    +    "<div>"
                    +         "<div id='startParent'>"
                    +             "0123456789"
                    +         "</div>"
                    +     "</div>"
                    +     "<div></div>"
                    + "</html>";
                var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

                var $startElement = $($('#startParent', $dom).contents()[0]);
                var $endElement = $($('#startParent', $dom).contents()[0])

                ////////////////////////////////////////////////
                // test 1
                var generatedCFI = EPUBcfi.Generator.generateCharOffsetRangeComponent(
                    $startElement[0], 
                    0,
                    $endElement[0],
                    1,
                    ["cfi-marker"]

                );
                expect(generatedCFI).toEqual("/4/2[startParent],/1:0,/1:1");
                
                ////////////////////////////////////////////////
                // test 2
                generatedCFI = EPUBcfi.Generator.generateCharOffsetRangeComponent(
                    $startElement[0], 
                    1,
                    $endElement[0],
                    2,
                    ["cfi-marker"]

                );
                expect(generatedCFI).toEqual("/4/2[startParent],/1:1,/1:2");
                
                ////////////////////////////////////////////////
                // test 2
                generatedCFI = EPUBcfi.Generator.generateCharOffsetRangeComponent(
                    $startElement[0], 
                    2,
                    $endElement[0],
                    4,
                    ["cfi-marker"]

                );
                expect(generatedCFI).toEqual("/4/2[startParent],/1:2,/1:4");
            });

            it("generates offsets with the same parent element", function () {

                var dom = 
                    "<html>"
                    +    "<div></div>"
                    +    "<div>"
                    +         "<div id='startParent'>"
                    +             "<div>content</div>"
                    +             "textnode1"
                    +             "<div></div>"
                    +             "textNode2"
                    +             "<div>content</div>"
                    +         "</div>"
                    +     "</div>"
                    +     "<div></div>"
                    + "</html>";
                var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

                var $startElement = $($('#startParent', $dom).contents()[1]);
                var $endElement = $($('#startParent', $dom).contents()[3]);
                var generatedCFI = EPUBcfi.Generator.generateCharOffsetRangeComponent(
                    $startElement[0], 
                    2,
                    $endElement[0],
                    6
                );

                expect(generatedCFI).toEqual("/4/2[startParent],/3:2,/5:6");
            });            

            it("generates offsets with the same parent element and a blacklist element", function () {

                var dom = 
                    "<html>"
                    +    "<div></div>"
                    +    "<div>"
                    +         "<div id='startParent'>"
                    +             "012"
                    +             "<span class='cfi-marker' id='start'></span>"
                    +             "34"
                    +             "<span class='cfi-marker' id='end'></span>"
                    +             "56789"
                    +         "</div>"
                    +     "</div>"
                    +     "<div></div>"
                    + "</html>";
                var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

                var $startElement = $($('#startParent', $dom).contents()[4]);
                var $endElement = $($('#startParent', $dom).contents()[4])
                var generatedCFI = EPUBcfi.Generator.generateCharOffsetRangeComponent(
                    $startElement[0], 
                    0,
                    $endElement[0],
                    3,
                    ["cfi-marker"]

                );

                expect(generatedCFI).toEqual("/4/2[startParent],/1:5,/1:8");
            });

            it("generates offsets with the same parent element and a blacklist element #2", function () {

                var dom = 
                    "<html>"
                    +    "<div></div>"
                    +    "<div>"
                    +         "<div id='startParent'>"
                    +             "0"
                    +             "<span class='cfi-marker' id='start'></span>"
                    +             "12345"
                    +             "<span class='cfi-marker' id='end'></span>"
                    +             "6789"
                    +         "</div>"
                    +     "</div>"
                    +     "<div></div>"
                    + "</html>";
                var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         

                var $startElement = $($('#startParent', $dom).contents()[4]);
                var $endElement = $($('#startParent', $dom).contents()[4])
                var generatedCFI = EPUBcfi.Generator.generateCharOffsetRangeComponent(
                    $startElement[0], 
                    0,
                    $endElement[0],
                    2,
                    ["cfi-marker"]

                );

                expect(generatedCFI).toEqual("/4/2[startParent],/1:6,/1:8");
            });

            it("generates offsets with the same parent element and two blacklist elements", function () {

                var dom = 
                    "<html>"
                    +    "<div></div>"
                    +    "<div>"
                    +         "<div id='startParent'>"
                    +             "This is <span class='cfi-marker'>a</span> line <span class='cfi-marker'>of</span> text"
                    +         "</div>"
                    +     "</div>"
                    +     "<div></div>"
                    + "</html>";
                var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));         
                var $startElement = $($('#startParent', $dom).contents()[4]);
                var $endElement = $($('#startParent', $dom).contents()[4])
                var generatedCFI = EPUBcfi.Generator.generateCharOffsetRangeComponent(
                    $startElement[0], 
                    0,
                    $endElement[0],
                    4,
                    ["cfi-marker"]

                );

                expect(generatedCFI).toEqual("/4/2[startParent],/1:14,/1:18");
            });

        });
        
    });

    describe("path generation", function () {

        it("can generate CFI steps recursively for a single content document", function () {

            var dom = 
                "<html>"
                +    "<div></div>"
                +    "<div>"
                +         "<div id='startParent'>"
                +             "<div></div>"
                +             "textnode1"
                +             "<div></div>"
                +             "textNode2"
                +             "<div></div>"
                +         "</div>"
                +     "</div>"
                +     "<div></div>"
                + "</html>";
            var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));

            var generatedCFI = EPUBcfi.Generator.createCFIElementSteps($($('#startParent', $dom).contents()[0]), "html");
            expect(generatedCFI).toEqual("!/4/2[startParent]/2"); 
        });

        it("can infer the presence of a single node from multiple adjacent nodes", function () {

            var dom = 
                "<html>"
                +    "<div></div>"
                +    "<div>"
                +         "<div id='startParent'>"
                +             "<div></div>"
                +             "textnode1.0"
                +             "<div class='cfi-marker'></div>"
                +             "textnode1.1"
                +             "<div class='cfi-marker'></div>"
                +             "textnode1.2"            
                +             "<div></div>"
                +             "textNode2"
                +             "<div></div>"
                +         "</div>"
                +     "</div>"
                +     "<div></div>"
                + "</html>";
            var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));
            var $startNode = $($('#startParent', $dom).contents()[5]);
            var textTerminus = EPUBcfi.Generator.createCFITextNodeStep($startNode, 3, ["cfi-marker"]);
            var generatedCFI = EPUBcfi.Generator.createCFIElementSteps($startNode.parent(), "html", ["cfi-marker"]) + textTerminus;

            expect(generatedCFI).toEqual("!/4/2[startParent]/3:25"); // [ te,xtn]
        });

        it("can generate a package document CFI with the spine index", function () {

            var packageDocXhtml = 
            "<package>" 
            +   "<div></div>"
            +   "<div></div>"
            +   "<div>"
            +       "<spine>"
            +           "<itemref></itemref>"
            +           "<itemref></itemref>"
            +           "<itemref idref='contentDocId'></itemref>" 
            +       "</spine>"
            +   "</div>"
            + "</package>";

            var packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");
            var packageDocCFIComponent = EPUBcfi.Generator.generatePackageDocumentCFIComponentWithSpineIndex(2, packageDoc);
            expect(packageDocCFIComponent).toEqual("/6/2/6!"); // [ te,xtn]
        });

        it("can generate a complete CFI for both the content document and package document", function () {

            var packageDocXhtml = 
            "<package>" 
            +   "<div></div>"
            +   "<div></div>"
            +   "<div>"
            +       "<spine>"
            +           "<itemref></itemref>"
            +           "<itemref></itemref>"
            +           "<itemref idref='contentDocId'></itemref>" 
            +       "</spine>"
            +   "</div>"
            + "</package>";

            var contentDocXhtml = 
            "<html>"
            +   "<div></div>"
            +   "<div>"
            +       "<div id='startParent'>"
            +           "<div></div>"
            +           "textnode1"
            +           "<div></div>"
            +           "textNode2"
            +           "<div></div>"
            +       "</div>"
            +   "</div>"
            +   "<div></div>"
            + "</html>";

            var contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
            var packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");

            var contentDocCFIComponent = EPUBcfi.Generator.generateCharacterOffsetCFIComponent($('#startParent', contentDoc).contents()[1], 3);
            var packageDocCFIComponent = EPUBcfi.Generator.generatePackageDocumentCFIComponent("contentDocId", packageDoc);
            var generatedCFI = EPUBcfi.Generator.generateCompleteCFI(packageDocCFIComponent, contentDocCFIComponent);

            expect(generatedCFI).toEqual("epubcfi(/6/2/6!/4/2[startParent]/3:3)"); // [ te,xtn]
        });

        it('can generate a CFI for an actual epub', function () {

            var contentDocXhtml = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
            var contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
            var packageDocXhtml = jasmine.getFixtures().read("moby_dick_package.opf");
            var packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");

            var contentDocCFIComponent = EPUBcfi.Generator.generateCharacterOffsetCFIComponent($("#c01p0008", contentDoc)[0].firstChild, 103);
            var packageDocCFIComponent = EPUBcfi.Generator.generatePackageDocumentCFIComponent("xchapter_001", packageDoc);
            var generatedCFI = EPUBcfi.Generator.generateCompleteCFI(packageDocCFIComponent, contentDocCFIComponent);

            expect(generatedCFI).toEqual("epubcfi(/6/14!/4[body1]/2/18[c01p0008]/1:103)"); // [, a,lof]
        });

        it("can generate a CFI without a terminus", function () {

            var contentDocXhtml = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
            var contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
            var packageDocXhtml = jasmine.getFixtures().read("moby_dick_package.opf");
            var packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");

            var contentDocCFIComponent = EPUBcfi.Generator.generateElementCFIComponent($("#c01p0008", contentDoc)[0]);
            var packageDocCFIComponent = EPUBcfi.Generator.generatePackageDocumentCFIComponent("xchapter_001", packageDoc);
            var generatedCFI = EPUBcfi.Generator.generateCompleteCFI(packageDocCFIComponent, contentDocCFIComponent);

            expect(generatedCFI).toEqual("epubcfi(/6/14!/4[body1]/2/18[c01p0008])");
        });

        it("can generate a CFI without a terminus when the start element is the 'html' element", function () {

            var contentDocXhtml = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
            var contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
            var packageDocXhtml = jasmine.getFixtures().read("moby_dick_package.opf");
            var packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");

            var contentDocCFIComponent = EPUBcfi.Generator.generateElementCFIComponent($("html", contentDoc)[0]);
            var packageDocCFIComponent = EPUBcfi.Generator.generatePackageDocumentCFIComponent("xchapter_001", packageDoc);
            var generatedCFI = EPUBcfi.Generator.generateCompleteCFI(packageDocCFIComponent, contentDocCFIComponent);        

            expect(generatedCFI).toEqual("epubcfi(/6/14!/2)");
        });
    });

    describe("CFI GENERATOR ERROR HANDLING", function () {

        var contentDocXhtml;
        var contentDoc;
        var packageDocXhtml;
        var packageDoc;
        var startTextNode;

        beforeEach(function () {

            contentDocXhtml = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
            contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
            packageDocXhtml = jasmine.getFixtures().read("moby_dick_package.opf");
            packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");
            startTextNode = $("#c01p0008", contentDoc)[0].firstChild;
        });

        it("throws an error if a text node is not supplied as a starting point", function () {

            expect(function () {
                EPUBcfi.Generator.generateCharacterOffsetCFIComponent(undefined, 103, "xchapter_001", packageDoc)})
            .toThrow(
                EPUBcfi.NodeTypeError(undefined, "Cannot generate a character offset from a starting point that is not a text node")
            );
        });

        it("throws an error if the character offset is less then 0", function () {

           expect(function () {
                EPUBcfi.Generator.generateCharacterOffsetCFIComponent(startTextNode, -1, "xchapter_001", packageDoc)})
            .toThrow(
                EPUBcfi.OutOfRangeError(-1, 0, "Character offset cannot be less than 0")
            ); 
        });

        it("throws an error if the character offset is greater than the length of the text node", function () {

           expect(function () {
                EPUBcfi.Generator.generateCharacterOffsetCFIComponent(startTextNode, startTextNode.nodeValue.length + 1, "xchapter_001", packageDoc)})
            .toThrow(
                EPUBcfi.OutOfRangeError(
                    startTextNode.nodeValue.length + 1, 
                    startTextNode.nodeValue.length, 
                    "character offset cannot be greater than the length of the text node")
            ); 
        });

        it("throws an error if an idref is not supplied", function () {

            expect(function () {
                EPUBcfi.Generator.generatePackageDocumentCFIComponent(undefined, packageDoc)})
            .toThrow(
                Error("The idref for the content document, as found in the spine, must be supplied")
            );
        });

        it("throws an error if a package document is not supplied", function () {

            expect(function () {
                EPUBcfi.Generator.generatePackageDocumentCFIComponent("xchapter_001", undefined)})
            .toThrow(
                Error("A package document must be supplied to generate a CFI")
            );
        });

        it("throws an error if the idref does not match any idref attribute on itemref elements in the spine", function () {

            expect(function () {
                EPUBcfi.Generator.generatePackageDocumentCFIComponent("xchapter_", packageDoc)})
            .toThrow(
                Error("The idref of the content document could not be found in the spine")
            );
        });

        it("throws an error if target element is undefined", function () {

            expect(function () {
                EPUBcfi.Generator.validateStartElement(undefined)})
            .toThrow(
                Error("CFI target element is undefined")
            );
        });

        it("throws an error if target element is not an HTML element", function () {

            expect(function () {
                EPUBcfi.Generator.validateStartElement(document.createTextNode("a text node"))})
            .toThrow(
                Error("CFI target element is not an HTML element")
            );
        });
    });
});
