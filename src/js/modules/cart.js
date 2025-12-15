/**
 * Модуль для управления корзиной товаров
 * Использует localStorage для хранения данных и jQuery Ajax для операций
 * @class Cart
 */
class Cart {
    constructor() {
        this.storageKey = 'autoRepairCart';
        this.init();
    }

    // Инициализация
    init() {
        // Инициализация корзины в localStorage если её нет
        if (!this.getCartFromStorage()) {
            this.saveCartToStorage([]);
        }
    }

    // Получить корзину из localStorage
    getCartFromStorage() {
        try {
            const cartData = localStorage.getItem(this.storageKey);
            return cartData ? JSON.parse(cartData) : null;
        } catch (error) {
            console.error('Ошибка при чтении корзины из localStorage:', error);
            return null;
        }
    }

    // Сохранить корзину в localStorage
    saveCartToStorage(cart) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(cart));
        } catch (error) {
            console.error('Ошибка при сохранении корзины в localStorage:', error);
        }
    }

    // Получить корзину
    getCart() {
        return $.Deferred((deferred) => {
            setTimeout(() => {
                try {
                    const cart = this.getCartFromStorage() || [];
                    deferred.resolve({
                        status: 'success',
                        cart: cart,
                        count: cart.reduce((sum, item) => sum + item.quantity, 0),
                        total: this.calculateTotal(cart)
                    });
                } catch (error) {
                    deferred.reject({
                        status: 'error',
                        message: 'Ошибка при загрузке корзины'
                    });
                }
            }, 100);
        }).promise();
    }

    // Добавить товар в корзину
    addItem(product, quantity = 1) {
        return $.Deferred((deferred) => {
            setTimeout(() => {
                try {
                    let cart = this.getCartFromStorage() || [];
                    const existingItemIndex = cart.findIndex(item => item.id === product.id);

                    if (existingItemIndex !== -1) {
                        // Товар уже в корзине - увеличиваем количество
                        cart[existingItemIndex].quantity += quantity;
                    } else {
                        // Новый товар - добавляем в корзину
                        const cartItem = {
                            id: product.id,
                            title: product.title,
                            brand: product.brand,
                            image: product.image,
                            price: product.price,
                            availability: product.availability,
                            quantity: quantity
                        };
                        cart.push(cartItem);
                    }

                    this.saveCartToStorage(cart);
                    
                    deferred.resolve({
                        status: 'success',
                        cart: cart,
                        count: cart.reduce((sum, item) => sum + item.quantity, 0),
                        total: this.calculateTotal(cart),
                        message: 'Товар добавлен в корзину'
                    });
                } catch (error) {
                    deferred.reject({
                        status: 'error',
                        message: 'Ошибка при добавлении товара в корзину'
                    });
                }
            }, 100);
        }).promise();
    }

    // Удалить товар из корзины
    removeItem(productId) {
        return $.Deferred((deferred) => {
            setTimeout(() => {
                try {
                    let cart = this.getCartFromStorage() || [];
                    cart = cart.filter(item => item.id !== productId);
                    this.saveCartToStorage(cart);
                    
                    deferred.resolve({
                        status: 'success',
                        cart: cart,
                        count: cart.reduce((sum, item) => sum + item.quantity, 0),
                        total: this.calculateTotal(cart),
                        message: 'Товар удален из корзины'
                    });
                } catch (error) {
                    deferred.reject({
                        status: 'error',
                        message: 'Ошибка при удалении товара из корзины'
                    });
                }
            }, 100);
        }).promise();
    }

    // Обновить количество товара
    updateQuantity(productId, quantity) {
        return $.Deferred((deferred) => {
            setTimeout(() => {
                try {
                    let cart = this.getCartFromStorage() || [];
                    const itemIndex = cart.findIndex(item => item.id === productId);

                    if (itemIndex === -1) {
                        deferred.reject({
                            status: 'error',
                            message: 'Товар не найден в корзине'
                        });
                        return;
                    }

                    if (quantity <= 0) {
                        // Если количество <= 0, удаляем товар
                        cart = cart.filter(item => item.id !== productId);
                    } else {
                        cart[itemIndex].quantity = quantity;
                    }

                    this.saveCartToStorage(cart);
                    
                    deferred.resolve({
                        status: 'success',
                        cart: cart,
                        count: cart.reduce((sum, item) => sum + item.quantity, 0),
                        total: this.calculateTotal(cart),
                        message: 'Количество обновлено'
                    });
                } catch (error) {
                    deferred.reject({
                        status: 'error',
                        message: 'Ошибка при обновлении количества'
                    });
                }
            }, 100);
        }).promise();
    }

    // Очистить корзину
    clearCart() {
        return $.Deferred((deferred) => {
            setTimeout(() => {
                try {
                    this.saveCartToStorage([]);
                    deferred.resolve({
                        status: 'success',
                        cart: [],
                        count: 0,
                        total: 0,
                        message: 'Корзина очищена'
                    });
                } catch (error) {
                    deferred.reject({
                        status: 'error',
                        message: 'Ошибка при очистке корзины'
                    });
                }
            }, 100);
        }).promise();
    }

    // Вычислить общую сумму
    calculateTotal(cart) {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Форматировать цену
    formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    // Получить количество товаров в корзине
    getCartCount() {
        const cart = this.getCartFromStorage() || [];
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }
}

// Создаем глобальный экземпляр корзины
if (typeof window !== 'undefined') {
    window.Cart = Cart;
    window.cart = new Cart();
}

// Экспорт для разных систем модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Cart;
}

