/**
 * Модуль для формы оформления заказа
 * @class OrderForm
 */
class OrderForm {
    constructor(formSelector) {
        this.$form = $(formSelector);
        this.$nameInput = $('#customer-name');
        this.$phoneInput = $('#phone');
        this.$emailInput = $('#email');
        this.$addressInput = $('#address');
        this.$deliverySelect = $('#delivery-method');
        this.$paymentSelect = $('#payment-method');
        this.$commentsTextarea = $('#comments');
        this.validator = window.Validator;

        this.init();
    }

    // Инициализация
    init() {
        this.bindEvents();
    }
    
    // Создание событий
    bindEvents() {
        // Валидация при вводе
        this.$nameInput.on('input', () => this.validateName());
        this.$phoneInput.on('input', () => this.validatePhone());
        this.$emailInput.on('input', () => this.validateEmail());
        this.$addressInput.on('input', () => this.validateAddress());
        this.$deliverySelect.on('change', () => this.validateDelivery());
        this.$paymentSelect.on('change', () => this.validatePayment());
        
        // Валидация при отправке формы
        this.$form.on('submit', (e) => this.handleSubmit(e));
        
        // Очистка ошибок при фокусе
        this.$nameInput.on('focus', () => this.clearError(this.$nameInput));
        this.$phoneInput.on('focus', () => this.clearError(this.$phoneInput));
        this.$emailInput.on('focus', () => this.clearError(this.$emailInput));
        this.$addressInput.on('focus', () => this.clearError(this.$addressInput));
        this.$deliverySelect.on('focus', () => this.clearError(this.$deliverySelect));
        this.$paymentSelect.on('focus', () => this.clearError(this.$paymentSelect));
    }

    // Валидация имени
    validateName() {
        const value = this.$nameInput.val().trim();
        const errors = [];
        
        if (!value) {
            errors.push('ФИО обязательно для заполнения');
        } else if (value.length < 2) {
            errors.push('ФИО должно содержать минимум 2 символа');
        } else if (!/^[а-яА-ЯёЁ\s-]+$/.test(value) && !/^[a-zA-Z\s-]+$/.test(value)) {
            errors.push('ФИО должно содержать только буквы');
        }
        
        if (errors.length === 0) {
            this.clearError(this.$nameInput);
            return true;
        } else {
            this.validator.showFieldErrors(this.$nameInput.parent(), errors);
            return false;
        }
    }
    
    // Валидация телефона
    validatePhone() {
        const value = this.$phoneInput.val().trim();
        const errors = [];
        
        if (!value) {
            errors.push('Телефон обязателен для заполнения');
        } else {
            // Убираем все нецифровые символы для проверки
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length < 10 || digitsOnly.length > 11) {
                errors.push('Введите корректный номер телефона');
            }
        }
        
        if (errors.length === 0) {
            this.clearError(this.$phoneInput);
            return true;
        } else {
            this.validator.showFieldErrors(this.$phoneInput.parent(), errors);
            return false;
        }
    }
    
    // Валидация email
    validateEmail() {
        const value = this.$emailInput.val().trim();
        const result = this.validator.validateMail(value);
        
        if (result.isValid) {
            this.clearError(this.$emailInput);
            return true;
        } else {
            this.validator.showFieldErrors(this.$emailInput.parent(), result.errors);
            return false;
        }
    }
    
    // Валидация адреса
    validateAddress() {
        const value = this.$addressInput.val().trim();
        const errors = [];
        
        if (!value) {
            errors.push('Адрес обязателен для заполнения');
        } else if (value.length < 5) {
            errors.push('Адрес должен содержать минимум 5 символов');
        }
        
        if (errors.length === 0) {
            this.clearError(this.$addressInput);
            return true;
        } else {
            this.validator.showFieldErrors(this.$addressInput.parent(), errors);
            return false;
        }
    }
    
    // Валидация способа доставки
    validateDelivery() {
        const value = this.$deliverySelect.val();
        const errors = [];
        
        if (!value) {
            errors.push('Выберите способ доставки');
        }
        
        if (errors.length === 0) {
            this.clearError(this.$deliverySelect);
            return true;
        } else {
            this.validator.showFieldErrors(this.$deliverySelect.parent(), errors);
            return false;
        }
    }
    
    // Валидация способа оплаты
    validatePayment() {
        const value = this.$paymentSelect.val();
        const errors = [];
        
        if (!value) {
            errors.push('Выберите способ оплаты');
        }
        
        if (errors.length === 0) {
            this.clearError(this.$paymentSelect);
            return true;
        } else {
            this.validator.showFieldErrors(this.$paymentSelect.parent(), errors);
            return false;
        }
    }
    
    // Очистить ошибки
    clearError($input) {
        this.validator.removeFieldErrors($input.parent());
    }
    
    // Общая валидация
    validateAll() {
        const isNameValid = this.validateName();
        const isPhoneValid = this.validatePhone();
        const isEmailValid = this.validateEmail();
        const isAddressValid = this.validateAddress();
        const isDeliveryValid = this.validateDelivery();
        const isPaymentValid = this.validatePayment();
        
        return isNameValid && isPhoneValid && isEmailValid && 
               isAddressValid && isDeliveryValid && isPaymentValid;
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
            customerName: this.$nameInput.val().trim(),
            phone: this.$phoneInput.val().trim(),
            email: this.$emailInput.val().trim(),
            address: this.$addressInput.val().trim(),
            deliveryMethod: this.$deliverySelect.val(),
            paymentMethod: this.$paymentSelect.val(),
            comments: this.$commentsTextarea.val().trim()
        };

        // Дополнительная проверка на пустые обязательные поля
        if (!formData.customerName || !formData.phone || !formData.email || 
            !formData.address || !formData.deliveryMethod || !formData.paymentMethod) {
            this.showFormError('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        // Показываем индикатор загрузки
        this.setLoadingState(true);
        
        $.ajax({
            url: 'http://localhost:3000/order',
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
    
    // Обработка успешного оформления заказа
    handleSuccess(response) {
        // Очищаем предыдущие сообщения
        this.$form.find('.form-error').remove();
        this.$form.find('.form-success').remove();
        
        if (response.success) {
            // Успешное оформление заказа
            this.showSuccessMessage(response.message || 'Заказ успешно оформлен!');
            
            // Сохраняем данные заказа (опционально)
            if (response.order) {
                localStorage.setItem('lastOrder', JSON.stringify(response.order));
            }
            
            // Редирект на главную страницу через 2 секунды
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            // Сервер вернул ошибку
            this.showFormError(response.message || 'Ошибка при оформлении заказа. Попробуйте еще раз.');
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
        } else if (xhr.status === 404) {
            errorMessage = 'Сервер обработки заказов не найден. Проверьте URL эндпоинта';
        } else if (xhr.status === 500) {
            errorMessage = 'Ошибка на сервере. Попробуйте позже';
        } else if (status === 'timeout') {
            errorMessage = 'Превышено время ожидания ответа от сервера';
        } else if (status === 'parsererror') {
            errorMessage = 'Ошибка обработки ответа сервера';
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
            $submitBtn.val('Оформление заказа...');
            $submitBtn.css('opacity', '0.7');
            $submitBtn.css('cursor', 'not-allowed');
            
            // Блокируем все поля ввода
            this.$form.find('input, select, textarea').prop('disabled', true);
        } else {
            $submitBtn.prop('disabled', false);
            const originalText = $submitBtn.data('original-text');
            if (originalText) {
                $submitBtn.val(originalText);
            }
            $submitBtn.css('opacity', '1');
            $submitBtn.css('cursor', 'pointer');
            
            // Разблокируем все поля ввода
            this.$form.find('input, select, textarea').prop('disabled', false);
        }
    }
}

// Инициализация при загрузке документа
$(document).ready(function() {
    window.orderForm = new OrderForm('.order-form');
});

