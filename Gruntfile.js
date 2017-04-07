module.exports = function (grunt) {
    var staticFiles = [ 'src/**/*.html' ];

    require('grunt-dojo2').initConfig(grunt, {
        copy: {
            staticFiles: {
                expand: true,
                cwd: '.',
                src: staticFiles,
                dest: '<%= devDirectory %>'
            },
            devStyles: {
                expand: true,
                cwd: '.',
                src: 'src/styles/dgrid.css',
                dest: '<%= devDirectory %>'
            },
            distStyles: {
                expand: true,
                cwd: 'src',
                src: 'styles/dgrid.css',
                dest: '<%= distDirectory %>'
            }
        }
    });

    grunt.registerTask('dev', grunt.config.get('devTasks').concat([
        'copy:staticFiles',
        'postcss:modules-dev',
        'copy:devStyles'
    ]));

    grunt.registerTask('dist', grunt.config.get('distTasks').concat([
        'postcss:modules-dist',
        'postcss:variables',
        'copy:distStyles'
    ]));
};
