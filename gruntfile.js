module.exports = function(grunt) {
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    watch: {
      js: {
        files: ['lib/**/*.js', 'spec/**/*.spec.js'],
        tasks: ['test']
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint : {
      options : {
        jshintrc : '.jshintrc',
        reporter : require('jshint-stylish')
      },
      all : ['lib/{,*/}*.js'],
      test : {
        options : {
          jshintrc : 'spec/.jshintrc'
        },
        src : ['spec/{,*/}*.js']
      }
    },
    
    shell: {
      test: {
        options: { stdout: true },
        command: 'jasmine-node spec/'
      }
    }
  });

  grunt.registerTask('test', 'shell:test');
}
