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
  
  .replace('sourceMapGenerator.setSourceContent(sourceMapPath, singleContents);', 'if ((typeof config.sourceMapIncludeSources === "undefined") || config.sourceMapIncludeSources) sourceMapGenerator.setSourceContent( sourceMapPath,singleContents );')
  
  .replace('resultMap = finalMap.toString();', 'resultMap=finalMap.toString() ; if ((typeof uconfig.sourceMapIncludeSources !== "undefined") && !uconfig.sourceMapIncludeSources) { resultMap = resultMap.replace(/,"sourcesContent":\\[[\\s\\S]*/, "}"); }')
  /*
  
                                var parsedSourceMap = JSON.parse(resultMap);
                                parsedSourceMap.sourcesContent = [];
                                delete parsedSourceMap.sourcesContent;
                                resultMap = JSON.stringify(parsedSourceMap);
  */
);
