/**
 * Страница запчастей с фильтрацией по категориям
 */

// Маппинг товаров к категориям
const PRODUCT_CATEGORIES = {
    1: "Тормозная система",  // Тормозные колодки BOSCH
    2: "Фильтры",            // Масляный фильтр MANN
    3: "Электрооборудование", // Свечи зажигания NGK
    4: "Фильтры",            // Воздушный фильтр MAHLE
    5: "Электрооборудование", // Аккумулятор VARTA
    6: "Подвеска",           // Амортизаторы KAYABA
    7: "Тормозная система",  // Тормозные диски BREMBO
    8: "Фильтры",            // Топливный фильтр BOSCH
    9: "Электрооборудование", // Свечи накаливания DENSO
    10: "Фильтры",           // Салонный фильтр MANN
    11: "Электрооборудование", // Аккумулятор EXIDE
    12: "Подвеска"           // Стойки стабилизатора MONROE
};

// Инициализация страницы запчастей
$(document).ready(function() {
    let productsFetcher = null;
    let allProducts = [];
    let currentCategory = null;

    // Инициализация загрузки товаров
    function initProductsFetcher() {
        // Создаем экземпляр ProductsFetcher
        // Используем задержку, чтобы убедиться, что DOM готов
        setTimeout(() => {
            productsFetcher = new ProductsFetcher({
                containerSelector: '.products-grid',
                apiUrl: '../api/products.json',
                cardsPerView: 4,
                imageBasePath: '../' // корректируем пути картинок для вложенной страницы
            });

            // Сохраняем все товары после загрузки
            // Используем проверку через интервал
            const checkProductsLoaded = setInterval(() => {
                if (productsFetcher && productsFetcher.products && productsFetcher.products.length > 0) {
                    allProducts = [...productsFetcher.products]; // Копируем массив
                    clearInterval(checkProductsLoaded);
                    console.log('Товары загружены:', allProducts.length);
                }
            }, 100);

            // Останавливаем проверку через 5 секунд
            setTimeout(() => {
                clearInterval(checkProductsLoaded);
            }, 5000);
        }, 100);
    }

    // Фильтрация товаров по категории
    function filterProductsByCategory(category) {
        // Если товары еще не загружены, используем товары из productsFetcher
        if (!allProducts || allProducts.length === 0) {
            if (productsFetcher && productsFetcher.products && productsFetcher.products.length > 0) {
                allProducts = [...productsFetcher.products];
            } else {
                // Если товары еще не загружены, ждем
                setTimeout(() => {
                    filterProductsByCategory(category);
                }, 500);
                return;
            }
        }

        const filteredProducts = allProducts.filter(product => {
            return PRODUCT_CATEGORIES[product.id] === category;
        });

        // Обновляем товары в productsFetcher
        if (productsFetcher) {
            productsFetcher.products = filteredProducts;
            productsFetcher.renderProducts();
            productsFetcher.currentIndex = 0;
            
            // Обновляем количество видимых карточек
            productsFetcher.updateCardsPerView();
            
            // Небольшая задержка для правильного расчета размеров
            setTimeout(() => {
                productsFetcher.updateCarousel();
            }, 100);
        }

        // Обновляем заголовок
        $('#category-products-title').text(`Товары категории: ${category}`);

        // Показываем секцию с товарами и скрываем категории
        $('.categories-grid').hide();
        $('#products-section').show();

        // Прокручиваем к секции товаров
        setTimeout(() => {
            $('html, body').animate({
                scrollTop: $('#products-section').offset().top - 100
            }, 500);
        }, 200);
    }

    // Возврат к категориям
    function showCategories() {
        $('#products-section').hide();
        $('.categories-grid').show();
        currentCategory = null;

        // Восстанавливаем все товары
        if (productsFetcher) {
            if (allProducts.length > 0) {
                productsFetcher.products = [...allProducts];
            } else if (productsFetcher.products && productsFetcher.products.length > 0) {
                // Если allProducts пуст, но есть товары в productsFetcher
                allProducts = [...productsFetcher.products];
            }
            
            if (productsFetcher.products && productsFetcher.products.length > 0) {
                productsFetcher.renderProducts();
                productsFetcher.currentIndex = 0;
                productsFetcher.updateCardsPerView();
                
                setTimeout(() => {
                    productsFetcher.updateCarousel();
                }, 100);
            }
        }

        // Прокручиваем к категориям
        setTimeout(() => {
            $('html, body').animate({
                scrollTop: $('.categories-grid').offset().top - 100
            }, 500);
        }, 100);
    }

    // Обработчик клика на кнопку "Подробнее"
    $(document).on('click', '.category-btn', function(e) {
        e.preventDefault();
        const category = $(this).data('category');
        if (category) {
            currentCategory = category;
            filterProductsByCategory(category);
        }
    });

    // Обработчик возврата к категориям
    $('#back-to-categories').on('click', function(e) {
        e.preventDefault();
        showCategories();
    });

    // Инициализация
    initProductsFetcher();
});
