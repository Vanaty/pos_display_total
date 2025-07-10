odoo.define('pos_display_total.pos_cart_listener', function (require) {
    'use strict';

    const { Order, Orderline } = require('point_of_sale.models');
    const Registries = require('point_of_sale.Registries');

    const PosCartListenerOrder = (Order) => class PosCartListenerOrder extends Order {
        constructor(...args) {
            super(...args);
            this.apiBaseUrl = 'http://localhost:8086';
            this.oldData = [];
        }
        setup() {
            super.setup();
        }
        remove_orderline(line) {
            super.remove_orderline(line);
            if (line.get_product().display_name) {
                this.onCartChange();
            }
        }

        set_quantity(line, quantity, keep_price) {
            const oldQuantity = line.get_quantity();
            super.set_quantity(line, quantity, keep_price);

            if (oldQuantity && oldQuantity !== line.get_quantity()) {
                this.onCartChange();
            }
        }

        add_product(product, options) {
            const line = super.add_product(product, options);
            this.onCartChange();
            return line;
        }

        onCartChange() {
            const currentLines = this.get_orderlines();
            const productsData = currentLines.map(line => ({
                product_id: line.product.id,
                name: line.product.display_name,
                price: line.get_unit_price(),
                quantity: line.quantity,
            }));
            if (JSON.stringify(productsData) === JSON.stringify(this.oldData)) {
                return;
            }

            console.log('Produits actuels dans le panier:', productsData);
            fetch(`${this.apiBaseUrl}/api/receive_order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productsData),
                signal: AbortSignal.timeout(5000)
            }).then(response => {

                if (response.ok) {
                    console.log('Products sent successfully:', productsData);
                    this.oldData = productsData; // Update oldData with the current state
                } else {
                    console.error('Error sending products:', response.statusText);
                }
            }).catch(error => {
                if (error.name === 'AbortError') {
                    console.error('Request timed out:', error);
                } else {
                    console.error('Error sending products:', error);
                }
            });
        }
    };

    Registries.Model.extend(Order, PosCartListenerOrder);

    const PosCartListenerOrderline = (Orderline) => class PosCartListenerOrderline extends Orderline {
        setup() {
            super.setup();
        }

        set_quantity(quantity, keep_price) {
            const oldQuantity = this.quantity;
            super.set_quantity(quantity, keep_price);
            if (oldQuantity !== this.quantity) {
                this.order.onCartChange();
            }
        }

        set_unit_price(price) {
            const oldPrice = this.price;
            super.set_unit_price(price);
            if (oldPrice !== this.price) {
                this.order.onCartChange();
            }
        }

        set_discount(discount) {
            const oldDiscount = this.discount;
            super.set_discount(discount);
            if (oldDiscount !== this.discount) {
                this.order.onCartChange();
            }
        }
    };

    Registries.Model.extend(Orderline, PosCartListenerOrderline);

});