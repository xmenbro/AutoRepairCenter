/**
 * Модуль для формы входа
 * @class SignInForm
 */
class SignInForm {
    constructor(formSelector) {
        this.$form = $(formSelector);
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
        this.$loginInput.on('input', () => this.validateLogin());
        this.$passwordInput.on('input', () => this.validatePassword());
        
        // Валидация при отправке формы
        this.$form.on('submit', (e) => this.handleSubmit(e));
        
        // Очистка ошибок при фокусе
        this.$loginInput.on('focus', () => this.clearError(this.$loginInput));
        this.$passwordInput.on('focus', () => this.clearError(this.$passwordInput));
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
        const isLoginValid = this.validateLogin();
        const isPasswordValid = this.validatePassword();
        
        return isLoginValid && isPasswordValid;
    }
    
    // Обработка отправки формы
    handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateAll()) {
            return false;
        }
        
        this.submitForm();
    }
    
    // Отправка формы
    submitForm() {
        const formData = {
            login: this.$loginInput.val().trim(),
            password: this.$passwordInput.val().trim(),
            remember: $('#remember').is(':checked')
        };

        // Дополнительная проверка на пустые поля
        if (!formData.login || !formData.password) {
            this.showFormError('Пожалуйста, заполните все поля');
            return;
        }
        
        // Показываем индикатор загрузки
        this.setLoadingState(true);
        
        $.ajax({
            url: 'http://localhost:3000/auth',
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
    
    // Обработка входа
    handleSuccess(response) {
        // Очищаем предыдущие сообщения
        this.$form.find('.form-error').remove();
        this.$form.find('.form-success').remove();
        
        if (response.success) {
            // Успешный вход
            this.showSuccessMessage(response.message || 'Вход выполнен успешно!');
            
            // Сохраняем данные пользователя
            if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
                
                // Сохраняем remember me
                if ($('#remember').is(':checked')) {
                    localStorage.setItem('rememberedLogin', response.user.login);
                } else {
                    localStorage.removeItem('rememberedLogin');
                }
            }
            
            // Редирект через 1 секунду
            setTimeout(() => {
                // Проверяем, есть ли указанный URL для редиректа
                if (response.redirectUrl) {
                    window.location.href = response.redirectUrl;
                } else {
                    // Или используем путь по умолчанию
                    window.location.href = '../../../src/html/index.html';
                }
            }, 1000);
        } else {
            // Сервер вернул ошибку
            this.showFormError(response.message || 'Ошибка при входе. Проверьте логин и пароль.');
            
            // Сбрасываем пароль для безопасности
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
        } else if (xhr.status === 401) {
            errorMessage = 'Неверный логин или пароль';
        } else if (xhr.status === 404) {
            errorMessage = 'Сервер авторизации не найден. Проверьте URL эндпоинта';
        } else if (xhr.status === 500) {
            errorMessage = 'Ошибка на сервере. Попробуйте позже';
        } else if (status === 'timeout') {
            errorMessage = 'Превышено время ожидания ответа от сервера';
        } else if (status === 'parsererror') {
            errorMessage = 'Ошибка обработки ответа сервера';
        }
        
        this.showFormError(errorMessage);
        
        // Сбрасываем пароль для безопасности
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
        
        this.$form.prepend($errorDiv);
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
            $submitBtn.val('Загрузка...');
        } else {
            $submitBtn.prop('disabled', false);
            const originalText = $submitBtn.data('original-text');
            if (originalText) {
                $submitBtn.val(originalText);
            }
        }
    }
}

// Инициализация при загрузке документа
$(document).ready(function() {
    window.signInForm = new SignInForm('.auth-form');
});