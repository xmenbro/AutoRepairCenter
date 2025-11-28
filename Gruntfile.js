module.exports = function(grunt) {
    
    grunt.initConfig({
        // Замена путей в CSS ссылках
        'string-replace': {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src/html/',
                    src: '**/*.html',
                    dest: 'dist/html/'
                }],
                options: {
                    replacements: [
                        {
                            pattern: /<link rel="stylesheet" href="(.+?)\.css">/g,
                            replacement: '<link rel="stylesheet" href="$1.min.css">'
                        }
                    ]
                }
            }
        },

        // Минификация HTML
        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true,
                    minifyJS: true,
                    minifyCSS: true
                },
                files: [{
                    expand: true,
                    cwd: 'dist/html/',
                    src: ['**/*.html'],
                    dest: 'dist/html/'
                }]
            }
        },
        
        // Минификация CSS
        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'src/css/',
                    src: ['**/*.css'],
                    dest: 'dist/css/',
                    ext: '.min.css'
                }]
            }
        },
        
        // Оптимизация изображений
        imagemin: {
            dynamic: {
                files: [{
                    expand: true,
                    cwd: 'src/images/',
                    src: ['**/*.{png,jpg,JPG,gif,svg,webp}'],
                    dest: 'dist/images/'
                }]
            }
        },
        
        // Очистка папки dist
        clean: {
            dist: ['dist/']
        }
    });
    
    // Загрузка плагинов
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-clean');
    
    // Регистрация задач
    grunt.registerTask('default', ['build']);
    grunt.registerTask('build', [
        'clean:dist',
        'cssmin',
        'imagemin',
        'string-replace',
        'htmlmin'
    ]);
};