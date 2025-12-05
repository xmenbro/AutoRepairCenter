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
        this.$loginInput.on('focus', () => this.clearError(this.$mailInput));
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
        
        this.submitForm();
    }
    
    // Отправка формы
    submitForm() {
        const formData = {
            mail: this.$mailInput.val(),
            login: this.$loginInput.val(),
            password: this.$passwordInput.val(),
        };
        
        // Показываем индикатор загрузки
        this.setLoadingState(true);
        
        $.ajax({
            url: '',
            method: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            dataType: 'json'
        })
        .done((response) => {
            this.handleSuccess(response);
        })
        .fail((xhr) => {
            this.handleError(xhr);
        })
        .always(() => {
            this.setLoadingState(false);
        });
    }
    
    // Обработка входа
    handleSuccess(response) {
        if (response.success) {
            // Успешный вход
            this.showSuccessMessage('Вход выполнен успешно!');
            
            // Редирект или обновление страницы
            setTimeout(() => {
                window.location.href = '../../../html/index.html';
            }, 1000);
        } else {
            // Сервер вернул ошибку
            this.showFormError(response.message || 'Ошибка при входе');
        }
    }
    
    // Обработка ошибок
    handleError(xhr) {
        let errorMessage = 'Произошла ошибка при отправке данных';
        
        if (xhr.responseJSON && xhr.responseJSON.message) {
            errorMessage = xhr.responseJSON.message;
        } else if (xhr.status === 401) {
            errorMessage = 'Неверный логин или пароль';
        } else if (xhr.status === 0) {
            errorMessage = 'Проверьте подключение к интернету';
        }
        
        this.showFormError(errorMessage);
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
    window.signUpForm = new SignUpForm('.auth-form');
});