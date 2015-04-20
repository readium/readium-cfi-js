describe("MISC TESTS", function () {

    describe("CFI BLACKLIST", function () {
        var exampleBlacklist = {
            classBlacklist: ["class1", "class2"],
            elementBlacklist: ["someTag", "span", "video"],
            idBlacklist: ["id1", "id2"]
        };
        it("can be set", function () {
            EPUBcfi.Blacklist.setBlacklist(exampleBlacklist);
        });
        it("can be get", function () {
            expect(EPUBcfi.Blacklist.getBlacklist()).toEqual(exampleBlacklist);
        });
        it("can be appended", function () {
            EPUBcfi.Blacklist.appendBlacklist({
                classBlacklist: ["class3"],
                elementBlacklist: ["otherTag"]
            });
            EPUBcfi.Blacklist.appendBlacklist({
                classBlacklist: ["class3"],
                elementBlacklist: ["otherTag"],
                idBlacklist: ["id3"]
            });
            EPUBcfi.Blacklist.appendBlacklist({
                elementBlacklist: ["randomTag"]
            });
            expect(JSON.stringify(EPUBcfi.Blacklist.getBlacklist()))
                .toEqual('{"classBlacklist":["class1","class2","class3"],"elementBlacklist":["randomTag","otherTag","video","span","someTag"],"idBlacklist":["id3","id2","id1"]}');
        });
        it("can be reset", function () {
            EPUBcfi.Blacklist.setBlacklist(null);
            expect(EPUBcfi.Blacklist.getBlacklist()).toEqual({});
        });
    });
});