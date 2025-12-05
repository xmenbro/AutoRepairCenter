/**
 * Главный файл приложения
 * @class App
 */

// Подключаем jQuery и наши модули
import './modules/validator.js';
import './components/forms/sign-in-form.js';
import './components/forms/sign-up-form.js';

// Общая инициализация приложения
class App {
    constructor() {
        this.init();
    }
    
    // Инициализация
    init() {
        console.log('Приложение инициализировано');
        
        // Глобальные обработчики ошибок AJAX
        this.setupAjaxErrorHandling();
    }
    
    // Обработка ошибок
    setupAjaxErrorHandling() {
        $(document).ajaxError(function(event, xhr) {
            // Глобальная обработка ошибок AJAX
            if (xhr.status === 401) {
                console.warn('Требуется авторизация');
            } else if (xhr.status === 403) {
                console.warn('Доступ запрещен');
            }
        });
    }
}

// Инициализируем приложение
$(document).ready(function() {
    window.app = new App();
});