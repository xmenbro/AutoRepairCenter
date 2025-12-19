/**
 * Модуль для управления товарами (только для администратора)
 * @class ProductsManager
 */
class ProductsManager {
    constructor() {
        this.userId = null;
        this.userRole = null;
        this.init();
    }

    // Инициализация
    init() {
        // Проверяем, авторизован ли пользователь и является ли он администратором
        this.checkUserRole();
        
        // Если пользователь администратор, инициализируем функционал
        if (this.userRole === 'admin') {
            // Небольшая задержка для загрузки DOM
            setTimeout(() => {
                this.setupAdminFeatures();
            }, 100);
        }
        
        // Слушаем изменения в localStorage для обновления при входе/выходе
        $(window).on('storage', () => {
            this.checkUserRole();
            if (this.userRole === 'admin') {
                this.setupAdminFeatures();
            } else {
                this.removeAdminFeatures();
            }
        });
    }
    
    // Проверка роли пользователя
    checkUserRole() {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                this.userId = user.id;
                this.userRole = user.role;
            } catch (error) {
                console.error('Ошибка при чтении данных пользователя:', error);
                this.userId = null;
                this.userRole = null;
            }
        } else {
            this.userId = null;
            this.userRole = null;
        }
    }
    
    // Удаление элементов администратора
    removeAdminFeatures() {
        $('.admin-controls').remove();
        $('.admin-delete-btn').remove();
    }

    // Настройка функций администратора
    setupAdminFeatures() {
        // Добавляем кнопки управления товарами на странице товаров
        this.addAdminControls();
        
        // Обработчики событий
        this.setupEventHandlers();
    }

    // Добавление элементов управления для администратора
    addAdminControls() {
        // Удаляем старые элементы если есть
        $('.admin-controls').remove();
        
        // Добавляем кнопку "Добавить товар" на странице товаров
        const $productsGrid = $('.products-grid, .carousel-container');
        if ($productsGrid.length && !$('.admin-controls').length) {
            const adminControls = $(`
                <div class="admin-controls">
                    <button class="admin-btn add-product-btn">Добавить товар</button>
                </div>
            `);
            
            // Вставляем перед контейнером товаров или перед заголовком
            const $sectionTitle = $('.section-title, .page-title').first();
            if ($sectionTitle.length) {
                $sectionTitle.after(adminControls);
            } else {
                $productsGrid.before(adminControls);
            }
        }

        // Добавляем кнопки удаления на существующие карточки товаров
        this.addDeleteButtonsToCards();
        
        // Наблюдаем за добавлением новых карточек через MutationObserver
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const $node = $(node);
                        if ($node.hasClass('product-card')) {
                            this.addDeleteButtonToCard($node);
                        }
                        // Проверяем вложенные элементы
                        $node.find('.product-card').each((index, card) => {
                            this.addDeleteButtonToCard($(card));
                        });
                    }
                });
            });
        });

        // Наблюдаем за изменениями в контейнере товаров
        const productsContainer = document.querySelector('.products-grid, .carousel-cards, .carousel-wrapper');
        if (productsContainer) {
            observer.observe(productsContainer, {
                childList: true,
                subtree: true
            });
        }
        
        // Также проверяем периодически (на случай если MutationObserver не сработал)
        setInterval(() => {
            this.addDeleteButtonsToCards();
        }, 2000);
    }

    // Добавить кнопки удаления на все карточки
    addDeleteButtonsToCards() {
        $('.product-card').each((index, card) => {
            this.addDeleteButtonToCard($(card));
        });
    }

    // Добавить кнопку удаления на одну карточку
    addDeleteButtonToCard($card) {
        if (!$card.find('.admin-delete-btn').length) {
            const productId = $card.data('id');
            if (productId) {
                const deleteBtn = $(`
                    <button class="admin-delete-btn" data-product-id="${productId}" title="Удалить товар">
                        ×
                    </button>
                `);
                $card.append(deleteBtn);
            }
        }
    }

    // Настройка обработчиков событий
    setupEventHandlers() {
        const self = this;

        // Обработчик добавления товара
        $(document).on('click', '.add-product-btn', function(e) {
            e.preventDefault();
            self.showAddProductModal();
        });

        // Обработчик удаления товара
        $(document).on('click', '.admin-delete-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const productId = $(this).data('product-id');
            self.deleteProduct(productId);
        });
    }

    // Показать модальное окно добавления товара
    showAddProductModal() {
        // Удаляем предыдущее модальное окно если есть
        $('.admin-modal').remove();

        const modal = $(`
            <div class="admin-modal">
                <div class="admin-modal-content">
                    <span class="admin-modal-close">&times;</span>
                    <h2>Добавить товар</h2>
                    <form class="admin-product-form">
                        <div class="form-group">
                            <label>Название товара *</label>
                            <input type="text" name="title" required>
                        </div>
                        <div class="form-group">
                            <label>Бренд</label>
                            <input type="text" name="brand" value="Unknown">
                        </div>
                        <div class="form-group">
                            <label>Цена (руб.) *</label>
                            <input type="number" name="price" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>Изображение (файл)</label>
                            <input type="file" name="imageFile" accept="image/*">
                            <div class="image-preview-wrapper" style="margin-top:8px;">
                                <img class="image-preview" src="../images/cards/default.webp" alt="preview" style="max-width:120px;max-height:80px;display:block;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Наличие</label>
                            <select name="availability">
                                <option value="В наличии">В наличии</option>
                                <option value="Ожидается">Ожидается</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="admin-btn admin-btn-primary">Добавить</button>
                            <button type="button" class="admin-btn admin-btn-cancel">Отмена</button>
                        </div>
                    </form>
                </div>
            </div>
        `);

        $('body').append(modal);
        modal.css('display', 'flex').hide().fadeIn(300);

        // Обработчики закрытия модального окна
        const closeModal = () => {
            modal.fadeOut(300, function() {
                $(this).remove();
            });
        };
        
        modal.find('.admin-modal-close, .admin-btn-cancel').on('click', closeModal);
        
        // Закрытие при клике вне модального окна
        modal.on('click', function(e) {
            if ($(e.target).hasClass('admin-modal')) {
                closeModal();
            }
        });

        // Обработчики превью и отправки формы
        const $fileInput = modal.find('[name="imageFile"]');
        const $previewImg = modal.find('.image-preview');

        $fileInput.on('change', function() {
            const file = this.files && this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    $previewImg.attr('src', ev.target.result).data('dataurl', ev.target.result);
                };
                reader.readAsDataURL(file);
            } else {
                // Если файл не выбран — показываем дефолтную картинку
                $previewImg.attr('src', '../images/cards/default.webp').removeData('dataurl');
            }
        });

        modal.find('.admin-product-form').on('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleAddProduct(modal);
        });
        
        // Фокус на первое поле
        setTimeout(() => {
            modal.find('input[name="title"]').focus();
        }, 350);
    }

    // Обработка добавления товара
    handleAddProduct(modal) {
        const self = this;
        const formData = {
            title: modal.find('[name="title"]').val().trim(),
            brand: modal.find('[name="brand"]').val().trim() || 'Unknown',
            price: parseInt(modal.find('[name="price"]').val()) || 0,
            // image will be set below (either from selected file or from path input)
            image: '',
            availability: modal.find('[name="availability"]').val() || 'В наличии'
        };

        // Валидация
        if (!formData.title || !formData.price || formData.price <= 0) {
            this.showNotification('Заполните все обязательные поля корректно', 'error');
            return;
        }

        // Показываем индикатор загрузки
        const $submitBtn = modal.find('button[type="submit"]');
        const originalText = $submitBtn.text();
        $submitBtn.prop('disabled', true).text('Добавление...');

        // helper to send AJAX once image is ready
        const sendAddRequest = () => {
            $.ajax({
                url: 'http://localhost:3000/products/add',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                    userId: this.userId,
                    product: formData
                }),
                dataType: 'json'
            })
            .done((response) => {
                $submitBtn.prop('disabled', false).text(originalText);
                
                if (response.success) {
                    this.showNotification('Товар успешно добавлен', 'success');
                    modal.fadeOut(300, function() {
                        $(this).remove();
                    });
                    
                    // Обновляем список товаров
                    if (window.productsFetcher) {
                        window.productsFetcher.refresh();
                        // Добавляем кнопки удаления после обновления
                        setTimeout(() => {
                            self.addDeleteButtonsToCards();
                        }, 1000);
                    } else {
                        // Перезагружаем страницу если productsFetcher недоступен
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    }
                } else {
                    this.showNotification(response.message || 'Ошибка при добавлении товара', 'error');
                }
            })
            .fail((error) => {
                $submitBtn.prop('disabled', false).text(originalText);
                console.error('Ошибка при добавлении товара:', error);
                let errorMsg = 'Ошибка при добавлении товара';
                if (error.status === 403) {
                    errorMsg = 'Доступ запрещен. Требуются права администратора';
                } else if (error.status === 401) {
                    errorMsg = 'Требуется авторизация';
                }
                this.showNotification(errorMsg, 'error');
            });
        };

        // Если выбран файл — читаем его как data URL и затем отправляем
        const fileInput = modal.find('[name="imageFile"]')[0];
        const file = fileInput && fileInput.files && fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                formData.image = ev.target.result; // data:<mime>;base64,...
                sendAddRequest();
            };
            reader.onerror = (err) => {
                console.error('Ошибка чтения файла изображения:', err);
                $submitBtn.prop('disabled', false).text(originalText);
                this.showNotification('Не удалось прочитать файл изображения', 'error');
            };
            reader.readAsDataURL(file);
        } else {
            // иначе используем дефолтную картинку
            formData.image = '../images/cards/default.webp';
            sendAddRequest();
        }
    }

    // Удаление товара
    deleteProduct(productId) {
        const self = this;
        
        if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
            return;
        }

        const $card = $(`.product-card[data-id="${productId}"]`);
        $card.css('opacity', '0.5');

        $.ajax({
            url: 'http://localhost:3000/products/delete',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                userId: this.userId,
                productId: productId
            }),
            dataType: 'json'
        })
        .done((response) => {
            if (response.success) {
                this.showNotification('Товар успешно удален', 'success');
                
                // Удаляем карточку товара из DOM
                $card.fadeOut(300, function() {
                    $(this).remove();
                    
                    // Обновляем карусель если нужно
                    if (window.productsFetcher) {
                        window.productsFetcher.updateCarousel();
                    }
                    
                    // Перезагружаем страницу если товаров не осталось
                    if ($('.product-card').length === 0) {
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    }
                });
            } else {
                $card.css('opacity', '1');
                this.showNotification(response.message || 'Ошибка при удалении товара', 'error');
            }
        })
        .fail((error) => {
            $card.css('opacity', '1');
            console.error('Ошибка при удалении товара:', error);
            let errorMsg = 'Ошибка при удалении товара';
            if (error.status === 403) {
                errorMsg = 'Доступ запрещен. Требуются права администратора';
            } else if (error.status === 401) {
                errorMsg = 'Требуется авторизация';
            }
            this.showNotification(errorMsg, 'error');
        });
    }

    // Показать уведомление
    showNotification(message, type = 'success') {
        // Удаляем предыдущее уведомление если есть
        $('.admin-notification').remove();

        const bgColor = type === 'success' ? '#27ae60' : '#e74c3c';
        const notification = $(`
            <div class="admin-notification" style="
                position: fixed;
                top: 100px;
                right: 20px;
                background-color: ${bgColor};
                color: white;
                padding: 15px 20px;
                border-radius: 4px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                z-index: 10001;
            ">
                ${message}
            </div>
        `);

        $('body').append(notification);

        setTimeout(() => {
            notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }
}

// Инициализация при загрузке документа
$(document).ready(function() {
    window.productsManager = new ProductsManager();
});

// Экспорт для разных систем модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductsManager;
}
if (typeof window !== 'undefined') {
    window.ProductsManager = ProductsManager;
}
