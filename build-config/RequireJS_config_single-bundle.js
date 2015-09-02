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

    baseUrl: process._RJS_baseUrl(0),

    name: "readium-cfi-js_all",

    include: ["readium_cfi_js/cfi_API"],

    // relative to this config file (not baseUrl)
    out: "../build-output/_single-bundle/readium-cfi-js_all.js",

    insertRequire: ["readium_cfi_js/cfi_API"],

    stubModules: ['text'],

    paths:
    {
        "readium-cfi-js_all":
            process._RJS_rootDir(0) + '/node_modules/almond/almond'
    }
});
