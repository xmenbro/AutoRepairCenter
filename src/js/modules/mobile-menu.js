/**
 * Модуль для управления мобильным меню
 * @class MobileMenu
 */
class MobileMenu {
    constructor() {
        this.menu = $('.mobile-menu');
        this.menuIcon = $('.menu-icon');
        // Селектор для иконки поиска - ищем ссылку с изображением поиска
        this.searchIcon = $('.navbar .menu-item a').filter(function() {
            const $img = $(this).find('img');
            if ($img.length > 0) {
                const alt = ($img.attr('alt') || '').toLowerCase();
                return alt.includes('search');
            }
            return false;
        });
        this.closeBtn = $('.close-btn');
        this.listButtons = $('.list-btn');
        this.contentElements = $('.content-element');
        this.searchInput = $('.search-input');
        this.searchToolBtn = $('.search-tool-btn');
        this.searchResults = null;
        this.currentActiveIndex = 0;
        this.searchTimeout = null;
        
        this.init();
    }
    
    /**
     * Инициализация модуля
     */
    init() {
        this.bindEvents();
        this.createSearchResultsContainer();
        // Устанавливаем первую кнопку как активную
        if (this.listButtons.length > 0) {
            this.listButtons.eq(0).addClass('active');
        }
    }
    
    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        // Открытие меню по клику на иконку меню
        this.menuIcon.on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openMenu();
        });
        
        // Открытие меню по клику на иконку поиска
        this.searchIcon.on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openMenu();
            // Фокус на поле поиска
            setTimeout(() => {
                this.searchInput.focus();
            }, 300);
        });
        
        // Закрытие меню
        this.closeBtn.on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeMenu();
        });
        
        // Закрытие меню по клику вне его области
        $(document).on('click', (e) => {
            if (this.menu.is(':visible')) {
                const $target = $(e.target);
                const isInsideMenu = $target.closest('.mobile-menu').length > 0;
                const isMenuIcon = $target.closest('.menu-icon').length > 0;
                
                // Проверяем, является ли клик по иконке поиска
                let isSearchIcon = false;
                const $clickedLink = $target.closest('.navbar .menu-item a');
                if ($clickedLink.length > 0) {
                    const $img = $clickedLink.find('img');
                    if ($img.length > 0) {
                        const alt = ($img.attr('alt') || '').toLowerCase();
                        isSearchIcon = alt.includes('search');
                    }
                }
                
                if (!isInsideMenu && !isMenuIcon && !isSearchIcon) {
                    this.closeMenu();
                }
            }
        });
        
        // Переключение контента при клике на кнопки списка
        this.listButtons.on('click', (e) => {
            e.preventDefault();
            const button = $(e.currentTarget);
            const index = this.listButtons.index(button);
            this.switchContent(index);
        });
        
        // Поиск при вводе текста (с debounce)
        this.searchInput.on('input', (e) => {
            const query = $(e.target).val().trim();
            
            // Очищаем предыдущий таймер
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            if (query.length > 0) {
                // Debounce: выполняем поиск через 300ms после последнего ввода
                this.searchTimeout = setTimeout(() => {
                    this.performSearch(query);
                }, 300);
            } else {
                this.hideSearchResults();
            }
        });
        
        // Поиск при нажатии Enter
        this.searchInput.on('keypress', (e) => {
            if (e.which === 13) {
                e.preventDefault();
                const query = $(e.target).val().trim();
                if (query.length > 0) {
                    this.performSearch(query);
                }
            }
        });
        
        // Поиск при клике на кнопку поиска
        this.searchToolBtn.on('click', (e) => {
            e.preventDefault();
            const query = this.searchInput.val().trim();
            if (query.length > 0) {
                this.performSearch(query);
            }
        });
        
        // Закрытие меню по Escape
        $(document).on('keydown', (e) => {
            if (e.key === 'Escape' && this.menu.is(':visible')) {
                this.closeMenu();
            }
        });
    }
    
    /**
     * Открытие меню
     */
    openMenu() {
        this.menu.addClass('open').fadeIn(300);
        $('body').css('overflow', 'hidden');
    }
    
    /**
     * Закрытие меню
     */
    closeMenu() {
        this.menu.removeClass('open').fadeOut(300);
        $('body').css('overflow', '');
        this.searchInput.val('');
        this.hideSearchResults();
    }
    
    /**
     * Переключение контента
     * @param {number} index - Индекс элемента контента
     */
    switchContent(index) {
        // Скрываем результаты поиска если они отображаются
        this.hideSearchResults();
        
        // Скрываем все элементы контента
        this.contentElements.fadeOut(200);
        
        // Убираем активное состояние со всех кнопок
        this.listButtons.removeClass('active');
        
        // Показываем выбранный элемент контента
        setTimeout(() => {
            this.contentElements.eq(index).fadeIn(200);
            this.listButtons.eq(index).addClass('active');
            this.currentActiveIndex = index;
        }, 200);
    }
    
    /**
     * Создание контейнера для результатов поиска
     */
    createSearchResultsContainer() {
        if (!$('.search-results-container').length) {
            const resultsContainer = $('<div class="search-results-container"></div>');
            this.menu.find('.right-part').append(resultsContainer);
            this.searchResults = resultsContainer;
        } else {
            this.searchResults = $('.search-results-container');
        }
    }
    
    /**
     * Выполнение поиска
     * @param {string} query - Поисковый запрос
     */
    performSearch(query) {
        // Показываем индикатор загрузки
        this.showSearchLoading();
        
        // AJAX запрос для получения товаров
        // Определяем правильный путь к API в зависимости от текущей страницы
        const apiPath = window.location.pathname.includes('/pages/') 
            ? '../../api/products.json' 
            : '../api/products.json';
        
        $.ajax({
            url: apiPath,
            method: 'GET',
            dataType: 'json',
            success: (data) => {
                if (data.status === 'success' && data.products) {
                    const results = this.filterProducts(data.products, query);
                    this.displaySearchResults(results, query);
                } else {
                    this.showSearchError('Ошибка загрузки данных');
                }
            },
            error: (xhr, status, error) => {
                console.error('Ошибка поиска:', error);
                this.showSearchError('Ошибка при выполнении поиска');
            }
        });
    }
    
    /**
     * Фильтрация товаров по запросу
     * @param {Array} products - Массив товаров
     * @param {string} query - Поисковый запрос
     * @returns {Array} Отфильтрованные товары
     */
    filterProducts(products, query) {
        const lowerQuery = query.toLowerCase();
        return products.filter(product => {
            const title = product.title ? product.title.toLowerCase() : '';
            const brand = product.brand ? product.brand.toLowerCase() : '';
            return title.includes(lowerQuery) || brand.includes(lowerQuery);
        });
    }
    
    /**
     * Отображение результатов поиска
     * @param {Array} results - Результаты поиска
     * @param {string} query - Поисковый запрос
     */
    displaySearchResults(results, query) {
        this.hideContentElements();
        
        let html = '<div class="search-results">';
        html += `<h2 class="search-results-title">Результаты поиска: "${query}"</h2>`;
        
        if (results.length === 0) {
            html += '<p class="search-no-results">Ничего не найдено</p>';
        } else {
            html += `<p class="search-results-count">Найдено: ${results.length}</p>`;
            html += '<div class="search-results-grid">';
            
            results.forEach(product => {
                html += `
                    <div class="search-result-item">
                        <div class="search-result-image">
                            <img src="${product.image}" alt="${product.title}" onerror="this.src='../images/icons/car.png'">
                        </div>
                        <div class="search-result-info">
                            <h3 class="search-result-title">${product.title}</h3>
                            <p class="search-result-brand">Бренд: ${product.brand}</p>
                            <p class="search-result-price">${product.price.toLocaleString('ru-RU')} ₽</p>
                            <p class="search-result-availability ${product.availability === 'В наличии' ? 'in-stock' : 'out-of-stock'}">${product.availability}</p>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        html += '</div>';
        
        this.searchResults.html(html).fadeIn(300);
    }
    
    /**
     * Скрытие элементов контента
     */
    hideContentElements() {
        this.contentElements.hide();
    }
    
    /**
     * Показ элементов контента (при очистке поиска)
     */
    showContentElements() {
        this.contentElements.eq(this.currentActiveIndex).show();
    }
    
    /**
     * Показ индикатора загрузки
     */
    showSearchLoading() {
        this.searchResults.html('<div class="search-loading"><p>Поиск...</p></div>').show();
    }
    
    /**
     * Показ ошибки поиска
     * @param {string} message - Сообщение об ошибке
     */
    showSearchError(message) {
        this.searchResults.html(`<div class="search-error"><p>${message}</p></div>`).show();
    }
    
    /**
     * Скрытие результатов поиска
     */
    hideSearchResults() {
        this.searchResults.fadeOut(200);
        this.showContentElements();
    }
}

// Инициализация при загрузке документа
$(document).ready(function() {
    if ($('.mobile-menu').length) {
        window.mobileMenu = new MobileMenu();
    }
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileMenu;
}
if (typeof window !== 'undefined') {
    window.MobileMenu = MobileMenu;
}

