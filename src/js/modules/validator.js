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
            username: (value) => /^[a-zA-Z0-9_-]{3,20}$/.test(value),
            password: (value) => value && value.length >= 6
        };
    }

    // Валидация логина
    validateLogin(value) {
        const errors = [];
        
        if (!this.validationRules.required(value)) {
            errors.push('Логин обязателен для заполнения');
        } else if (!this.validationRules.minLength(value, 3)) {
            errors.push('Логин должен содержать минимум 3 символа');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
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