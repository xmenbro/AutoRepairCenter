$(document).ready(function() {
    // Функция для форматирования цены (добавляет пробелы между тысячами)
    function formatPrice(price) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    
    // Функция для определения класса доступности и текста кнопки
    function getAvailabilityData(availability) {
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

    // Загрузка товаров через AJAX
    $.ajax({
        url: '../api/products.json',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            if (data.status === 'success') {
                const products = data.products;
                const productsGrid = $('.products-grid');
                
                // Очищаем контейнер перед добавлением новых карточек
                productsGrid.empty();
                
                // Создаем карточки для каждого товара
                products.forEach(function(product) {
                    const availabilityData = getAvailabilityData(product.availability);
                    
                    const productCard = `
                        <div class="product-card" data-id="${product.id}">
                            <div class="product-image">
                                <img src="${product.image}" alt="${product.title}">
                            </div>
                            <h3 class="product-title">${product.title}</h3>
                            <div class="product-brand">${product.brand}</div>
                            <div class="product-price">${formatPrice(product.price)} руб.</div>
                            <div class="product-availability ${availabilityData.class}">
                                <div class="availability-dot"></div>
                                ${product.availability}
                            </div>
                            <button class="${availabilityData.buttonClass}">${availabilityData.buttonText}</button>
                        </div>
                    `;
                    
                    productsGrid.append(productCard);
                });
                
                // Добавляем обработчики событий для кнопок "В корзину"/"Уведомить"
                addButtonHandlers();
                
            } else {
                console.error('Ошибка при загрузке товаров:', data.message);
                showErrorMessage('Не удалось загрузить товары');
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('Ошибка AJAX:', textStatus, errorThrown);
            showErrorMessage('Ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
        }
    });
    
    // Функция для добавления обработчиков на кнопки товаров
    function addButtonHandlers() {
        $('.product-btn').on('click', function() {
            const productCard = $(this).closest('.product-card');
            const productId = productCard.data('id');
            const productTitle = productCard.find('.product-title').text();
            const buttonText = $(this).text();
            
            if (buttonText === "В корзину") {
                addToCart(productId, productTitle);
                $(this).text('Добавлено').prop('disabled', true);
                
                // Возвращаем исходный текст через 2 секунды
                setTimeout(() => {
                    $(this).text('В корзину').prop('disabled', false);
                }, 2000);
            } else if (buttonText === "Уведомить") {
                notifyWhenAvailable(productId, productTitle);
                $(this).text('Запрос отправлен').prop('disabled', true);
            }
        });
    }
    
    // Функция для показа сообщения об ошибке
    function showErrorMessage(message) {
        const errorHtml = `
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
                <button onclick="location.reload()" style="
                    margin-top: 10px;
                    padding: 8px 16px;
                    background-color: #f44336;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Повторить попытку</button>
            </div>
        `;
        
        $('.products-grid').html(errorHtml);
    }
    
    // Функция добавления в корзину (заглушка)
    function addToCart(productId, productTitle) {
        console.log(`Товар добавлен в корзину: ID=${productId}, Название=${productTitle}`);
        // Здесь можно добавить логику для реального добавления в корзину
        // Например: $.post('/api/cart/add', {productId: productId})
    }
    
    // Функция уведомления о поступлении (заглушка)
    function notifyWhenAvailable(productId, productTitle) {
        console.log(`Запрос на уведомление: ID=${productId}, Название=${productTitle}`);
        // Здесь можно добавить логику для отправки запроса на уведомление
        // Например: $.post('/api/notify', {productId: productId, email: userEmail})
    }
});
