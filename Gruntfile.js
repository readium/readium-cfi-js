module.exports = function(grunt) {

  //grunt.template.addDelimiters('erb-like-delimiters', '<%= ', ' %>')
  var fs = require('fs');   

  // Project configuration.
  grunt.initConfig({
    peg: {
      cfi:{
        src: "cfi_grammar/epubcfi.pegjs",
        dest: "src/models/epubcfi.js",
        options: { exportVar: "EPUBcfi.Parser" }
      },
      
    },
    template: {
          libraryTemplate: {
              options: {
                  data: {
                      'cfi_parser': fs.readFileSync('src/models/epubcfi.js', {encoding:'utf8'}),
                      'cfi_interpreter' : fs.readFileSync('src/models/cfi_instructions.js', {encoding:'utf8'}),
                      'cfi_instructions' : fs.readFileSync('src/models/cfi_interpreter.js', {encoding:'utf8'}),
                      'cfi_generator' : fs.readFileSync('src/models/cfi_generator.js', {encoding:'utf8'}),
                      'cfi_blacklist' : fs.readFileSync('src/models/cfi_blacklist.js', {encoding:'utf8'}),
                      'runtime_errors' : fs.readFileSync('src/models/runtime_errors.js', {encoding:'utf8'})
                  }
              },
              files: {
                  'dist/epub_cfi.js': ['src/templates/cfi_library_template.js.erb'],
                  'spec/javascripts/vendor/epub_cfi.js': ['src/templates/cfi_library_template.js.erb']
              }
          }
      },
      karma: {
        local: {
          configFile: 'karma.conf.js'
        },
        travis:{
          configFile: 'karma.travis.conf.js'
        }
      }
  });

  grunt.loadNpmTasks('grunt-peg');
  grunt.loadNpmTasks('grunt-template');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('compile', ['peg', 'template']);
  grunt.registerTask('default', ['compile', 'karma:local']);
  grunt.registerTask('travis', ['compile', 'karma:travis']);

};