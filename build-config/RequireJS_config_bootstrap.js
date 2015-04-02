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

function(thiz) {
    console.log("========> RJS bootstrap");
    //console.log(thiz);
    console.log(process.cwd());

    
    process._readium = {};
    
    // relative to process.cwd()
    process._readium.path__SOURCES = "/build-output/_SOURCES";
    
    // relative to this config file
    process._readium.baseUrl__readium_cfi_js = ".." + process._readium.path__SOURCES;
    
    // relative to the above baseUrl (resolved absolute path is equivalent to process.cwd())
    process._readium.path__readium_cfi_js = "../..";
    

    var sources = ["/gen", "/js"];
    var dest = '';

    var filePath = process.cwd() + "/build-config/RequireJS_config_copySources.js";
    var fs = nodeRequire("fs");
    var fileContents= fs.readFileSync(filePath, {encoding: 'utf-8'});
    var func = eval("("+fileContents+")");
    func(sources, dest);
}