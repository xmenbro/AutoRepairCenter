module.exports = function(grunt) {
    
    grunt.initConfig({
        // Обработка HTML перед минификацией
        processhtml: {
            dist: {
                files: [
                    {
                        // Главный html файл
                        'dist/html/index.html': ['src/html/index.html']
                    },
                    {
                        expand: true,
                        cwd: 'src/html/',
                        src: ['pages/*.html'],
                        dest: 'dist/html/',
                        ext: '.html'
                    }
                ]
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
                files: [
                    {
                        // Главный html файл
                        'dist/html/index.html': ['src/html/index.html']
                    },
                    {
                        expand: true,
                        cwd: 'src/html/',
                        src: ['pages/*.html'],
                        dest: 'dist/html/',
                        ext: '.html'
                    }
                ]
            }
        },
        
        // Минификация CSS - ИСПРАВЛЕНО
        cssmin: {
            target: {
                files: [
                    {
                        // Главный CSS файл
                        'dist/css/style.min.css': ['src/css/style.css']
                    },
                    {
                        // CSS файлы из папки pages
                        expand: true,
                        cwd: 'src/css/',
                        src: ['pages/*.css'],
                        dest: 'dist/css/',
                        ext: '.min.css'
                    }
                ]
            }
        },
        
        // Копирование CSS файлов - ИСПРАВЛЕНО
        copy: {
            css: {
                files: [{
                    expand: true,
                    cwd: 'src/css/',
                    src: ['*.css', 'pages/*.css'], // включаем файлы из папки pages
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