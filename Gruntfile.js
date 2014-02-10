module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            'show-shapes': {
                src: 'show-shapes/ss.js',
                dest: 'show-shapes/ss.min.js'
            }
        },
        jshint: {
            'show-shapes': ['show-shapes/ss.js']
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('show-shapes', ['uglify:show-shapes']);
    grunt.registerTask('lint', ['jshint:show-shapes']);
    grunt.registerTask('default', 'print help message', function() {
        grunt.log.writeln('Hi there. The current supported targets are:');
        grunt.log.writeln('show-shapes: builds show-shapes bookmarklet')
        grunt.log.writeln('lint: runs jshint on show-shapes');
    });
};