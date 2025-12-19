/**
 * Модуль для формы входа
 * @class SignUpForm
 */
class SignUpForm {
    constructor(formSelector) {
        this.$form = $(formSelector);
        this.$mailInput = $('#mail');
        this.$loginInput = $('#login');
        this.$passwordInput = $('#passwd');
        this.validator = window.Validator;

        this.init();
    }

    // Инициализация
    init() {
        this.bindEvents();
    }
    
    // Создание ивентов
    bindEvents() {
        // Валидация при вводе
        this.$mailInput.on('input', () => this.validateMail());
        this.$loginInput.on('input', () => this.validateLogin());
        this.$passwordInput.on('input', () => this.validatePassword());
        
        // Валидация при отправке формы
        this.$form.on('submit', (e) => this.handleSubmit(e));
        
        // Очистка ошибок при фокусе
        this.$mailInput.on('focus', () => this.clearError(this.$mailInput));
        this.$loginInput.on('focus', () => this.clearError(this.$loginInput));
        this.$passwordInput.on('focus', () => this.clearError(this.$passwordInput));
    }

    // Валидация почты
    validateMail() {
        const value = this.$mailInput.val();
        const result = this.validator.validateMail(value);
        
        if (result.isValid) {
            this.clearError(this.$mailInput);
            return true;
        } else {
            this.validator.showFieldErrors(this.$mailInput.parent(), result.errors);
            return false;
        }
    }

    // Валидация логина
    validateLogin() {
        const value = this.$loginInput.val();
        const result = this.validator.validateLogin(value);
        
        if (result.isValid) {
            this.clearError(this.$loginInput);
            return true;
        } else {
            this.validator.showFieldErrors(this.$loginInput.parent(), result.errors);
            return false;
        }
    }
    
    // Валидация пароля
    validatePassword() {
        const value = this.$passwordInput.val();
        const result = this.validator.validatePassword(value);
        
        if (result.isValid) {
            this.clearError(this.$passwordInput);
            return true;
        } else {
            this.validator.showFieldErrors(this.$passwordInput.parent(), result.errors);
            return false;
        }
    }
    
    // Очистить ошибки
    clearError($input) {
        this.validator.removeFieldErrors($input.parent());
    }
    
    // Общая валидация
    validateAll() {
        const isMailValid = this.validateMail();
        const isLoginValid = this.validateLogin();
        const isPasswordValid = this.validatePassword();
        
        return isMailValid && isLoginValid && isPasswordValid;
    }
    
    // Обработка отправки формы
    handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateAll()) {
            return false;
        }

        // Дополнительная проверка полей
        if (!this.$mailInput.val().trim() || !this.$loginInput.val().trim() || !this.$passwordInput.val()) {
            this.showFormError('Все поля обязательны для заполнения');
            return false;
        }
        
        this.submitForm();
    }
    
    // Отправка формы
    submitForm() {
        const formData = {
            email: this.$mailInput.val().trim(), // Основное поле для сервера
            mail: this.$mailInput.val().trim(),  // Дублируем для совместимости
            login: this.$loginInput.val().trim(),
            password: this.$passwordInput.val()
        };
        
        // Проверка подтверждения пароля (если есть такое поле)
        if ($('#confirm-password').length) {
            const password = this.$passwordInput.val();
            const confirmPassword = $('#confirm-password').val();
            
            if (password !== confirmPassword) {
                this.showFormError('Пароли не совпадают');
                return;
            }
        }
        
        // Показываем индикатор загрузки
        this.setLoadingState(true);
        
        $.ajax({
            url: 'http://localhost:3000/register',
            method: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            dataType: 'json',
            timeout: 10000
        })
        .done((response) => {
            this.handleSuccess(response);
        })
        .fail((xhr, status, error) => {
            this.handleError(xhr, status, error);
        })
        .always(() => {
            this.setLoadingState(false);
        });
    }
    
    // Обработка успешной регистрации
    handleSuccess(response) {
        // Очищаем предыдущие сообщения
        this.$form.find('.form-error').remove();
        this.$form.find('.form-success').remove();
        
        if (response.success) {
            // Успешная регистрация
            this.showSuccessMessage(response.message || 'Регистрация выполнена успешно!');
            
            // Сохраняем данные пользователя (включая ID и роль)
            if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
                
                // Обновляем корзину в модуле cart
                if (window.cart) {
                    window.cart.userId = response.user.id;
                }
            }
            
            // Редирект на страницу входа через 1.5 секунды
            setTimeout(() => {
                window.location.href = 'sign-in.html'; // Редирект на страницу входа
            }, 1500);
        } else {
            // Сервер вернул ошибку
            this.showFormError(response.message || 'Ошибка при регистрации. Возможно, такой пользователь уже существует.');
            
            // Очищаем пароль для повторного ввода
            this.$passwordInput.val('');
            this.$passwordInput.focus();
        }
    }
    
    // Обработка ошибок
    handleError(xhr, status, error) {
        let errorMessage = 'Произошла ошибка при отправке данных';
        
        if (xhr.responseJSON && xhr.responseJSON.message) {
            errorMessage = xhr.responseJSON.message;
        } else if (xhr.status === 0) {
            errorMessage = 'Ошибка подключения к серверу. Проверьте:\n1. Запущен ли сервер (localhost:3000)\n2. Разрешает ли браузер CORS запросы';
        } else if (xhr.status === 400) {
            errorMessage = 'Некорректные данные. Проверьте правильность заполнения формы.';
        } else if (xhr.status === 409) {
            errorMessage = 'Пользователь с таким логином или email уже существует';
        } else if (xhr.status === 404) {
            errorMessage = 'Сервер регистрации не найден. Проверьте URL эндпоинта';
        } else if (xhr.status === 500) {
            errorMessage = 'Ошибка на сервере. Попробуйте позже';
        } else if (status === 'timeout') {
            errorMessage = 'Превышено время ожидания ответа от сервера';
        } else if (status === 'parsererror') {
            errorMessage = 'Ошибка обработки ответа сервера';
        }
        
        this.showFormError(errorMessage);
        
        // Очищаем пароль для безопасности
        this.$passwordInput.val('');
    }
    
    // Показать ошибки
    showFormError(message) {
        // Удаляем предыдущие ошибки формы
        this.$form.find('.form-error').remove();
        
        const $errorDiv = $(`
            <div class="form-error">
                <span class="error-message">${message}</span>
            </div>
        `);
        
        // Вставляем перед кнопкой отправки
        this.$form.find('.submit-btn').before($errorDiv);
        
        // Автоматически скрываем через 7 секунд
        setTimeout(() => {
            $errorDiv.fadeOut(300, function() {
                $(this).remove();
            });
        }, 7000);
    }
    
    // Показать сообщения
    showSuccessMessage(message) {
        // Удаляем предыдущие сообщения
        this.$form.find('.form-success').remove();
        
        const $successDiv = $(`
            <div class="form-success">
                <span class="success-message">${message}</span>
            </div>
        `);
        
        this.$form.prepend($successDiv);
    }
    
    // Состояние загрузки
    setLoadingState(isLoading) {
        const $submitBtn = this.$form.find('.submit-btn');
        
        if (isLoading) {
            $submitBtn.prop('disabled', true);
            $submitBtn.data('original-text', $submitBtn.val());
            $submitBtn.val('Регистрация...');
            $submitBtn.css('opacity', '0.7');
            $submitBtn.css('cursor', 'not-allowed');
            
            // Блокируем все поля ввода
            this.$form.find('input').prop('disabled', true);
        } else {
            $submitBtn.prop('disabled', false);
            const originalText = $submitBtn.data('original-text');
            if (originalText) {
                $submitBtn.val(originalText);
            }
            $submitBtn.css('opacity', '1');
            $submitBtn.css('cursor', 'pointer');
            
            // Разблокируем все поля ввода
            this.$form.find('input').prop('disabled', false);
        }
    }
}

// Инициализация при загрузке документа
$(document).ready(function() {
    window.signUpForm = new SignUpForm('.auth-form');
});