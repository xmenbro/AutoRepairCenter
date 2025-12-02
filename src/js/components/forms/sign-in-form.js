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
    }
}

// Инициализация при загрузке документа
$(document).ready(function() {
    window.signInForm = new SignInForm('.auth-form');
});