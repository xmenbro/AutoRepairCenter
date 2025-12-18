/**
 * Модуль для модальных окон с информацией (консультация, гарантии)
 * @class InfoModals
 */
class InfoModals {
    constructor() {
        this.phoneNumber = '+7 (910) 123-45-67';
        this.guarantees = [
            {
                title: 'Гарантия на ремонт двигателя',
                period: '2 года',
                description: 'Гарантия на все виды работ по ремонту и обслуживанию двигателя'
            },
            {
                title: 'Гарантия на ремонт АКПП',
                period: '2 года',
                description: 'Гарантия на ремонт и обслуживание автоматической коробки передач'
            },
            {
                title: 'Гарантия на кузовной ремонт',
                period: '1 год',
                description: 'Гарантия на все виды кузовных работ, включая покраску и рихтовку'
            },
            {
                title: 'Гарантия на запчасти',
                period: '1-2 года',
                description: 'Гарантия на оригинальные и сертифицированные запчасти'
            },
            {
                title: 'Гарантия на диагностику',
                period: '30 дней',
                description: 'Гарантия на точность диагностики. При обнаружении ошибки - бесплатная повторная диагностика'
            },
            {
                title: 'Гарантия на шиномонтаж',
                period: '6 месяцев',
                description: 'Гарантия на качество шиномонтажных работ'
            },
            {
                title: 'Гарантия на замену масла',
                period: '3 месяца',
                description: 'Гарантия на качество замены масла и фильтров'
            },
            {
                title: 'Гарантия на детейлинг',
                period: '1 месяц',
                description: 'Гарантия на качество детейлинг-услуг и защитных покрытий'
            }
        ];
        
        this.init();
    }

    // Инициализация
    init() {
        this.createConsultationModal();
        this.createGuaranteeModal();
        this.bindEvents();
    }

    // Создание модального окна для консультации
    createConsultationModal() {
        const modalHTML = `
            <div class="info-modal" id="consultation-modal">
                <div class="info-modal-overlay"></div>
                <div class="info-modal-content">
                    <button class="info-modal-close" type="button">
                        <span>&times;</span>
                    </button>
                    <h2 class="info-modal-title">Получить консультацию</h2>
                    <div class="info-modal-body">
                        <p class="consultation-text">Позвоните нам, и наши специалисты ответят на все ваши вопросы!</p>
                        <div class="phone-section">
                            <a href="tel:+79101234567" class="phone-link">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
                                </svg>
                                ${this.phoneNumber}
                            </a>
                        </div>
                        <p class="consultation-hours">Время работы: Пн-Вс 08:00 - 20:00</p>
                    </div>
                </div>
            </div>
        `;

        $('body').append(modalHTML);
    }

    // Создание модального окна со списком гарантий
    createGuaranteeModal() {
        let guaranteesListHTML = '';
        this.guarantees.forEach((guarantee, index) => {
            guaranteesListHTML += `
                <div class="guarantee-item">
                    <div class="guarantee-header">
                        <h3 class="guarantee-title">${guarantee.title}</h3>
                        <span class="guarantee-period">${guarantee.period}</span>
                    </div>
                    <p class="guarantee-description">${guarantee.description}</p>
                </div>
            `;
        });

        const modalHTML = `
            <div class="info-modal" id="guarantee-modal">
                <div class="info-modal-overlay"></div>
                <div class="info-modal-content guarantee-modal-content">
                    <button class="info-modal-close" type="button">
                        <span>&times;</span>
                    </button>
                    <h2 class="info-modal-title">Наши гарантии</h2>
                    <div class="info-modal-body">
                        <div class="guarantees-list">
                            ${guaranteesListHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('body').append(modalHTML);
    }

    // Привязка событий
    bindEvents() {
        const self = this;

        // Обработка кнопок на слайдере
        $(document).on('click', '.btn, .service-btn', function(e) {
            const $button = $(this);
            const buttonText = $button.text().trim().toLowerCase();
            
            // Кнопка "Получить консультацию"
            if (buttonText.includes('консультацию') || buttonText.includes('консультация')) {
                e.preventDefault();
                self.openConsultationModal();
                return;
            }
            
            // Кнопка "Узнать о гарантии"
            if (buttonText.includes('гарантии') || buttonText.includes('гарантия')) {
                e.preventDefault();
                self.openGuaranteeModal();
                return;
            }
        });

        // Закрытие модальных окон
        $(document).on('click', '.info-modal-close, .info-modal-overlay', function() {
            const $modal = $(this).closest('.info-modal');
            self.closeModal($modal);
        });

        // Закрытие по ESC
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape') {
                $('.info-modal.active').each(function() {
                    self.closeModal($(this));
                });
            }
        });
    }

    // Открытие модального окна консультации
    openConsultationModal() {
        const $modal = $('#consultation-modal');
        $modal.addClass('active');
        $('body').css('overflow', 'hidden');
    }

    // Открытие модального окна гарантий
    openGuaranteeModal() {
        const $modal = $('#guarantee-modal');
        $modal.addClass('active');
        $('body').css('overflow', 'hidden');
    }

    // Закрытие модального окна
    closeModal($modal) {
        $modal.removeClass('active');
        $('body').css('overflow', '');
    }
}

// Инициализация при загрузке документа
$(document).ready(function() {
    window.infoModals = new InfoModals();
});

// Экспорт для разных систем модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InfoModals;
}
if (typeof window !== 'undefined') {
    window.InfoModals = InfoModals;
}

