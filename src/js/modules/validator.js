/**
 * Класс валидации форм
 * @class Validator
 */
class Validator {
    constructor() {
        this.validationRules = {
            required: (value) => value && value.trim().length > 0,
            minLength: (value, length) => value && value.length >= length,
            maxLength: (value, length) => value && value.length <= length,
            mail: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            username: (value) => /^[a-zA-Z0-9_-]{3,20}$/.test(value),
            password: (value) => value && value.length >= 6
        };
    }

    // Валидация почты
    validateMail(value) {
        const errors = [];

        if (!this.validationRules.required(value)) {
            errors.push('E-mail обязателен для заполнения');
        } else if (!this.validationRules.mail(value)) {
            errors.push('Введен неверный E-mail');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Валидация логина
    validateLogin(value) {
        const errors = [];
        
        if (!this.validationRules.required(value)) {
            errors.push('Логин обязателен для заполнения');
        } else if (!this.validationRules.minLength(value, 3)) {
            errors.push('Логин должен содержать минимум 3 символа');
        } else if (!this.validationRules.username(value)) {
            errors.push('Введено неверное имя пользователя');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Валидация пароля
    validatePassword(value) {
        const errors = [];
        
        if (!this.validationRules.required(value)) {
            errors.push('Пароль обязателен для заполнения');
        } else if (!this.validationRules.password(value)) {
            errors.push('Пароль должен содержать минимум 6 символов');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Показать поле с ошибками
    showFieldErrors($field, errors) {
        this.removeFieldErrors($field);
        
        if (errors && errors.length > 0) {
            $field.addClass('error');
            const $errorContainer = $('<div class="error-messages"></div>');
            
            errors.forEach(error => {
                $errorContainer.append(`<span class="error-message">${error}</span>`);
            });
            
            $field.after($errorContainer);
        }
    }

    // Удалить поле с ошибками
    removeFieldErrors($field) {
        $field.removeClass('error');
        $field.siblings('.error-messages').remove();
    }
}

// Создаем и экспортируем экземпляр
const validatorInstance = new Validator();

// Экспорт для разных систем модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = validatorInstance;
}
if (typeof window !== 'undefined') {
    window.Validator = validatorInstance;
}