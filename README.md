# readium-cfi-js

**EPUB3 CFI utility library in JavaScript**

This is a software component used by other Readium projects, see https://github.com/readium/readium-shared-js


## License

**BSD-3-Clause** ( http://opensource.org/licenses/BSD-3-Clause )

See [license.txt](./license.txt).


## Installation

### Using npm / yarn

`npm install readium-cfi-js` or `yarn add readium-cfi-js`

### Importing

**This library is bundled in UMD and ES module formats.**

- CommonJS
```javascript
const EPUBcfi = require('readium-cfi-js');
```

- ES Module
```javascript
import * as EPUBcfi from 'readium-cfi-js';
```

- Globally with `window.EPUBcfi`
```html
<script src="readium-cfi.umd.js"></script>
```

## Usage in non-browser environments (Node)
Currently not supported as the implementation depends on jQuery and the DOM. 

A subset of the API could work without a browser, which may be planned for a future release.

## Development

**Prerequisites:**

* A decent terminal. On Windows, GitShell works great ( http://git-scm.com ), GitBash works too ( https://msysgit.github.io ), and Cygwin adds useful commands ( https://www.cygwin.com ).
* NodeJS ( https://nodejs.org ) **v4+** (Note that NodeJS v6+ and NPM v3+ are now supported, including NodeJS v7+ and NPM v4+)


**Initial setup:**

* `npm install` (to download dependencies defined in `package.json` ... note that the `--production` option can be used to avoid downloading development dependencies, for example when testing only the pre-built `dist` folder contents)

**Typical workflow:**

* Hack away! (mostly the source code in `./src` and `./spec/models` )
* `npm run build` (to update the output bundles in the `dist` folder)

**Unit tests:**

* `npm run test` (Karma launcher)

Travis (Continuous Integration): https://travis-ci.org/readium/readium-cfi-js/


## Bundled outputs

The `dist` directory contains bundled scripts in two module formats:

### UMD - [Universal Module Definition](https://github.com/umdjs/umd)

`readium-cfi.umd.js` (and its associated source-map file),
which aggregates all the required code (external library dependencies included, such as jQuery, etc.)

You can include this as CommonJS/AMD or with the global `EPUBcfi`

Works best for when using _Browserify_ or _RequireJS_

### ES Modules

`readium-cfi.esm.js` (and its associated source-map file),
also aggregates all the required code

Works best for _rollup.js_ or _webpack_



## NPM package

All packages "owned" and maintained by the Readium Foundation are listed here: https://www.npmjs.com/~readium

