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
        this.currentActiveIndex = 0;
        this.searchTimeout = null;
        
        this.init();
    }
    
    /**
     * Инициализация модуля
     */
    init() {
        this.bindEvents();
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
                // Debounce: подсвечиваем совпадения через 300ms после последнего ввода
                this.searchTimeout = setTimeout(() => {
                    this.highlightMenuItems(query);
                }, 300);
            } else {
                this.removeHighlights();
            }
        });
        
        // Поиск при нажатии Enter
        this.searchInput.on('keypress', (e) => {
            if (e.which === 13) {
                e.preventDefault();
                const query = $(e.target).val().trim();
                if (query.length > 0) {
                    this.highlightMenuItems(query);
                }
            }
        });
        
        // Поиск при клике на кнопку поиска
        this.searchToolBtn.on('click', (e) => {
            e.preventDefault();
            const query = this.searchInput.val().trim();
            if (query.length > 0) {
                this.highlightMenuItems(query);
            }
        });
        
        // Закрытие меню по Escape
        $(document).on('keydown', (e) => {
            if (e.key === 'Escape' && this.menu.is(':visible')) {
                this.closeMenu();
            }
        });
        
        // Обработка кликов на элементы списка для навигации
        $(document).on('click', '.coll-list-element:not(:first-child)', (e) => {
            e.preventDefault();
            const $element = $(e.currentTarget);
            const text = $element.text().trim();
            this.navigateToPage(text);
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
        this.removeHighlights();
    }
    
    /**
     * Переключение контента
     * @param {number} index - Индекс элемента контента
     */
    switchContent(index) {
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
     * Подсветка элементов меню при поиске
     * @param {string} query - Поисковый запрос
     */
    highlightMenuItems(query) {
        const lowerQuery = query.toLowerCase();
        
        // Подсвечиваем кнопки в левом меню
        this.listButtons.each((index, button) => {
            const $button = $(button);
            const text = $button.text().toLowerCase();
            if (text.includes(lowerQuery)) {
                $button.addClass('search-highlight');
            } else {
                $button.removeClass('search-highlight');
            }
        });
        
        // Подсвечиваем элементы в контенте
        this.contentElements.find('.coll-list-element').each((index, element) => {
            const $element = $(element);
            const text = $element.text().toLowerCase();
            if (text.includes(lowerQuery)) {
                $element.addClass('search-highlight');
            } else {
                $element.removeClass('search-highlight');
            }
        });
    }
    
    /**
     * Удаление подсветки
     */
    removeHighlights() {
        this.listButtons.removeClass('search-highlight');
        this.contentElements.find('.coll-list-element').removeClass('search-highlight');
    }
    
    /**
     * Навигация на страницу по тексту элемента
     * @param {string} text - Текст элемента
     */
    navigateToPage(text) {
        // Определяем базовый путь в зависимости от текущей страницы
        const isInPages = window.location.pathname.includes('/pages/');
        const basePath = isInPages ? '' : 'pages/';
        
        // Маппинг текста на страницы
        const pageMapping = {
            // Запчасти
            'двигатель': 'parts.html',
            'поршни': 'parts.html',
            'клапаны': 'parts.html',
            'ремни': 'parts.html',
            'генераторы': 'parts.html',
            'стартеры': 'parts.html',
            'трансмиссия': 'parts.html',
            'коробка передач': 'parts.html',
            'сцепление': 'parts.html',
            'валы': 'parts.html',
            'дифференциал': 'parts.html',
            'подшипники': 'parts.html',
            'тормозная система': 'parts.html',
            'колодки': 'parts.html',
            'диски': 'parts.html',
            'шланги': 'parts.html',
            'суппорта': 'parts.html',
            'цилиндры': 'parts.html',
            
            // Плановое ТО и автотехцентр
            'плановое то': 'auto-service.html',
            'замена масла': 'auto-service.html',
            'диагностика ходовой': 'auto-service.html',
            'замена свечей': 'auto-service.html',
            'сход-развал': 'auto-service.html',
            'воздушный фильтр': 'auto-service.html',
            'чип-тюнинг': 'auto-service.html',
            'масло в кпп': 'auto-service.html',
            'проверка жидкостей': 'auto-service.html',
            'диагностика тормозов': 'auto-service.html',
            'тормозная жидкость': 'auto-service.html',
            'ремень грм': 'auto-service.html',
            'кондиционер': 'auto-service.html',
            'электроника': 'auto-service.html',
            'аккумулятор': 'auto-service.html',
            'топливный фильтр': 'auto-service.html',
            'чистка инжектора': 'auto-service.html',
            'система охлаждения': 'auto-service.html',
            'диагностика': 'auto-service.html',
            
            // Кузовной ремонт
            'кузовной ремонт': 'auto-service.html',
            'выравнивание вмятин': 'auto-service.html',
            'ремонт бамперов': 'auto-service.html',
            'геометрия кузова': 'auto-service.html',
            'рихтовка': 'auto-service.html',
            'замена порогов': 'auto-service.html',
            'ремонт арок': 'auto-service.html',
            'локальная покраска': 'detailing.html',
            'полная покраска': 'detailing.html',
            'полировка': 'detailing.html',
            'антикор': 'auto-service.html',
            'устранение царапин': 'detailing.html',
            'бронирование пленкой': 'detailing.html',
            'замена стекол': 'auto-service.html',
            'ремонт дверей': 'auto-service.html',
            'ремонт после дтп': 'auto-service.html',
            'ремонт крыши': 'auto-service.html',
            'замена капота': 'auto-service.html',
            'арматурные работы': 'auto-service.html',
            
            // Замена масла
            'синтетическое масло': 'auto-service.html',
            'полусинтетическое': 'auto-service.html',
            'минеральное': 'auto-service.html',
            'масло для дизеля': 'auto-service.html',
            'масло для турбо': 'auto-service.html',
            'сезонная замена': 'auto-service.html',
            'масло в акпп': 'auto-service.html',
            'масло в мкпп': 'auto-service.html',
            'масло в редукторе': 'auto-service.html',
            'раздаточная коробка': 'auto-service.html',
            'промывка системы': 'auto-service.html',
            'масляный радиатор': 'auto-service.html',
            'масляный фильтр': 'auto-service.html',
            'салонный фильтр': 'auto-service.html',
            'утилизация масла': 'auto-service.html',
            'подбор масла': 'auto-service.html'
        };
        
        // Ищем соответствие (без учета регистра)
        const lowerText = text.toLowerCase();
        let targetPage = null;
        
        // Проверяем точное совпадение
        if (pageMapping[lowerText]) {
            targetPage = pageMapping[lowerText];
        } else {
            // Проверяем частичное совпадение
            for (const key in pageMapping) {
                if (lowerText.includes(key) || key.includes(lowerText)) {
                    targetPage = pageMapping[key];
                    break;
                }
            }
        }
        
        // Если найдена страница, переходим на неё
        if (targetPage) {
            window.location.href = basePath + targetPage;
        } else {
            // По умолчанию переходим на страницу запчастей
            window.location.href = basePath + 'parts.html';
        }
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

