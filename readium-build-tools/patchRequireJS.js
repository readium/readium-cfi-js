var fs = require('fs');
var path = require('path');

var rjsPath = path.join(process.cwd(), 'node_modules/requirejs/bin/r.js');

console.log("Patching RequireJS optimizer (duplicate sourceMappingURL bug): ");
console.log(rjsPath);

    // https://github.com/jrburke/r.js/issues/807
    // https://github.com/jrburke/r.js/issues/802

var rjs = fs.readFileSync(rjsPath, {encoding: 'utf8'});
fs.writeFileSync(rjsPath,
  rjs.replace(' stream += "\\n//# sourceMappingURL=" + options.outSourceMap;', ' //stream += "\\n//# sourceMappingURL=" + options.outSourceMap;')
);
