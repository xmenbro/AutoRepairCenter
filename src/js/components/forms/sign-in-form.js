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
}

// Инициализация при загрузке документа
$(document).ready(function() {
    window.signInForm = new SignInForm('.auth-form');
});