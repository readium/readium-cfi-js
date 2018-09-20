import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');

const plugins = [
  babel(),
  resolve(),
  commonjs({
    // if false then skip sourceMap generation for CommonJS modules
    sourceMap: false, // Default: true
  }),
];

const standardConfig = {
  input: 'src/index.js',
  output: [
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins,
};

const compatibilityConfig = {
  input: 'src/index-compat.js',
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'EPUBcfi',
      sourcemap: true,
    },
  ],
  plugins,
};

export default [standardConfig, compatibilityConfig];
