/**
 * Модуль для загрузки и отображения товаров
 * @class ProductsFetcher
 */
class ProductsFetcher {
    constructor(options = {}) {
        this.options = {
            containerSelector: '.products-grid',
            apiUrl: '../api/products.json',
            cardsPerView: 4, // Количество видимых карточек
            imageBasePath: '../', // Базовый путь к изображениям
            ...options
        };
        
        this.$container = $(this.options.containerSelector);
        this.$carouselWrapper = null;
        this.products = [];
        this.currentIndex = 0;
        this.cardsPerView = this.options.cardsPerView;
        
        this.init();
    }

    // Инициализация
    init() {
        if (this.$container.length) {
            this.setupCarouselButtons();
            this.updateCardsPerView();
            this.loadProducts();
            
            // Обновляем количество видимых карточек при изменении размера окна
            let resizeTimeout;
            $(window).on('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.updateCardsPerView();
                }, 150);
            });
        } else {
            console.warn(`Контейнер ${this.options.containerSelector} не найден`);
        }
    }
    
    // Определение количества видимых карточек в зависимости от размера экрана
    updateCardsPerView() {
        const width = $(window).width();
        if (width <= 480) {
            this.cardsPerView = 1;
        } else if (width <= 768) {
            this.cardsPerView = 2;
        } else if (width <= 992) {
            this.cardsPerView = 3;
        } else {
            this.cardsPerView = 4;
        }
        
        // Обновляем ширину карточек при изменении размера экрана
        if (this.$carouselWrapper && this.$carouselWrapper.length) {
            // Используем requestAnimationFrame для правильного расчета после изменения размера
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Сбрасываем сохраненные значения для пересчета
                    this.cardWidth = null;
                    this.cardGap = null;
                    this.wrapperWidth = null;
                    this.setCardWidths();
                    // Убеждаемся, что currentIndex не выходит за границы
                    const maxIndex = Math.max(0, this.products.length - this.cardsPerView);
                    this.currentIndex = Math.min(this.currentIndex, maxIndex);
                    this.updateCarousel();
                });
            });
        }
    }
    
    // Настройка кнопок карусели
    setupCarouselButtons() {
        $('.carousel-btn.prev').on('click', () => this.prevSlide());
        $('.carousel-btn.next').on('click', () => this.nextSlide());
    }

    // Загрузка товаров
    loadProducts() {
        this.showLoadingState();
        
        $.ajax({
            url: this.options.apiUrl,
            type: 'GET',
            dataType: 'json',
            timeout: 10000
        })
        .done((data) => this.handleSuccess(data))
        .fail((jqXHR, textStatus, errorThrown) => {
            this.handleError(jqXHR, textStatus, errorThrown);
        });
    }

    // Обработка успешной загрузки
    handleSuccess(data) {
        if (data.status === 'success' && data.products) {
            this.products = data.products;
            this.renderProducts();
        } else {
            this.showErrorMessage(data.message || 'Неверный формат данных');
        }
    }

    // Обработка ошибок
    handleError(jqXHR, textStatus, errorThrown) {
        console.error('Ошибка загрузки товаров:', textStatus, errorThrown);
        
        let errorMessage = 'Ошибка при загрузке данных. Пожалуйста, попробуйте позже.';
        
        if (textStatus === 'timeout') {
            errorMessage = 'Превышено время ожидания ответа от сервера';
        } else if (textStatus === 'parsererror') {
            errorMessage = 'Ошибка обработки данных с сервера';
        } else if (jqXHR.status === 404) {
            errorMessage = 'Файл с товарами не найден';
        }
        
        this.showErrorMessage(errorMessage);
    }

    // Отображение товаров
    renderProducts() {
        this.$container.empty();
        
        // Создаем обертку для карусели
        this.$carouselWrapper = $('<div class="carousel-wrapper"></div>');
        this.$container.append(this.$carouselWrapper);
        
        // Создаем контейнер для карточек
        const $cardsContainer = $('<div class="carousel-cards"></div>');
        this.$carouselWrapper.append($cardsContainer);
        
        // Добавляем все карточки
        this.products.forEach(product => {
            const productCard = this.createProductCard(product);
            $cardsContainer.append(productCard);
        });
        
        // Добавляем обработчики событий для кнопок добавления в корзину
        this.setupCartButtons();
        
        // Устанавливаем ширину карточек после добавления в DOM
        // Используем requestAnimationFrame для обеспечения правильного расчета размеров после рендеринга
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.setCardWidths();
                this.currentIndex = 0;
                this.updateCarousel();
            });
        });
    }
    
    // Настройка обработчиков кнопок корзины
    setupCartButtons() {
        const self = this;
        
        // Обработчик для кнопки "В корзину"
        $(document).off('click', '.product-btn:not(.btn-out-of-stock)').on('click', '.product-btn:not(.btn-out-of-stock)', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const $button = $(this);
            const productId = parseInt($button.data('id'));
            const product = self.getProductById(productId);
            
            if (!product) {
                console.error('Товар не найден');
                return;
            }
            
            // Проверяем, что корзина доступна
            if (typeof window.cart === 'undefined') {
                console.error('Модуль корзины не загружен');
                return;
            }
            
            // Блокируем кнопку во время выполнения запроса
            const originalText = $button.text();
            $button.prop('disabled', true).text('Добавление...');
            
            // Добавляем товар в корзину через AJAX
            window.cart.addItem(product, 1)
                .done(function(response) {
                    if (response.status === 'success') {
                        // Показываем сообщение об успехе
                        $button.text('Добавлено!');
                        setTimeout(() => {
                            $button.text(originalText).prop('disabled', false);
                        }, 1500);
                        
                        // Можно добавить уведомление или обновление счетчика корзины
                        self.showCartNotification('Товар добавлен в корзину');
                    }
                })
                .fail(function(error) {
                    console.error('Ошибка при добавлении в корзину:', error);
                    $button.text('Ошибка').prop('disabled', false);
                    setTimeout(() => {
                        $button.text(originalText);
                    }, 2000);
                    self.showCartNotification('Ошибка при добавлении товара', 'error');
                });
        });
        
        // Обработчик для кнопки "Уведомить" (товар не в наличии)
        $(document).off('click', '.product-btn.btn-out-of-stock').on('click', '.product-btn.btn-out-of-stock', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const $button = $(this);
            const productId = parseInt($button.data('id'));
            const productTitle = $button.data('title');
            
            self.notifyWhenAvailable(productId, productTitle, $button);
        });
    }
    
    // Показать уведомление о действии с корзиной
    showCartNotification(message, type = 'success') {
        // Удаляем предыдущее уведомление если есть
        $('.cart-notification').remove();
        
        const bgColor = type === 'success' ? '#27ae60' : '#e74c3c';
        const $notification = $(`
            <div class="cart-notification" style="
                position: fixed;
                top: 100px;
                right: 20px;
                background-color: ${bgColor};
                color: white;
                padding: 15px 20px;
                border-radius: 4px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
            ">
                ${message}
            </div>
        `);
        
        // Добавляем стили для анимации если их еще нет
        if (!$('#cart-notification-styles').length) {
            $('head').append(`
                <style id="cart-notification-styles">
                    @keyframes slideIn {
                        from {
                            transform: translateX(400px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                </style>
            `);
        }
        
        $('body').append($notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            $notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }
    
    // Переход к предыдущему слайду (на страницу назад)
    prevSlide() {
        if (this.currentIndex > 0) {
            // Переходим на предыдущую страницу (cardsPerView карточек)
            this.currentIndex = Math.max(0, this.currentIndex - this.cardsPerView);
            this.updateCarousel();
        }
    }
    
    // Переход к следующему слайду (на страницу вперед)
    nextSlide() {
        const maxIndex = Math.max(0, this.products.length - this.cardsPerView);
        if (this.currentIndex < maxIndex) {
            // Переходим на следующую страницу (cardsPerView карточек)
            this.currentIndex = Math.min(maxIndex, this.currentIndex + this.cardsPerView);
            this.updateCarousel();
        }
    }
    
    // Установка ширины карточек на основе ширины wrapper
    setCardWidths() {
        if (!this.$carouselWrapper || this.products.length === 0) return;
        
        const $cardsContainer = this.$carouselWrapper.find('.carousel-cards');
        const $cards = $cardsContainer.find('.product-card');
        
        if ($cards.length === 0) return;
        
        // Получаем реальную ширину wrapper (внутренняя ширина без padding)
        const wrapperRect = this.$carouselWrapper[0].getBoundingClientRect();
        const wrapperComputedStyle = window.getComputedStyle(this.$carouselWrapper[0]);
        const wrapperPaddingLeft = parseFloat(wrapperComputedStyle.paddingLeft) || 0;
        const wrapperPaddingRight = parseFloat(wrapperComputedStyle.paddingRight) || 0;
        const wrapperWidth = wrapperRect.width - wrapperPaddingLeft - wrapperPaddingRight;
        
        // Получаем gap из вычисленных стилей (более надежный способ)
        const cardsComputedStyle = window.getComputedStyle($cardsContainer[0]);
        let gap = parseFloat(cardsComputedStyle.gap);
        
        // Если gap не поддерживается, используем column-gap
        if (isNaN(gap) || gap === 0) {
            gap = parseFloat(cardsComputedStyle.columnGap) || 25;
        }
        
        // Вычисляем общую ширину всех gaps между карточками
        const totalGaps = (this.cardsPerView - 1) * gap;
        
        // Вычисляем ширину одной карточки с точностью до 2 знаков после запятой
        const cardWidth = (wrapperWidth - totalGaps) / this.cardsPerView;
        
        // Округляем до 2 знаков для точности, но используем полное значение
        const cardWidthRounded = Math.floor(cardWidth * 100) / 100;
        
        // Устанавливаем ширину для всех карточек
        $cards.css({
            'width': `${cardWidthRounded}px`,
            'flex': `0 0 ${cardWidthRounded}px`,
            'min-width': `${cardWidthRounded}px`,
            'max-width': `${cardWidthRounded}px`
        });
        
        // Сохраняем ширину карточки и gap для использования в updateCarousel
        this.cardWidth = cardWidthRounded;
        this.cardGap = gap;
        this.wrapperWidth = wrapperWidth;
        
        // Убеждаемся, что контейнер не переполняется и правильно отображается
        $cardsContainer.css({
            'width': 'auto',
            'min-width': '100%'
        });
    }
    
    // Обновление состояния карусели
    updateCarousel() {
        if (!this.$carouselWrapper || this.products.length === 0) return;
        
        const $cardsContainer = this.$carouselWrapper.find('.carousel-cards');
        
        // Если карточки еще не были рассчитаны, пересчитываем
        if (!this.cardWidth || !this.wrapperWidth || !this.cardGap) {
            this.setCardWidths();
        }
        
        // Убеждаемся, что currentIndex не выходит за границы
        const maxIndex = Math.max(0, this.products.length - this.cardsPerView);
        if (this.currentIndex > maxIndex) {
            this.currentIndex = maxIndex;
        }
        if (this.currentIndex < 0) {
            this.currentIndex = 0;
        }
        
        // Вычисляем смещение на основе индекса текущей карточки
        // Каждая карточка имеет ширину cardWidth + gap (кроме последней на странице)
        // Смещаем на количество карточек от начала
        const translateX = -(this.currentIndex * (this.cardWidth + this.cardGap));
        
        $cardsContainer.css({
            'transform': `translateX(${translateX}px)`,
            'transition': 'transform 0.5s ease-in-out'
        });
        
        // Обновляем состояние кнопок
        this.updateButtons();
    }
    
    // Обновление состояния кнопок навигации
    updateButtons() {
        const $prevBtn = $('.carousel-btn.prev');
        const $nextBtn = $('.carousel-btn.next');
        
        // Вычисляем максимальный индекс для последней полной страницы
        const totalPages = Math.ceil(this.products.length / this.cardsPerView);
        const lastPageStartIndex = (totalPages - 1) * this.cardsPerView;
        const maxIndex = Math.max(0, lastPageStartIndex);
        
        // Предыдущая кнопка - отключаем если на первой странице
        if (this.currentIndex === 0) {
            $prevBtn.prop('disabled', true).addClass('disabled');
        } else {
            $prevBtn.prop('disabled', false).removeClass('disabled');
        }
        
        // Следующая кнопка - отключаем если на последней странице
        if (this.currentIndex >= maxIndex) {
            $nextBtn.prop('disabled', true).addClass('disabled');
        } else {
            $nextBtn.prop('disabled', false).removeClass('disabled');
        }
    }

    // Построение корректного пути к изображению
    resolveImageUrl(imagePath) {
        if (!imagePath) return '';
        // Если это data URL — возвращаем как есть
        if (imagePath.startsWith('data:')) {
            return imagePath;
        }
        // Абсолютные и внешние ссылки не трогаем
        if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
            return imagePath;
        }

        let normalizedPath = imagePath;

        // Убираем ведущие ../ или ./ чтобы можно было добавить базовый путь
        if (normalizedPath.startsWith('../')) {
            normalizedPath = normalizedPath.substring(3);
        } else if (normalizedPath.startsWith('./')) {
            normalizedPath = normalizedPath.substring(2);
        }

        return `${this.options.imageBasePath}${normalizedPath}`;
    }

    // Создание карточки товара
    createProductCard(product) {
        const availabilityData = this.getAvailabilityData(product.availability);
        const formattedPrice = this.formatPrice(product.price);
        const imageUrl = this.resolveImageUrl(product.image);
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.title}" loading="lazy">
                </div>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-brand">${product.brand}</div>
                <div class="product-price">${formattedPrice} руб.</div>
                <div class="product-availability ${availabilityData.class}">
                    <div class="availability-dot"></div>
                    ${product.availability}
                </div>
                <button class="${availabilityData.buttonClass}" 
                        data-id="${product.id}"
                        data-title="${this.escapeHtml(product.title)}"
                        data-availability="${product.availability}">
                    ${availabilityData.buttonText}
                </button>
            </div>
        `;
    }

    // Уведомление о поступлении
    notifyWhenAvailable(productId, productTitle, $button) {
        console.log(`Запрос на уведомление: ID=${productId}, Название=${productTitle}`);
        
        // Временное состояние кнопки
        const originalText = $button.text();
        $button.text('Запрос отправлен').prop('disabled', true);
        
        // Можно добавить AJAX запрос для отправки уведомления
        // Здесь просто показываем сообщение
        this.showCartNotification('Вы будете уведомлены о поступлении товара');
    }

    // Получение данных о доступности
    getAvailabilityData(availability) {
        if (availability === "В наличии") {
            return {
                class: "in-stock",
                buttonText: "В корзину",
                buttonClass: "product-btn"
            };
        } else {
            return {
                class: "out-of-stock",
                buttonText: "Уведомить",
                buttonClass: "product-btn btn-out-of-stock"
            };
        }
    }

    // Форматирование цены
    formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // Экранирование HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Показать состояние загрузки
    showLoadingState() {
        this.$container.html(`
            <div class="loading-state" style="
                text-align: center;
                padding: 40px;
                color: #666;
            ">
                <div class="spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p>Загрузка товаров...</p>
            </div>
        `);
    }

    // Показать сообщение об ошибке
    showErrorMessage(message) {
        this.$container.html(`
            <div class="error-message" style="
                text-align: center;
                padding: 20px;
                color: #d32f2f;
                background-color: #ffebee;
                border-radius: 4px;
                margin: 20px 0;
                border: 1px solid #ffcdd2;
            ">
                <p>${message}</p>
                <button class="retry-btn" style="
                    margin-top: 10px;
                    padding: 8px 16px;
                    background-color: #f44336;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Повторить попытку</button>
            </div>
        `);
        
        // Добавляем обработчик для кнопки повтора
        this.$container.find('.retry-btn').on('click', () => {
            this.loadProducts();
        });
    }

    // Обновить товары
    refresh() {
        this.loadProducts();
    }

    // Получить список товаров
    getProducts() {
        return this.products;
    }

    // Найти товар по ID
    getProductById(id) {
        return this.products.find(product => product.id === id);
    }
}

// Инициализация при загрузке документа
$(document).ready(function() {
    window.productsFetcher = new ProductsFetcher();
});

// Экспорт для разных систем модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductsFetcher;
}
if (typeof window !== 'undefined') {
    window.ProductsFetcher = ProductsFetcher;
}