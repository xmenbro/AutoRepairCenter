/**
 * Модуль для управления навигацией и отображения информации о пользователе
 * @class Navigation
 */
class Navigation {
    constructor() {
        this.init();
    }

    // Инициализация
    init() {
        // Обновляем навигацию при загрузке страницы
        $(document).ready(() => {
            // Проверяем, есть ли на странице навигация
            if ($('.nav-menu').length) {
                // Закрываем все выпадающие меню перед обновлением
                $('.user-dropdown-menu').removeClass('active');
                $('.dropdown-arrow').css('transform', 'rotate(0deg)');
                
                this.updateNavigation();
                
                // Дополнительно закрываем меню после небольшой задержки
                setTimeout(() => {
                    $('.user-dropdown-menu').removeClass('active');
                    $('.dropdown-arrow').css('transform', 'rotate(0deg)');
                }, 100);
            }
        });
        
        // Обновляем навигацию при изменении localStorage
        $(window).on('storage', () => {
            this.updateNavigation();
        });
        
        // Также обновляем при программном изменении localStorage (для текущей вкладки)
        const originalSetItem = localStorage.setItem;
        const self = this;
        localStorage.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            if (key === 'user') {
                setTimeout(() => {
                    self.updateNavigation();
                }, 100);
            }
        };
    }

    // Обновление навигации
    updateNavigation() {
        const userData = localStorage.getItem('user');
        const $navMenu = $('.nav-menu');
        
        // Удаляем старые элементы пользователя
        $('.user-profile-dropdown').remove();
        $('.user-info').parent().remove();
        $('.logout-btn').parent().remove();
        
        // Закрываем все открытые выпадающие меню
        $('.user-dropdown-menu').each(function() {
            $(this).removeClass('active');
            $(this).css({
                'opacity': '0',
                'visibility': 'hidden',
                'pointer-events': 'none'
            });
        });
        $('.dropdown-arrow').css('transform', 'rotate(0deg)');
        
        // Находим элементы навигации
        const $basketLink = $navMenu.find('a[href*="basket"]').parent();
        const $searchLink = $navMenu.find('a[href*="search"]').parent();
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                
                // Создаем элемент пользователя с выпадающим меню (БЕЗ класса active)
                const userInfoItem = $(`
                    <li class="menu-item user-profile-dropdown">
                        <div class="user-profile-trigger">
                            <span class="user-role ${user.role === 'admin' ? 'admin-badge' : ''}">
                                ${user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                            </span>
                            <span class="user-name">${user.login}</span>
                            <span class="dropdown-arrow">▼</span>
                        </div>
                        <ul class="user-dropdown-menu">
                            <li class="dropdown-item">
                                <span class="dropdown-item-label">Пользователь:</span>
                                <span class="dropdown-item-value">${user.login}</span>
                            </li>
                            <li class="dropdown-item">
                                <span class="dropdown-item-label">Роль:</span>
                                <span class="dropdown-item-value">${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</span>
                            </li>
                            <li class="dropdown-divider"></li>
                            <li class="dropdown-item">
                                <a href="#" class="logout-btn">Выйти</a>
                            </li>
                        </ul>
                    </li>
                `);
                
                // Убеждаемся, что меню закрыто при создании
                const $dropdownMenu = userInfoItem.find('.user-dropdown-menu');
                $dropdownMenu.removeClass('active');
                // Принудительно применяем стили для скрытия
                $dropdownMenu.css({
                    'opacity': '0',
                    'visibility': 'hidden',
                    'pointer-events': 'none'
                });
                
                // Вставляем ПЕРЕД корзиной (профиль должен быть перед корзиной)
                // Находим позицию корзины и вставляем профиль перед ней
                if ($basketLink.length) {
                    $basketLink.before(userInfoItem);
                } else if ($searchLink.length) {
                    // Если корзины нет, вставляем перед поиском
                    $searchLink.before(userInfoItem);
                } else {
                    // Если нет ни корзины, ни поиска, вставляем перед последним элементом
                    const $lastItem = $navMenu.children().last();
                    $lastItem.before(userInfoItem);
                }
                
                // Удаляем ссылку "Войти" если есть
                $navMenu.find('a[href*="sign-in"]').parent().remove();
                
                // Убеждаемся, что меню закрыто после вставки
                setTimeout(() => {
                    const $menu = userInfoItem.find('.user-dropdown-menu');
                    $menu.removeClass('active');
                    $menu.css({
                        'opacity': '0',
                        'visibility': 'hidden',
                        'pointer-events': 'none'
                    });
                    userInfoItem.find('.dropdown-arrow').css('transform', 'rotate(0deg)');
                }, 10);
                
                // Обработчики для выпадающего меню
                this.setupDropdownMenu();
                
            } catch (error) {
                console.error('Ошибка при чтении данных пользователя:', error);
            }
        } else {
            // Если пользователь не авторизован, показываем ссылку "Войти"
            const $existingSignIn = $navMenu.find('a[href*="sign-in"]').parent();
            if (!$existingSignIn.length) {
                // Определяем правильный путь в зависимости от текущей страницы
                const isInPages = window.location.pathname.includes('/pages/');
                const signInPath = isInPages ? 'sign-in.html' : 'pages/sign-in.html';
                const signInItem = $(`
                    <li class="menu-item"><a href="${signInPath}">Войти</a></li>
                `);
                // Вставляем перед корзиной или в конец меню
                if ($basketLink.length) {
                    $basketLink.before(signInItem);
                } else {
                    $navMenu.append(signInItem);
                }
            }
        }
    }

    // Настройка выпадающего меню
    setupDropdownMenu() {
        const self = this;
        
        // Обработчик клика на триггер профиля
        $(document).off('click', '.user-profile-trigger').on('click', '.user-profile-trigger', function(e) {
            e.stopPropagation();
            const $trigger = $(this);
            const $dropdown = $trigger.siblings('.user-dropdown-menu');
            const $arrow = $trigger.find('.dropdown-arrow');
            const $allDropdowns = $('.user-dropdown-menu');
            
            // Закрываем все другие выпадающие меню
            $allDropdowns.not($dropdown).each(function() {
                $(this).removeClass('active');
                $(this).css({
                    'opacity': '0',
                    'visibility': 'hidden',
                    'pointer-events': 'none'
                });
            });
            $('.dropdown-arrow').not($arrow).css('transform', 'rotate(0deg)');
            
            // Переключаем текущее меню
            const isActive = $dropdown.hasClass('active');
            $dropdown.toggleClass('active');
            
            // Поворачиваем стрелку и управляем видимостью меню
            if ($dropdown.hasClass('active')) {
                $arrow.css('transform', 'rotate(180deg)');
                $dropdown.css({
                    'opacity': '1',
                    'visibility': 'visible',
                    'pointer-events': 'auto'
                });
            } else {
                $arrow.css('transform', 'rotate(0deg)');
                $dropdown.css({
                    'opacity': '0',
                    'visibility': 'hidden',
                    'pointer-events': 'none'
                });
            }
        });
        
        // Обработчик клика на кнопку выхода
        $(document).off('click', '.logout-btn').on('click', '.logout-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            self.logout();
        });
        
        // Закрытие меню при клике вне его
        $(document).off('click', '.user-dropdown-menu').on('click', function(e) {
            e.stopPropagation();
        });
        
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.user-profile-dropdown').length) {
                $('.user-dropdown-menu').each(function() {
                    $(this).removeClass('active');
                    $(this).css({
                        'opacity': '0',
                        'visibility': 'hidden',
                        'pointer-events': 'none'
                    });
                });
                $('.dropdown-arrow').css('transform', 'rotate(0deg)');
            }
        });
    }

    // Выход из системы
    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            // Очищаем данные пользователя
            localStorage.removeItem('user');
            
            // Обновляем корзину
            if (window.cart) {
                window.cart.userId = null;
            }
            
            // Обновляем навигацию
            this.updateNavigation();
            
            // Перезагружаем страницу
            window.location.reload();
        }
    }
}

// Инициализация при загрузке документа
$(document).ready(function() {
    window.navigation = new Navigation();
});

// Экспорт для разных систем модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Navigation;
}
if (typeof window !== 'undefined') {
    window.Navigation = Navigation;
}
