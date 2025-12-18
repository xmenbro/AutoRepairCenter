/**
 * Главный файл приложения
 * @class App
 */

// Подключаем jQuery и наши модули
import './modules/validator.js';
import './components/forms/sign-in-form.js';
import './components/forms/sign-up-form.js';
import './modules/fetch-products.js';
import './modules/navigation.js';
import './modules/products-manager.js';

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
        
        // Дополнительная инициализация при необходимости
        this.initProductPages();
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
    
    // Инициализация на страницах с товарами
    initProductPages() {
        if ($('.products-grid').length) {
            console.log('Страница товаров инициализирована');
            // Дополнительные действия для страницы товаров
        }
    }
}

// Инициализируем приложение
$(document).ready(function() {
    window.app = new App();
});