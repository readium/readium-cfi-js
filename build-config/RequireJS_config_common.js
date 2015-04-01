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

require.config({
    //xhtml: true, //document.createElementNS()
    
    /* http://requirejs.org/docs/api.html#config-waitSeconds */
    waitSeconds: 0,
    
    removeCombined: true,
    
    //findNestedDependencies: true,
            
    wrap: false,
    
    inlineText: true,
    
    baseUrl: process._readium.baseUrl__readium_cfi_js,
    
    paths:
    {
        "readium-cfi-js":
            process._readium.path__readium_cfi_js + "/build-config/" + process._readium.baseUrl__readium_cfi_js + "/"
            + '../build-config/readium-cfi-js',
        
        "epubCfi":
            process._readium.path__readium_cfi_js + "/build-config/" + process._readium.baseUrl__readium_cfi_js + "/"
            + '../build-config/epubCfi',
        
        "cfi_parser_gen":
            process._readium.path__readium_cfi_js + "/build-config/" + process._readium.baseUrl__readium_cfi_js + "/"
            + '../gen/cfi_parser_gen',
        
        // ------ NPM MODULEs
        
        RequireJS:
            process._readium.path__readium_cfi_js + "/build-config/" + process._readium.baseUrl__readium_cfi_js + "/"
            + '../node_modules/requirejs/require',
        
        jquery:
            process._readium.path__readium_cfi_js + "/build-config/" + process._readium.baseUrl__readium_cfi_js + "/"
            + '../node_modules/jquery/dist/jquery'
    },
    
    wrapShim: false,

    shim:
    {
        'cfi_parser_gen':
        {
            exports: 'EPUBcfiParser'
        }
    }
});