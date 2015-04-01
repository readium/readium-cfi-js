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
    baseUrl: process._readium.baseUrl__readium_cfi_js,
    
    stubModules: [],
    
    optimize: "none",
    generateSourceMaps: true,
    preserveLicenseComments: true,
    
    /*
    optimize: "uglify2",
    generateSourceMaps: true,
    preserveLicenseComments: false,

    // uglify2: {
    //   mangle: true,
    //   except: [
    //         'zzzzz'
    //   ],
    //   output: {
    //     beautify: true,
    //   },
    //   beautify: {
    //     semicolons: false
    //   }
    // },
    */

    name: "readium-cfi-js_all",
    
    include: ["epubCfi"],
    
    out: "../build-output/_single-bundle/readium-cfi-js_all.js",
    
    insertRequire: ["readium-cfi-js"],
    
    packages: [
        {
            name: "cfi-js",
            location:
            process._readium.path__readium_cfi_js + "/build-config/"
            
            //+ process._readium.baseUrl__readium_cfi_js
            + "../js"
            
            + "/"
            + '',
            main: 'cfi_API'
        },
        
        {
            name: "readium-cfi-js_all",
            location:
            process._readium.path__readium_cfi_js + "/build-config/" + process._readium.baseUrl__readium_cfi_js + "/"
            + '../node_modules/almond',
            main: 'almond'
        }
    ]
});