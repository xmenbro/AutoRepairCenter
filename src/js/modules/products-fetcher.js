/**
 * Модуль для загрузки и отображения товаров
 * @class ProductsFetcher
 */
class ProductsFetcher {
    constructor(options = {}) {
        this.options = {
            containerSelector: '.products-grid',
            apiUrl: '../api/products.json',
            ...options
        };
        
        this.$container = $(this.options.containerSelector);
        this.products = [];
        
        this.init();
    }

    // Инициализация
    init() {
        if (this.$container.length) {
            this.loadProducts();
        } else {
            console.warn(`Контейнер ${this.options.containerSelector} не найден`);
        }
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
            this.addEventHandlers();
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
        
        this.products.forEach(product => {
            const productCard = this.createProductCard(product);
            this.$container.append(productCard);
        });
    }

    // Создание карточки товара
    createProductCard(product) {
        const availabilityData = this.getAvailabilityData(product.availability);
        const formattedPrice = this.formatPrice(product.price);
        
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.title}" loading="lazy">
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

    // Добавление обработчиков событий
    addEventHandlers() {
        this.$container.off('click', '.product-btn').on('click', '.product-btn', (e) => {
            const $button = $(e.currentTarget);
            this.handleProductButtonClick($button);
        });
    }

    // Обработка клика по кнопке товара
    handleProductButtonClick($button) {
        const productId = $button.data('id');
        const productTitle = $button.data('title');
        const buttonText = $button.text();
        
        if (buttonText === "В корзину") {
            this.addToCart(productId, productTitle, $button);
        } else if (buttonText === "Уведомить") {
            this.notifyWhenAvailable(productId, productTitle, $button);
        }
    }

    // Добавление в корзину
    addToCart(productId, productTitle, $button) {
        console.log(`Товар добавлен в корзину: ID=${productId}, Название=${productTitle}`);
        
        // Временное состояние кнопки
        $button.text('Добавлено').prop('disabled', true);
        
        // Здесь можно добавить реальный AJAX запрос:
        // $.post('/api/cart/add', { productId: productId })
        
        // Возвращаем исходное состояние через 2 секунды
        setTimeout(() => {
            $button.text('В корзину').prop('disabled', false);
        }, 2000);
    }

    // Уведомление о поступлении
    notifyWhenAvailable(productId, productTitle, $button) {
        console.log(`Запрос на уведомление: ID=${productId}, Название=${productTitle}`);
        
        // Временное состояние кнопки
        $button.text('Запрос отправлен').prop('disabled', true);
        
        // Здесь можно добавить реальный AJAX запрос:
        // $.post('/api/notify', { productId: productId })
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