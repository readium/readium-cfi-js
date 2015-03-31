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
    
    // Path is relative to this config file
    baseUrl: "../js",
    
    // Paths are relative to the above baseUrl
    paths:
    {
        "readium-cfi-js": '../build-config/readium-cfi-js',
        
        'cfi-generator': 'cfi_generator',
        'cfi-instructions': 'cfi_instructions',
        'cfi-interpreter': 'cfi_interpreter',
        'cfi-runtime-errors': 'cfi_runtime_errors',
        
        
        // ------ NPM MODULEs
        
        RequireJS: '../node_modules/requirejs/require',
        
        jquery: '../node_modules/jquery/dist/jquery'
    },
    
    wrapShim: false,

    shim:
    {
    }
});