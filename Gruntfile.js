module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // cleanup build folder first
        clean: {
            build: {
                src: ["build"]
            },
            dist: {
                src: ["dist"]
            }
        },

        // make things nice
        jsbeautifier: {
            files: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                js: {
                    jslintHappy: true
                }
            }
        },

        // check for lint issues
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                "esversion": 6
            }
        },

        // create documentation
        jsdoc: {
            build: {
                src: 'src/**/*.js',
                options: {
                    destination: 'doc'
                }
            }
        },

        // concat all external dependencies, order is important
        concat: {
            options: {
                stripBanners: true,
                block: true,
                line: true,
                separator: grunt.util.linefeed + ';' + grunt.util.linefeed
            },
            build: {
                src: [
                    'src/viewer/constants.js',
                    'src/viewer/mathHelper.js',
                    'src/viewer/pubSub.js',
                    'src/viewer/lookupTable.js',
                    'src/viewer/dicomHeader.js',
                    'src/viewer/dicomObject.js',
                    'src/viewer/dicomLoader.js',
                    'src/viewer/dicomProcessor.js',
                    'src/viewer/memoryCache.js',
                    'src/viewer/peristentCache.js',
                    'src/viewer/cacheManager.js',
                    'src/viewer/preloader.js',
                    'src/viewer/renderManager.js',
                    'src/viewer/handle.js',
                    'src/viewer/label.js',
                    'src/viewer/line.js',
                    'src/viewer/circle.js',
                    'src/viewer/rectangle.js',
                    'src/viewer/distanceTool.js',
                    'src/viewer/angleTool.js',
                    'src/viewer/cobbAngleTool.js',
                    'src/viewer/pointProbeTool.js',
                    'src/viewer/rectangularRoiTool.js',
                    'src/viewer/circularRoiTool.js',
                    'src/viewer/textAnnotateTool.js',
                    'src/viewer/shutterTool.js',
                    'src/viewer/toolContainer.js',
                    'src/viewer/dicomViewer.js',
                    'src/viewer/slider.js',
                    'src/viewer/viewMaster.js',
                    'src/gui/ui.js'
                ],
                dest: 'build/<%= pkg.name %>.js'
            },
            depends: {
                src: [
                    'depends/jquery-1.11.1.min.js',
                    'depends/jquery.mobile-init.js',
                    'depends/jquery.mobile-1.4.2.min.js',
                    'depends/iscroll-4.2.min.js',
                    'depends/jquery.mobile.iscrollview-1.3.6.min.js',
                    'depends/jquery.mousewheel-3.0.6.min.js',
                    'depends/q-1.0.1.min.js',
                    'depends/hammer-1.1.3.min.js',
                    'depends/hashtable-3.0.min.js',
                    'depends/IndexedDBShim.min.js',
                    'depends/wheelSupport.min.js',
                    'depends/loglevel-0.5.0.min.js'
                ],
                dest: 'build/external.js'
            }
        },

        // minify code
        uglify: {
            options: {
                //banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
                compress: {},
                mangle: {
                    toplevel: true
                },
                report: 'gzip'
            },
            build: {
                src: 'build/<%= pkg.name %>.js',
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },


        // copy internal and external to javascript folder
        copy: {
            build: {
                src: ['build/<%= pkg.name %>.min.js'],
                dest: 'dist/public/js/internal.js'
            },
            depends: {
                src: ['build/external.js'],
                dest: 'dist/public/js/external.js'
            },
            css: {
                src: ['css/**'],
                dest: 'dist/public/'
            },
            favicon: {
                src: ['src/favicon.ico'],
                dest: 'dist/public/favicon.ico'
            },
            index: {
                src: ['src/index.html'],
                dest: 'dist/public/index.html'

            }

        },

        watch: {
            scripts: {
                files: ['**/*.js'],
                tasks: ['build'],
                options: {
                    spawn: false,
                },
            },
        }

    });

    require('load-grunt-tasks')(grunt);

    // Default task(s).
    grunt.registerTask('build', ['clean', 'jsbeautifier', 'jshint', 'concat', 'uglify', 'copy']);
    grunt.registerTask('default', ['build']);
};
