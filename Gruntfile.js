module.exports = function(grunt) {
    
    grunt.initConfig({
        // Обработка HTML перед минификацией
        processhtml: {
            dist: {
                files: {
                    'dist/html/index.html': ['src/html/index.html']
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
                files: {
                    'dist/html/index.html': 'dist/html/index.html'
                }
            }
        },
        
        // Минификация CSS
        cssmin: {
            target: {
                files: {
                    'dist/css/style.min.css': ['src/css/style.css']
                }
            }
        },
        
        // Копирование CSS файлов
        copy: {
            css: {
                files: [{
                    expand: true,
                    cwd: 'src/css/',
                    src: ['*.css'],
                    dest: 'dist/css/'
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
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    
    // Регистрация задач
    grunt.registerTask('default', ['build']);
    grunt.registerTask('minify-html', ['htmlmin']);
    grunt.registerTask('minify-css', ['cssmin']);
    grunt.registerTask('optimize-images', ['imagemin']);
    grunt.registerTask('build', ['clean:dist', 'cssmin', 'copy:css', 'imagemin', 'processhtml', 'htmlmin']);
    grunt.registerTask('production', ['build']);
};