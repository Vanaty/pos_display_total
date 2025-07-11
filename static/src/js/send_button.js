odoo.define('pos_display_total.ProductScreenInterval', function (require) {
    "use strict";

    const ProductScreen = require('point_of_sale.ProductScreen');
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('@web/core/utils/hooks');
    const { onWillUnmount, onMounted } = require('@odoo/owl');

    const ProductScreenWithInterval = (ProductScreen) => class extends ProductScreen {
        setup() {
            super.setup();
            this.intervalId = null;
            this.apiBaseUrl = 'http://localhost:8086';

            onMounted(() => this._startOrderMonitoring());
            onWillUnmount(() => this._stopOrderMonitoring());

            this._oldOrders = [];
            this._wellcomeLoaded = false;
        }

        _startOrderMonitoring() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
            console.log("ProductScreen: Order monitoring interval started.");
            this.intervalId = setInterval(() => {
                this._monitorCurrentOrder();
            }, 800);
        }

        _stopOrderMonitoring() {
            if (this.intervalId) {
                console.log("ProductScreen: Order monitoring interval stopped.");
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }

        _monitorCurrentOrder() {
            const currentOrder = this.env.pos.get_order();
            if (currentOrder && currentOrder.orderlines) {
                const currentOrderlinesData = currentOrder.orderlines.map(line => ({
                    product_id: line.product.id,
                    name: line.product.display_name,
                    price: line.get_unit_price(),
                    quantity: line.quantity,
                }));

                if (JSON.stringify(currentOrderlinesData) !== JSON.stringify(this._oldOrders)) {
                    console.log('New order lines detected on ProductScreen, sending to API');
                    this._oldOrders = currentOrderlinesData;
                    this._sendOrder(currentOrderlinesData);
                }
            } else if (this._oldOrders.length > 0) {
                console.log('Order cleared or no order, resetting old orders.');
                this._oldOrders = [];
                this._sendOrder([]);
            }
        }

        async _sendOrder(productsData) {
            console.log('Produits actuels dans le panier (depuis ProductScreen):', productsData);
            const dataToSend = productsData.map(product => ({
                ...product,
                date: new Date().toISOString(),
            }));

            try {
                const response = await fetch(`${this.apiBaseUrl}/api/receive_order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend),
                    signal: AbortSignal.timeout(5000)
                });

                if (response.ok) {
                    console.log('Products sent successfully:', dataToSend);
                } else {
                    console.error('Error sending products:', response.statusText);
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.error('Request timed out:', error);
                } else {
                    console.error('Network error sending products:', error);
                }
            }
        }

        async _callWelcome() {
            try {
                const response = await fetch(`${this.apiBaseUrl}/api/welcome`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal: AbortSignal.timeout(5000)
                });
                this._oldOrders = [];
                console.log("Welcome API called successfully.");
            } catch (error) {
                console.error('Network error during welcome call:', error);
                this.showPopup('OfflineErrorPopup', {
                    title: 'Network Error',
                    body: 'Failed to connect to VDF server for welcome message.',
                });
            }
        }
    };

    Registries.Component.extend(ProductScreen, ProductScreenWithInterval);

    class SendButton extends PosComponent {
        setup() {
            super.setup();
            useListener('click', this._onClick);
        }
        async _onClick() {
            this.env.pos.get_screen('ProductScreen')._callWelcome();
        }
    }
    SendButton.template = 'SendButton';
    ProductScreen.addControlButton({
        component: SendButton,
        position: ['before','OrderlineCustomerNoteButton'],
    });
    Registries.Component.add(SendButton);

    return { ProductScreenWithInterval, SendButton };
});