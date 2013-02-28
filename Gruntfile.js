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
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('show-shapes', ['uglify:show-shapes']);
    grunt.registerTask('default', 'print help message', function() {
        grunt.log.writeln('Hi there. The current supported targets are:');
        grunt.log.writeln(' * show-shapes');
    });
};