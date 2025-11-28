module.exports = function(grunt) {
    
    grunt.initConfig({
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
                    'dist/html/index.html': ['src/html/index.html']
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
    grunt.registerTask('build', ['clean:dist', 'htmlmin', 'cssmin', 'imagemin']);
    grunt.registerTask('production', ['build']);
};