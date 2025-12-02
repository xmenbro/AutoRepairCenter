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