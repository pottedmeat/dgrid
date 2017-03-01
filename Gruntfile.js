module.exports = function (grunt) {

    var staticFiles = [ 'src/**/*.html', 'src/**/*.png' ];

    var path = require('path');
    var fs = require('fs');
    var postCssImport = require('postcss-import');
    var postCssNext = require('postcss-cssnext');
    var postCssModules = require('postcss-modules');
    var umdWrapper = function(content) {
        return (function (root, factory) {
            if (typeof define === 'function' && define.amd) {
                define([], function () { return (factory()); });
            } else if (typeof module === 'object' && module.exports) {
                module.exports = factory();
            }
        }(this, function () {
            return content;
        }));
    }

    grunt.loadNpmTasks('grunt-postcss');

    var distDirectory = grunt.config.get('distDirectory') || '';
    var devDirectory = grunt.config.get('devDirectory') || '';

    function moduleProcessors(dest, cwd) {
        var scopedName = dest === devDirectory ? '[name]__[local]__[hash:base64:5]' : '[hash:base64:8]';
        return [
            postCssImport,
            postCssNext({
                features: {
                    autoprefixer: {
                        browsers: [
                            'last 2 versions',
                            'ie >= 10'
                        ]
                    }
                }
            }),
            postCssModules({
                generateScopedName: scopedName,
                getJSON: function(cssFileName, json) {
            var outputPath = path.resolve(dest, path.relative(cwd, cssFileName));
            var newFilePath = outputPath + '.js';
            var themeKey = ' _key';
            json[themeKey] = 'dojo-' + path.basename(outputPath, '.css');
            fs.writeFileSync(newFilePath, umdWrapper(JSON.stringify(json)));
        }
    })
    ];
    }

    var variablesProcessors = [
        postCssImport,
        postCssNext({
            features: {
                customProperties: {
                    preserve: 'computed'
                }
            }
        })
    ];

    function moduleFiles(dest) {
        return [{
            expand: true,
            src: ['**/*.css', '!**/variables.css', '!styles/widgets.css'],
            dest: dest,
            cwd: 'src'
        }];
    }

    var variableFiles = [{
        expand: true,
        src: '**/variables.css',
        dest: distDirectory,
        cwd: 'src'
    }];

    grunt.config.set('postcss', {
        options: {
            map: true
        },
        'modulesDev': {
            files: moduleFiles(path.join(devDirectory, 'src')),
            options: {
                processors: moduleProcessors(devDirectory)
            }
        },
        'modulesDist': {
            files: moduleFiles(distDirectory),
            options: {
                processors: moduleProcessors(distDirectory, 'src')
            }
        },
        variables: {
            files: variableFiles,
            options: {
                processors: variablesProcessors
            }
        }
    });

    require('grunt-dojo2').initConfig(grunt, {
        postcss: {
            devStyles: {
                files: {
                    expand: true,
                    src: [ '<%= postcss.modulesDev.files.src %>', '!**/dgrid.css' ],
                    dest: '<%= postcss.modulesDev.files.dest %>',
                    cwd: 'src'
                },
                options: '<%= postcss.modulesDev.options %>'
            }
        },
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
                cwd: '.',
                src: 'src/styles/dgrid.css',
                dest: '<%= distDirectory %>'
            }
        }
    });

    grunt.registerTask('dev', grunt.config.get('devTasks').concat([
        'copy:staticFiles',
        'copy:staticTestFiles',
        'postcss:devStyles',
        'copy:devStyles'
    ]));

    grunt.registerTask('dist', grunt.config.get('distTasks').concat([
        'postcss:distStyles',
        'postcss:variables',
        'copy:distStyles'
    ]));
};
