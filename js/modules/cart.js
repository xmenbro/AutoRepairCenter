/**
 * Модуль для управления корзиной товаров
 * Использует сервер для хранения корзины пользователя
 * @class Cart
 */
class Cart {
    constructor() {
        this.storageKey = 'autoRepairCart';
        this.userId = null;
        this.init();
    }

    // Инициализация
    init() {
        // Получаем информацию о текущем пользователе
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                this.userId = user.id;
            } catch (error) {
                console.error('Ошибка при чтении данных пользователя:', error);
            }
        }
        
        // Инициализация корзины в localStorage если пользователь не авторизован
        if (!this.userId && !this.getCartFromStorage()) {
            this.saveCartToStorage([]);
        }
    }

    // Получить ID пользователя
    getUserId() {
        if (!this.userId) {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    this.userId = user.id;
                } catch (error) {
                    console.error('Ошибка при чтении данных пользователя:', error);
                }
            }
        }
        return this.userId;
    }

    // Получить корзину из localStorage (для неавторизованных пользователей)
    getCartFromStorage() {
        try {
            const cartData = localStorage.getItem(this.storageKey);
            return cartData ? JSON.parse(cartData) : null;
        } catch (error) {
            console.error('Ошибка при чтении корзины из localStorage:', error);
            return null;
        }
    }

    // Сохранить корзину в localStorage (для неавторизованных пользователей)
    saveCartToStorage(cart) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(cart));
        } catch (error) {
            console.error('Ошибка при сохранении корзины в localStorage:', error);
        }
    }

    // Сохранить корзину на сервере
    saveCartToServer(cart) {
        const userId = this.getUserId();
        if (!userId) {
            return $.Deferred().reject({ message: 'Пользователь не авторизован' }).promise();
        }

        return $.ajax({
            url: 'http://localhost:3000/cart/save',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                userId: userId,
                cart: cart
            }),
            dataType: 'json'
        });
    }

    // Получить корзину
    getCart() {
        const userId = this.getUserId();
        
        // Если пользователь авторизован, загружаем корзину с сервера
        if (userId) {
            return $.ajax({
                url: 'http://localhost:3000/cart',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ userId: userId }),
                dataType: 'json'
            }).fail((error) => {
                console.error('Ошибка при загрузке корзины с сервера:', error);
                // В случае ошибки возвращаем локальную корзину
                const cart = this.getCartFromStorage() || [];
                return $.Deferred().resolve({
                    status: 'success',
                    cart: cart,
                    count: cart.reduce((sum, item) => sum + item.quantity, 0),
                    total: this.calculateTotal(cart)
                }).promise();
            });
        }
        
        // Для неавторизованных пользователей используем localStorage
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
        const userId = this.getUserId();
        
        return $.Deferred((deferred) => {
            setTimeout(() => {
                try {
                    let cart = userId ? [] : (this.getCartFromStorage() || []);
                    
                    // Если пользователь авторизован, загружаем корзину с сервера
                    if (userId) {
                        $.ajax({
                            url: 'http://localhost:3000/cart',
                            method: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({ userId: userId }),
                            dataType: 'json',
                            async: false
                        }).done((response) => {
                            if (response.status === 'success') {
                                cart = response.cart || [];
                            }
                        });
                    }
                    
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

                    // Сохраняем корзину
                    if (userId) {
                        // Сохраняем на сервере
                        this.saveCartToServer(cart).done(() => {
                            deferred.resolve({
                                status: 'success',
                                cart: cart,
                                count: cart.reduce((sum, item) => sum + item.quantity, 0),
                                total: this.calculateTotal(cart),
                                message: 'Товар добавлен в корзину'
                            });
                        }).fail(() => {
                            // В случае ошибки сохраняем локально
                            this.saveCartToStorage(cart);
                            deferred.resolve({
                                status: 'success',
                                cart: cart,
                                count: cart.reduce((sum, item) => sum + item.quantity, 0),
                                total: this.calculateTotal(cart),
                                message: 'Товар добавлен в корзину'
                            });
                        });
                    } else {
                        // Сохраняем локально
                        this.saveCartToStorage(cart);
                        deferred.resolve({
                            status: 'success',
                            cart: cart,
                            count: cart.reduce((sum, item) => sum + item.quantity, 0),
                            total: this.calculateTotal(cart),
                            message: 'Товар добавлен в корзину'
                        });
                    }
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
        const userId = this.getUserId();
        
        return $.Deferred((deferred) => {
            setTimeout(() => {
                try {
                    let cart = userId ? [] : (this.getCartFromStorage() || []);
                    
                    // Если пользователь авторизован, загружаем корзину с сервера
                    if (userId) {
                        $.ajax({
                            url: 'http://localhost:3000/cart',
                            method: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({ userId: userId }),
                            dataType: 'json',
                            async: false
                        }).done((response) => {
                            if (response.status === 'success') {
                                cart = response.cart || [];
                            }
                        });
                    }
                    
                    cart = cart.filter(item => item.id !== productId);
                    
                    // Сохраняем корзину
                    if (userId) {
                        // Сохраняем на сервере
                        this.saveCartToServer(cart).done(() => {
                            deferred.resolve({
                                status: 'success',
                                cart: cart,
                                count: cart.reduce((sum, item) => sum + item.quantity, 0),
                                total: this.calculateTotal(cart),
                                message: 'Товар удален из корзины'
                            });
                        }).fail(() => {
                            // В случае ошибки сохраняем локально
                            this.saveCartToStorage(cart);
                            deferred.resolve({
                                status: 'success',
                                cart: cart,
                                count: cart.reduce((sum, item) => sum + item.quantity, 0),
                                total: this.calculateTotal(cart),
                                message: 'Товар удален из корзины'
                            });
                        });
                    } else {
                        // Сохраняем локально
                        this.saveCartToStorage(cart);
                        deferred.resolve({
                            status: 'success',
                            cart: cart,
                            count: cart.reduce((sum, item) => sum + item.quantity, 0),
                            total: this.calculateTotal(cart),
                            message: 'Товар удален из корзины'
                        });
                    }
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
        const userId = this.getUserId();
        
        return $.Deferred((deferred) => {
            setTimeout(() => {
                try {
                    let cart = userId ? [] : (this.getCartFromStorage() || []);
                    
                    // Если пользователь авторизован, загружаем корзину с сервера
                    if (userId) {
                        $.ajax({
                            url: 'http://localhost:3000/cart',
                            method: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({ userId: userId }),
                            dataType: 'json',
                            async: false
                        }).done((response) => {
                            if (response.status === 'success') {
                                cart = response.cart || [];
                            }
                        });
                    }
                    
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

                    // Сохраняем корзину
                    if (userId) {
                        // Сохраняем на сервере
                        this.saveCartToServer(cart).done(() => {
                            deferred.resolve({
                                status: 'success',
                                cart: cart,
                                count: cart.reduce((sum, item) => sum + item.quantity, 0),
                                total: this.calculateTotal(cart),
                                message: 'Количество обновлено'
                            });
                        }).fail(() => {
                            // В случае ошибки сохраняем локально
                            this.saveCartToStorage(cart);
                            deferred.resolve({
                                status: 'success',
                                cart: cart,
                                count: cart.reduce((sum, item) => sum + item.quantity, 0),
                                total: this.calculateTotal(cart),
                                message: 'Количество обновлено'
                            });
                        });
                    } else {
                        // Сохраняем локально
                        this.saveCartToStorage(cart);
                        deferred.resolve({
                            status: 'success',
                            cart: cart,
                            count: cart.reduce((sum, item) => sum + item.quantity, 0),
                            total: this.calculateTotal(cart),
                            message: 'Количество обновлено'
                        });
                    }
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
        const userId = this.getUserId();
        const emptyCart = [];
        
        return $.Deferred((deferred) => {
            setTimeout(() => {
                try {
                    if (userId) {
                        // Сохраняем на сервере
                        this.saveCartToServer(emptyCart).done(() => {
                            deferred.resolve({
                                status: 'success',
                                cart: [],
                                count: 0,
                                total: 0,
                                message: 'Корзина очищена'
                            });
                        }).fail(() => {
                            // В случае ошибки сохраняем локально
                            this.saveCartToStorage(emptyCart);
                            deferred.resolve({
                                status: 'success',
                                cart: [],
                                count: 0,
                                total: 0,
                                message: 'Корзина очищена'
                            });
                        });
                    } else {
                        // Сохраняем локально
                        this.saveCartToStorage(emptyCart);
                        deferred.resolve({
                            status: 'success',
                            cart: [],
                            count: 0,
                            total: 0,
                            message: 'Корзина очищена'
                        });
                    }
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
        const userId = this.getUserId();
        
        if (userId) {
            // Для авторизованных пользователей используем синхронный запрос
            let cart = [];
            $.ajax({
                url: 'http://localhost:3000/cart',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ userId: userId }),
                dataType: 'json',
                async: false
            }).done((response) => {
                if (response.status === 'success') {
                    cart = response.cart || [];
                }
            });
            return cart.reduce((sum, item) => sum + item.quantity, 0);
        }
        
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

