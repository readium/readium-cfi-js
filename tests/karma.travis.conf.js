module.exports = function(config) {

  if (!process.env['SAUCE_USERNAME']) process.env.SAUCE_USERNAME = 'readium';
  if (!process.env['SAUCE_ACCESS_KEY']) process.env.SAUCE_ACCESS_KEY = 'a36ebc10-e514-4da6-924c-307aec513550';

  var customLaunchers = {
    sl_chrome: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 7',
      version: '42'
    },
    sl_firefox: {
      base: 'SauceLabs',
      browserName: 'firefox'
    }
  }

  config.set({

    sauceLabs: {
        testName: 'readium-cfi-js Unit Tests',
        // username: 'readium',
        // accessKey: 'a36ebc10-e514-4da6-924c-307aec513550',
        connectOptions: {
          // username: 'readium',
          // accessKey: 'a36ebc10-e514-4da6-924c-307aec513550'
        }
    },
    customLaunchers: customLaunchers,

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      '../build-output/_single-bundle/readium-cfi-js_all.js',
      {pattern: '../build-output/_single-bundle/readium-cfi-js_all.js.map', included: false, served: true},

      {pattern: 'spec/fixtures/*.*', included: false, served: true},

      'spec/helpers/*.js',

      'spec/models/*.js',

      'spec/karma-loaded.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'saucelabs'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    //browsers: ['Chrome'],
    browsers: Object.keys(customLaunchers),


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
