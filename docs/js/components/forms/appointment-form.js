/**
 * Модуль для формы записи на услуги
 * @class AppointmentForm
 */
class AppointmentForm {
    constructor() {
        this.$modal = null;
        this.$form = null;
        this.$nameInput = null;
        this.$phoneInput = null;
        this.$emailInput = null;
        this.$serviceInput = null;
        this.$dateInput = null;
        this.$timeInput = null;
        this.$commentsTextarea = null;
        this.validator = window.Validator;
        this.currentService = null;
        this.currentServiceTitle = null;

        this.init();
    }

    // Инициализация
    init() {
        this.createModal();
        this.bindEvents();
    }

    // Создание модального окна
    createModal() {
        const modalHTML = `
            <div class="appointment-modal" id="appointment-modal">
                <div class="appointment-modal-overlay"></div>
                <div class="appointment-modal-content">
                    <button class="appointment-modal-close" type="button">
                        <span>&times;</span>
                    </button>
                    <h2 class="appointment-modal-title">Записаться на услугу</h2>
                    <form class="appointment-form" id="appointment-form">
                        <div class="form-group">
                            <label for="appointment-name">ФИО <span class="required">*</span></label>
                            <input type="text" id="appointment-name" name="name" required>
                            <div class="error-messages"></div>
                        </div>
                        <div class="form-group">
                            <label for="appointment-phone">Телефон <span class="required">*</span></label>
                            <input type="tel" id="appointment-phone" name="phone" placeholder="+7 (___) ___-__-__" required>
                            <div class="error-messages"></div>
                        </div>
                        <div class="form-group">
                            <label for="appointment-email">Email <span class="required">*</span></label>
                            <input type="email" id="appointment-email" name="email" required>
                            <div class="error-messages"></div>
                        </div>
                        <div class="form-group">
                            <label for="appointment-service">Услуга <span class="required">*</span></label>
                            <input type="text" id="appointment-service" name="service" placeholder="Выберите услугу или введите свою">
                            <div class="error-messages"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="appointment-date">Дата <span class="required">*</span></label>
                                <input type="date" id="appointment-date" name="date" required>
                                <div class="error-messages"></div>
                            </div>
                            <div class="form-group">
                                <label for="appointment-time">Время <span class="required">*</span></label>
                                <input type="time" id="appointment-time" name="time" required>
                                <div class="error-messages"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="appointment-comments">Комментарий</label>
                            <textarea id="appointment-comments" name="comments" rows="4" placeholder="Дополнительная информация о вашем автомобиле или услуге"></textarea>
                            <div class="error-messages"></div>
                        </div>
                        <div class="form-error"></div>
                        <div class="form-success"></div>
                        <div class="form-actions">
                            <button type="button" class="btn-cancel">Отмена</button>
                            <button type="submit" class="btn-submit">Записаться</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        $('body').append(modalHTML);
        this.$modal = $('#appointment-modal');
        this.$form = $('#appointment-form');
        this.$nameInput = $('#appointment-name');
        this.$phoneInput = $('#appointment-phone');
        this.$emailInput = $('#appointment-email');
        this.$serviceInput = $('#appointment-service');
        this.$dateInput = $('#appointment-date');
        this.$timeInput = $('#appointment-time');
        this.$commentsTextarea = $('#appointment-comments');

        // Устанавливаем минимальную дату (сегодня)
        const today = new Date().toISOString().split('T')[0];
        this.$dateInput.attr('min', today);
    }

    // Привязка событий
    bindEvents() {
        // Открытие модального окна при клике на кнопки "Записаться"
        // Кнопки "Узнать о гарантии" и "Получить консультацию" обрабатываются в info-modals.js
        $(document).on('click', '.btn, .service-btn', (e) => {
            const $button = $(e.currentTarget);
            const buttonText = $button.text().trim().toLowerCase();
            
            // Проверяем, что это кнопка "Записаться" (case-insensitive)
            // Исключаем кнопки "Узнать о гарантии" и "Получить консультацию"
            const isAppointmentButton = buttonText === 'записаться' || buttonText.includes('записаться');
            const isGuaranteeButton = buttonText.includes('гарантии') || buttonText.includes('гарантия');
            const isConsultationButton = buttonText.includes('консультацию') || buttonText.includes('консультация');
            
            // Обрабатываем только кнопку "Записаться"
            if (isAppointmentButton && !isGuaranteeButton && !isConsultationButton) {
                e.preventDefault();
                const $card = $button.closest('.service-card, .slide, .slide-content');
                let serviceTitle = 'Услуга';

                // Определяем название услуги для кнопки "Записаться"
                if ($card.length) {
                    const $title = $card.find('.service-title, h2, h3');
                    if ($title.length) {
                        serviceTitle = $title.first().text().trim();
                    } else {
                        // Для слайдера на главной странице
                        const $slideContent = $button.closest('.slide-content');
                        if ($slideContent.length) {
                            const $h2 = $slideContent.find('h2');
                            if ($h2.length) {
                                serviceTitle = $h2.text().trim();
                            }
                        }
                    }
                }

                this.openModal(serviceTitle);
            }
        });

        // Закрытие модального окна
        this.$modal.find('.appointment-modal-close, .appointment-modal-overlay, .btn-cancel').on('click', () => {
            this.closeModal();
        });

        // Закрытие по ESC
        $(document).on('keydown', (e) => {
            if (e.key === 'Escape' && this.$modal.hasClass('active')) {
                this.closeModal();
            }
        });

        // Валидация при вводе
        this.$nameInput.on('input', () => this.validateName());
        this.$phoneInput.on('input', () => {
            this.formatPhone();
            this.validatePhone();
        });
        this.$emailInput.on('input', () => this.validateEmail());
        this.$serviceInput.on('input', () => this.validateService());
        this.$dateInput.on('change', () => this.validateDate());
        this.$timeInput.on('change', () => this.validateTime());

        // Очистка ошибок при фокусе
        this.$nameInput.on('focus', () => this.clearError(this.$nameInput));
        this.$phoneInput.on('focus', () => this.clearError(this.$phoneInput));
        this.$emailInput.on('focus', () => this.clearError(this.$emailInput));
        this.$serviceInput.on('focus', () => this.clearError(this.$serviceInput));
        this.$dateInput.on('focus', () => this.clearError(this.$dateInput));
        this.$timeInput.on('focus', () => this.clearError(this.$timeInput));

        // Отправка формы
        this.$form.on('submit', (e) => this.handleSubmit(e));
    }

    // Открытие модального окна
    openModal(serviceTitle) {
        this.currentServiceTitle = serviceTitle || 'Услуга';
        this.$serviceInput.val(this.currentServiceTitle);
        this.$form[0].reset();
        this.$form.find('.form-error, .form-success').remove();
        this.clearAllErrors();
        this.$modal.addClass('active');
        $('body').css('overflow', 'hidden');
    }

    // Закрытие модального окна
    closeModal() {
        this.$modal.removeClass('active');
        $('body').css('overflow', '');
        this.$form[0].reset();
        this.$form.find('.form-error, .form-success').remove();
        this.clearAllErrors();
    }

    // Форматирование телефона
    formatPhone() {
        let value = this.$phoneInput.val().replace(/\D/g, '');
        if (value.startsWith('8')) {
            value = '7' + value.substring(1);
        }
        if (value.startsWith('7')) {
            value = value.substring(1);
        }
        if (value.length > 0) {
            let formatted = '+7 (';
            if (value.length > 0) formatted += value.substring(0, 3);
            if (value.length > 3) formatted += ') ' + value.substring(3, 6);
            if (value.length > 6) formatted += '-' + value.substring(6, 8);
            if (value.length > 8) formatted += '-' + value.substring(8, 10);
            this.$phoneInput.val(formatted);
        }
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

    // Валидация даты
    validateDate() {
        const value = this.$dateInput.val();
        const errors = [];
        
        if (!value) {
            errors.push('Дата обязательна для заполнения');
        } else {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                errors.push('Дата не может быть в прошлом');
            }
        }
        
        if (errors.length === 0) {
            this.clearError(this.$dateInput);
            return true;
        } else {
            this.validator.showFieldErrors(this.$dateInput.parent(), errors);
            return false;
        }
    }

    // Валидация времени
    validateTime() {
        const value = this.$timeInput.val();
        const errors = [];
        
        if (!value) {
            errors.push('Время обязательно для заполнения');
        } else {
            const [hours, minutes] = value.split(':').map(Number);
            if (hours < 8 || hours > 20) {
                errors.push('Время работы: 08:00 - 20:00');
            }
        }
        
        if (errors.length === 0) {
            this.clearError(this.$timeInput);
            return true;
        } else {
            this.validator.showFieldErrors(this.$timeInput.parent(), errors);
            return false;
        }
    }

    // Валидация услуги
    validateService() {
        const value = this.$serviceInput.val().trim();
        const errors = [];
        
        if (!value) {
            errors.push('Услуга обязательна для заполнения');
        } else if (value.length < 2) {
            errors.push('Название услуги должно содержать минимум 2 символа');
        }
        
        if (errors.length === 0) {
            this.clearError(this.$serviceInput);
            return true;
        } else {
            this.validator.showFieldErrors(this.$serviceInput.parent(), errors);
            return false;
        }
    }

    // Очистить ошибки
    clearError($input) {
        this.validator.removeFieldErrors($input.parent());
    }

    // Очистить все ошибки
    clearAllErrors() {
        this.$form.find('.form-group').each((index, element) => {
            const $group = $(element);
            this.validator.removeFieldErrors($group);
        });
    }

    // Общая валидация
    validateAll() {
        const isNameValid = this.validateName();
        const isPhoneValid = this.validatePhone();
        const isEmailValid = this.validateEmail();
        const isServiceValid = this.validateService();
        const isDateValid = this.validateDate();
        const isTimeValid = this.validateTime();
        
        return isNameValid && isPhoneValid && isEmailValid && isServiceValid && isDateValid && isTimeValid;
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
            name: this.$nameInput.val().trim(),
            phone: this.$phoneInput.val().trim(),
            email: this.$emailInput.val().trim(),
            service: this.$serviceInput.val().trim(),
            date: this.$dateInput.val(),
            time: this.$timeInput.val(),
            comments: this.$commentsTextarea.val().trim()
        };

        // Дополнительная проверка
        if (!formData.name || !formData.phone || !formData.email || 
            !formData.service || !formData.date || !formData.time) {
            this.showFormError('Пожалуйста, заполните все обязательные поля');
            return;
        }
        
        // Показываем индикатор загрузки
        this.setLoadingState(true);
        
        // В реальном приложении здесь был бы AJAX запрос
        // Для демонстрации используем setTimeout
        setTimeout(() => {
            this.handleSuccess({
                success: true,
                message: 'Запись успешно оформлена! Мы свяжемся с вами в ближайшее время.'
            });
            this.setLoadingState(false);
        }, 1000);
        
        // Пример AJAX запроса (закомментирован, так как сервер может быть не настроен):
        /*
        $.ajax({
            url: 'http://localhost:3000/appointments',
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
        */
    }

    // Обработка успешной записи
    handleSuccess(response) {
        this.$form.find('.form-error').remove();
        
        if (response.success) {
            this.showSuccessMessage(response.message || 'Запись успешно оформлена!');
            
            // Закрываем модальное окно через 2 секунды
            setTimeout(() => {
                this.closeModal();
            }, 2000);
        } else {
            this.showFormError(response.message || 'Ошибка при оформлении записи. Попробуйте еще раз.');
        }
    }

    // Обработка ошибок
    handleError(xhr, status, error) {
        let errorMessage = 'Произошла ошибка при отправке данных';
        
        if (xhr.responseJSON && xhr.responseJSON.message) {
            errorMessage = xhr.responseJSON.message;
        } else if (xhr.status === 0) {
            errorMessage = 'Ошибка подключения к серверу';
        } else if (xhr.status === 400) {
            errorMessage = 'Некорректные данные. Проверьте правильность заполнения формы.';
        } else if (xhr.status === 500) {
            errorMessage = 'Ошибка на сервере. Попробуйте позже';
        }
        
        this.showFormError(errorMessage);
    }

    // Показать ошибки
    showFormError(message) {
        this.$form.find('.form-error').remove();
        
        const $errorDiv = $(`
            <div class="form-error">
                <span class="error-message">${message}</span>
            </div>
        `);
        
        this.$form.find('.form-actions').before($errorDiv);
        
        setTimeout(() => {
            $errorDiv.fadeOut(300, function() {
                $(this).remove();
            });
        }, 7000);
    }

    // Показать сообщение об успехе
    showSuccessMessage(message) {
        this.$form.find('.form-success').remove();
        
        const $successDiv = $(`
            <div class="form-success">
                <span class="success-message">${message}</span>
            </div>
        `);
        
        this.$form.find('.form-actions').before($successDiv);
    }

    // Состояние загрузки
    setLoadingState(isLoading) {
        const $submitBtn = this.$form.find('.btn-submit');
        
        if (isLoading) {
            $submitBtn.prop('disabled', true);
            $submitBtn.data('original-text', $submitBtn.text());
            $submitBtn.text('Отправка...');
            $submitBtn.css('opacity', '0.7');
            $submitBtn.css('cursor', 'not-allowed');
            
            this.$form.find('input, select, textarea, button').prop('disabled', true);
            this.$form.find('.btn-cancel').prop('disabled', false);
        } else {
            $submitBtn.prop('disabled', false);
            const originalText = $submitBtn.data('original-text');
            if (originalText) {
                $submitBtn.text(originalText);
            }
            $submitBtn.css('opacity', '1');
            $submitBtn.css('cursor', 'pointer');
            
            this.$form.find('input, select, textarea, button').prop('disabled', false);
        }
    }
}

// Инициализация при загрузке документа
$(document).ready(function() {
    window.appointmentForm = new AppointmentForm();
});

