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

    /* http://requirejs.org/docs/api.html#config-waitSeconds */
    waitSeconds: 1,

    baseUrl: '..',


    //    map:
    //    {
    //        '*': {
    //            "readium_cfi_js":
    //                '../js'
    //        }
    //    },

        packages: [
            {
                name: "readium_cfi_js",
                location:
                    readium_cfi_js_PATH_PREFIX + 'js',

                main: "cfi_API"
            }
        ],

        paths:
        {
            "readium-cfi-js":
                readium_cfi_js_PATH_PREFIX + 'build-config/readium-cfi-js',

            cfi_parser_gen:
                readium_cfi_js_PATH_PREFIX + 'gen/cfi_parser_gen',

            jquery:
                readium_cfi_js_PATH_PREFIX + 'node_modules/jquery/dist/jquery'
        },

        shim:
        {
            'cfi_parser_gen':
            {
                exports: 'EPUBcfiParser'
            }
        }
});
