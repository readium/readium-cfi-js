var fs = require('fs');
var glob = require('glob');

var args = process.argv.splice(2);

console.log("=== concat [" + args[0] + "] into [" + args[1] + "] ...");
if (args[2]) console.log("Input encoding: " + args[2]);
    
if (fs.exists(args[1])) {
    console.log("~~ delete: " + args[1]);
    fs.unlinkSync(args[1]);
}

glob.sync(args[0]).forEach(function(file) {
    console.log("-- append: " + file);
    var src = fs.readFileSync(file, args[2] ? args[2] : 'utf8');
    src = src.replace(/^\uFEFF/, ''); // BOM strip
    fs.appendFileSync(args[1], src, 'utf8');
});