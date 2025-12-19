// Vue-based basket implementation
(function() {
    if (typeof Vue === 'undefined') {
        console.error('Vue is not loaded');
        return;
    }

    const { createApp } = Vue;

    createApp({
        data() {
            return {
                items: [],
                selectAll: true,
                loading: false,
                promoCode: '',
                promoMessage: '',
                appliedPromo: null,
                discountValue: 0
            };
        },
        computed: {
            totalCount() {
                return this.items.filter(i => i.selected).reduce((s, it) => s + (it.quantity || 0), 0);
            },
            totalPrice() {
                return this.items.filter(i => i.selected).reduce((s, it) => s + ((it.price || 0) * (it.quantity || 0)), 0);
            }
            ,
            finalPrice() {
                const price = this.totalPrice;
                const discount = this.discountValue || 0;
                const result = price - discount;
                return result > 0 ? result : 0;
            }
        },
        methods: {
            loadCart() {
                const self = this;
                if (!window.cart || !window.cart.getCart) {
                    console.error('Cart API not available');
                    return;
                }

                this.loading = true;
                window.cart.getCart()
                    .done(function(response) {
                        if (response.status === 'success') {
                            self.items = (response.cart || []).map(item => ({ ...item, selected: true }));
                            // If empty, keep items empty
                            self.selectAll = self.items.length > 0 && self.items.every(i => i.selected);
                        }
                    })
                    .fail(function(err) {
                        console.error('Ошибка при загрузке корзины', err);
                    })
                    .always(function() {
                        self.loading = false;
                    });
            },
            normalizeImage(imagePath) {
                if (!imagePath) return '';
                if (imagePath.startsWith('../images/')) {
                    return imagePath.replace('../images/', '../../images/');
                }
                return imagePath;
            },
            formatPrice(price) {
                if (price == null) return '0';
                return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            },
            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            },
            calculateDeliveryDate() {
                const today = new Date();
                const minDays = 1;
                const maxDays = 3;

                const minDeliveryDate = new Date(today);
                minDeliveryDate.setDate(today.getDate() + minDays);
                const maxDeliveryDate = new Date(today);
                maxDeliveryDate.setDate(today.getDate() + maxDays);

                const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

                const minDay = minDeliveryDate.getDate();
                const minMonth = monthNames[minDeliveryDate.getMonth()];
                const maxDay = maxDeliveryDate.getDate();
                const maxMonth = monthNames[maxDeliveryDate.getMonth()];

                if (minDeliveryDate.getMonth() === maxDeliveryDate.getMonth()) {
                    if (minDay !== maxDay) {
                        return `${minDay}-${maxDay} ${minMonth}`;
                    }
                    return `${minDay} ${minMonth}`;
                }
                return `${minDay} ${minMonth} - ${maxDay} ${maxMonth}`;
            },
            removeItem(productId) {
                const self = this;
                if (!window.cart || !window.cart.removeItem) {
                    console.error('Cart removeItem not available');
                    return;
                }

                // Optimistic UI: mark item as removing
                const idx = this.items.findIndex(i => i.id === productId);
                if (idx === -1) return;

                window.cart.removeItem(productId)
                    .done(function(response) {
                        if (response.status === 'success') {
                            self.items = (response.cart || []).map(item => ({ ...item, selected: true }));
                            self.selectAll = self.items.length > 0 && self.items.every(i => i.selected);
                        }
                    })
                    .fail(function(err) {
                        console.error('Ошибка при удалении', err);
                        alert('Ошибка при удалении товара');
                    });
            },
            onQuantityChange(item) {
                const qty = parseInt(item.quantity) || 1;
                if (qty <= 0) {
                    // if zero or invalid, remove item
                    this.removeItem(item.id);
                    return;
                }
                const self = this;
                if (!window.cart || !window.cart.updateQuantity) return;

                window.cart.updateQuantity(item.id, qty)
                    .done(function(response) {
                        if (response.status === 'success') {
                            // Update local items to reflect server response
                            self.items = (response.cart || []).map(ci => {
                                const existing = self.items.find(i => i.id === ci.id);
                                return { ...ci, selected: existing ? existing.selected : true };
                            });
                            self.selectAll = self.items.length > 0 && self.items.every(i => i.selected);
                        }
                    })
                    .fail(function(err) {
                        console.error('Ошибка при обновлении количества', err);
                        alert('Ошибка при обновлении количества');
                    });
            },
            increment(item) {
                item.quantity = (parseInt(item.quantity) || 0) + 1;
                this.onQuantityChange(item);
            },
            toggleSelectAll() {
                this.items.forEach(i => i.selected = this.selectAll);
                // compute summary automatically
            },
            updateOrderSummary() {
                // no-op: computed props update automatically; keep for compatibility
            },
            getItemsText(count) {
                const lastDigit = count % 10;
                const lastTwoDigits = count % 100;
                if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'шт.';
                if (lastDigit === 1) return 'шт.';
                if (lastDigit >= 2 && lastDigit <= 4) return 'шт.';
                return 'шт.';
            },
            applyPromo() {
                const self = this;
                const code = (this.promoCode || '').toString().trim();
                if (!code) {
                    this.promoMessage = 'Введите код промокода';
                    return;
                }

                // reset previous
                this.promoMessage = 'Проверка...';
                this.appliedPromo = null;
                this.discountValue = 0;

                fetch('http://localhost:3000/promo/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: code })
                }).then(res => res.json().then(body => ({ status: res.status, body })))
                  .then(result => {
                      if (result.status === 200 && result.body && result.body.success) {
                          const promo = result.body.promo;
                          // calculate discount
                          let discount = 0;
                          if (promo.type === 'percent') {
                              discount = Math.round(self.totalPrice * (promo.value / 100));
                          } else if (promo.type === 'fixed') {
                              discount = Number(promo.value) || 0;
                          }
                          self.appliedPromo = promo;
                          self.discountValue = discount;
                          self.promoMessage = `Промокод применён: ${promo.description || promo.code}`;
                      } else {
                          self.appliedPromo = null;
                          self.discountValue = 0;
                          self.promoMessage = result.body && result.body.message ? result.body.message : 'Промокод недействителен';
                      }
                  }).catch(err => {
                      console.error('Ошибка проверки промокода', err);
                      self.promoMessage = 'Ошибка при проверке промокода';
                      self.appliedPromo = null;
                      self.discountValue = 0;
                  });
            },
            goToOrder() {
                const selectedItems = this.items.filter(i => i.selected).length;
                if (selectedItems === 0) {
                    alert('Выберите товары для оформления заказа');
                    return;
                }
                window.location.href = 'order.html';
            }
        },
        mounted() {
            this.loadCart();
        }
    }).mount('#basket-app');

})();
