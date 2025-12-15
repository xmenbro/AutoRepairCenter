/**
 * Модуль для управления страницей корзины
 * Использует jQuery + Ajax для всех операций с корзиной
 * @class Basket
 */
class Basket {
    constructor() {
        this.$cardContainer = $('.card-container');
        this.$orderContainer = $('.order-container');
        this.$emptyContainer = $('.empty-container');
        this.cart = window.cart;
        
        if (!this.cart) {
            console.error('Модуль корзины не загружен');
            return;
        }
        
        this.init();
    }

    // Инициализация
    init() {
        this.setupEventHandlers(); // Настраиваем обработчики один раз
        this.loadCartItems();
    }

    // Загрузка товаров корзины
    loadCartItems() {
        const self = this;
        
        // Показываем состояние загрузки
        this.showLoadingState();
        
        // Загружаем корзину через AJAX
        this.cart.getCart()
            .done(function(response) {
                if (response.status === 'success') {
                    if (response.cart.length === 0) {
                        self.showEmptyState();
                    } else {
                        self.renderCartItems(response.cart);
                        self.updateOrderSummary(response);
                    }
                }
            })
            .fail(function(error) {
                console.error('Ошибка при загрузке корзины:', error);
                self.showErrorMessage('Ошибка при загрузке корзины');
            });
    }

    // Отображение товаров корзины
    renderCartItems(cartItems) {
        this.$cardContainer.empty();
        
        cartItems.forEach((item, index) => {
            const cartCard = this.createCartCard(item, index);
            this.$cardContainer.append(cartCard);
        });
        
        // Показываем контейнер с товарами и форму оформления, скрываем пустое состояние
        this.$cardContainer.closest('.cart-left').show();
        this.$orderContainer.closest('.main-container').show();
        if (this.$orderContainer.length) {
            this.$orderContainer.show();
        }
        if (this.$emptyContainer.length) {
            this.$emptyContainer.hide();
        }
    }

    // Создание карточки товара в корзине
    createCartCard(item, index) {
        const formattedPrice = this.formatPrice(item.price);
        const totalPrice = this.formatPrice(item.price * item.quantity);
        const deliveryDate = this.calculateDeliveryDate();
        
        // Исправляем путь к изображению для страницы корзины
        let imagePath = item.image;
        if (imagePath.startsWith('../images/')) {
            imagePath = imagePath.replace('../images/', '../../images/');
        }
        
        return $(`
            <div class="card" data-product-id="${item.id}">
                <input type="checkbox" name="choose" id="choose-${item.id}" class="card-checkbox" checked>
                <img src="${imagePath}" alt="${item.title}" class="card-image">
                <span class="card-name">${this.escapeHtml(item.title)}</span>
                <div class="control">
                    <button class="delete-btn" type="button" data-product-id="${item.id}">
                        <img src="../../images/icons/trash.png" alt="Удалить" class="delete-icon">
                    </button>
                    <input type="number" class="count" value="${item.quantity}" min="1" data-product-id="${item.id}">
                    <button class="add-btn" type="button" data-product-id="${item.id}">+</button>
                </div>
                <span class="delivery">${deliveryDate}</span>
                <span class="price">${totalPrice} руб.</span>
            </div>
        `);
    }

    // Удаление товара из корзины
    removeItem(productId) {
        const self = this;
        const $card = $(`.card[data-product-id="${productId}"]`);
        
        // Показываем состояние загрузки на карточке
        $card.css('opacity', '0.5');
        
        // Удаляем через AJAX
        this.cart.removeItem(productId)
            .done(function(response) {
                if (response.status === 'success') {
                    // Анимация удаления
                    $card.fadeOut(300, function() {
                        $(this).remove();
                        
                        // Если корзина пуста, показываем пустое состояние
                        if (response.cart.length === 0) {
                            self.showEmptyState();
                        } else {
                            self.updateOrderSummary(response);
                        }
                    });
                }
            })
            .fail(function(error) {
                console.error('Ошибка при удалении товара:', error);
                $card.css('opacity', '1');
                self.showErrorMessage('Ошибка при удалении товара');
            });
    }

    // Обновление количества товара
    updateItemQuantity(productId, quantity) {
        const self = this;
        const $card = $(`.card[data-product-id="${productId}"]`);
        const $countInput = $card.find('.count');
        
        // Блокируем input во время обновления
        $countInput.prop('disabled', true);
        
        // Обновляем через AJAX
        this.cart.updateQuantity(productId, quantity)
            .done(function(response) {
                if (response.status === 'success') {
                    // Обновляем значение input
                    $countInput.val(response.cart.find(item => item.id === productId)?.quantity || 1);
                    
                    // Обновляем цену товара
                    const item = response.cart.find(item => item.id === productId);
                    if (item) {
                        const totalPrice = self.formatPrice(item.price * item.quantity);
                        $card.find('.price').text(`${totalPrice} руб.`);
                    }
                    
                    // Обновляем итоговую информацию
                    self.updateOrderSummary(response);
                }
                $countInput.prop('disabled', false);
            })
            .fail(function(error) {
                console.error('Ошибка при обновлении количества:', error);
                $countInput.prop('disabled', false);
                self.showErrorMessage('Ошибка при обновлении количества');
            });
    }

    // Обновление итоговой информации о заказе
    updateOrderSummary(cartResponse = null) {
        const self = this;
        
        // Если данные не переданы, загружаем их
        if (!cartResponse) {
            this.cart.getCart()
                .done(function(response) {
                    if (response.status === 'success') {
                        self.renderOrderSummary(response);
                    }
                });
        } else {
            this.renderOrderSummary(cartResponse);
        }
    }

    // Отображение итоговой информации
    renderOrderSummary(response) {
        // Подсчитываем только выбранные товары
        const selectedItems = [];
        $('.card-checkbox:checked').each(function() {
            const productId = parseInt($(this).attr('id').replace('choose-', ''));
            const item = response.cart.find(item => item.id === productId);
            if (item) {
                selectedItems.push(item);
            }
        });
        
        const totalCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const formattedTotal = this.formatPrice(totalPrice);
        
        // Определяем дату доставки (самая поздняя из выбранных)
        const deliveryDate = this.calculateDeliveryDate();
        
        // Обновляем информацию
        $('.order-row:first-child .right-info-part').text(`${totalCount} ${this.getItemsText(totalCount)}`);
        $('.order-row:nth-child(2) .right-info-part').text(`${formattedTotal} руб.`);
        $('.order-row:nth-child(3) .right-info-part').text(deliveryDate);
        $('.right-cost-info-part').text(`${formattedTotal} руб.`);
    }

    // Получить правильное склонение для количества товаров
    getItemsText(count) {
        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
            return 'шт.';
        }
        if (lastDigit === 1) {
            return 'шт.';
        }
        if (lastDigit >= 2 && lastDigit <= 4) {
            return 'шт.';
        }
        return 'шт.';
    }

    // Вычисление даты доставки
    calculateDeliveryDate() {
        const today = new Date();
        const minDays = 1; // Минимум 1 день
        const maxDays = 3; // Максимум 3 дня
        
        // Вычисляем диапазон дат доставки
        const minDeliveryDate = new Date(today);
        minDeliveryDate.setDate(today.getDate() + minDays);
        
        const maxDeliveryDate = new Date(today);
        maxDeliveryDate.setDate(today.getDate() + maxDays);
        
        const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                          'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        
        const minDay = minDeliveryDate.getDate();
        const minMonth = monthNames[minDeliveryDate.getMonth()];
        const maxDay = maxDeliveryDate.getDate();
        const maxMonth = monthNames[maxDeliveryDate.getMonth()];
        
        // Если даты в одном месяце
        if (minDeliveryDate.getMonth() === maxDeliveryDate.getMonth()) {
            // Если диапазон больше одного дня, показываем диапазон
            if (minDay !== maxDay) {
                return `${minDay}-${maxDay} ${minMonth}`;
            } else {
                // Если одна дата
                return `${minDay} ${minMonth}`;
            }
        } else {
            // Если даты в разных месяцах
            return `${minDay} ${minMonth} - ${maxDay} ${maxMonth}`;
        }
    }

    // Показать пустое состояние
    showEmptyState() {
        this.$cardContainer.closest('.cart-left').hide();
        // Скрываем форму оформления заказа когда корзина пуста
        if (this.$orderContainer.length) {
            this.$orderContainer.hide();
        }
        if (this.$emptyContainer.length) {
            this.$emptyContainer.show();
        } else {
            // Если контейнер закомментирован в HTML, создаем его динамически
            const $main = $('.main');
            // Скрываем форму оформления
            if (this.$orderContainer.length) {
                this.$orderContainer.hide();
            }
            $main.html(`
                <div class="empty-container" style="text-align: center; padding: 100px 20px;">
                    <h2 class="section-title">В корзине нет товаров</h2>
                    <button class="return-btn" style="
                        margin-top: 30px;
                        padding: 15px 40px;
                        background-color: #0f57c9;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                    ">
                        <a href="../index.html" style="color: white; text-decoration: none;">К покупкам</a>
                    </button>
                </div>
            `);
        }
    }

    // Показать состояние загрузки
    showLoadingState() {
        this.$cardContainer.html(`
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p>Загрузка корзины...</p>
            </div>
        `);
    }

    // Показать сообщение об ошибке
    showErrorMessage(message) {
        this.$cardContainer.html(`
            <div style="
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
        
        const self = this;
        this.$cardContainer.find('.retry-btn').on('click', function() {
            self.loadCartItems();
        });
    }

    // Настройка основных обработчиков событий
    setupEventHandlers() {
        const self = this;
        
        // Обработчик удаления товара (делегирование событий)
        $(document).on('click', '.delete-btn', function(e) {
            e.preventDefault();
            const productId = parseInt($(this).data('product-id') || $(this).closest('.card').data('product-id'));
            if (productId) {
                self.removeItem(productId);
            }
        });
        
        // Обработчик изменения количества через input (делегирование событий)
        $(document).on('change', '.count', function(e) {
            const productId = parseInt($(this).data('product-id') || $(this).closest('.card').data('product-id'));
            if (productId) {
                const quantity = parseInt($(this).val()) || 1;
                self.updateItemQuantity(productId, quantity);
            }
        });
        
        // Обработчик кнопки "+" для увеличения количества (делегирование событий)
        $(document).on('click', '.add-btn', function(e) {
            e.preventDefault();
            const productId = parseInt($(this).data('product-id') || $(this).closest('.card').data('product-id'));
            if (productId) {
                const $countInput = $(this).siblings('.count');
                const currentQuantity = parseInt($countInput.val()) || 1;
                self.updateItemQuantity(productId, currentQuantity + 1);
            }
        });
        
        // Обработчик чекбоксов выбора товаров (делегирование событий)
        $(document).on('change', '.card-checkbox', function() {
            self.updateOrderSummary();
        });
        
        // Обработчик "Выбрать всё"
        $(document).on('change', '#choose-all', function() {
            const isChecked = $(this).is(':checked');
            $('.card-checkbox').prop('checked', isChecked);
            self.updateOrderSummary();
        });
        
        // Обработчик кнопки "ПЕРЕЙТИ К ОФОРМЛЕНИЮ"
        $(document).on('click', '.order-btn', function(e) {
            e.preventDefault();
            const selectedItems = $('.card-checkbox:checked').length;
            if (selectedItems === 0) {
                alert('Выберите товары для оформления заказа');
                return;
            }
            // Здесь можно добавить переход на страницу оформления
            console.log('Переход к оформлению заказа');
        });
    }
    

    // Форматировать цену
    formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // Экранирование HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация при загрузке документа
$(document).ready(function() {
    if ($('.card-container').length) {
        window.basket = new Basket();
    }
});

// Экспорт для разных систем модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Basket;
}
if (typeof window !== 'undefined') {
    window.Basket = Basket;
}

