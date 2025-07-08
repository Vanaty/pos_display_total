odoo.define('pos_display_total.SendButton', function (require) {
    "use strict";

    const ProductScreen = require('point_of_sale.ProductScreen');
    const Registries = require('point_of_sale.Registries');
    const PosComponent = require('point_of_sale.PosComponent');
    const { useListener } = require('@web/core/utils/hooks');

    class SendButton extends PosComponent {
        setup() {
            super.setup();
            useListener('click', this._onClick);
            this.apiBaseUrl = 'http://localhost:8086';
            this._loadConfig();
            this._stopLoop = false;
            this._setupOrderListener();
        }

        _setupOrderListener() {
            this._oldOrders = [];
            this._wellcomeLoaded = false;
            if (this._interval) {
                clearInterval(this._interval);
            }
            // this._interval =  setInterval(() => {
            //     this._sendOrderAuto();
            // }, 500);
            this._sendOrderAuto()
            
        }

        async _sendOrderAuto() {
            // console.log('Auto sending order 1');
            clearTimeout(this._autoSendTimeout);
            this._autoSendTimeout = setTimeout(() => {
                if (this.env.pos.get_order() && this.env.pos.get_order().orderlines) {
                    const currentOrder = this.env.pos.get_order().orderlines.map(line => ({
                        product_id: line.product.id,
                        name: line.product.display_name,
                        price: line.get_unit_price(),
                        quantity: line.quantity,
                    }));
                    if (currentOrder && currentOrder.length > 0) {
                        this._wellcomeLoaded = false;
                        const newOrders = currentOrder;
                        if (JSON.stringify(newOrders) !== JSON.stringify(this._oldOrders)) {
                            console.log('New order lines detected, sending to API');
                            this._oldOrders = newOrders;
                            this._sendOrder();
                        }
                    }
                } else {
                    // console.log('No order lines to send, calling welcome API');
                    this._callWelcome();
                }
                if (this._stopLoop) {
                    console.log('Stopping auto send');
                    return;
                }
                this._sendOrderAuto();
            }, 1000);

        }

        async _stopAutoSend() {
            if (this._autoSendTimeout) {
                clearTimeout(this._autoSendTimeout);
                this._autoSendTimeout = null;
            }
            if (this._interval) {
                clearInterval(this._interval);
                this._interval = null;
            }
            this._wellcomeLoaded = false;
            this._stopLoop = true;
        }

        async _loadConfig() {
            try {
                const config = await this.rpc({
                    route: '/pos_display_total/get_config',
                    params: {}
                });
                this.apiBaseUrl = config.api_base_url;
            } catch (error) {
                console.warn('Failed to load API configuration, using default:', error);
            }
        }

        async _onClick() {
            // Appel manuel du bouton
            this._callWelcome();
        }

        async _callWelcome() {
            try {
                if (this._wellcomeLoaded) {
                    return;
                }
                const response = await fetch(`${this.apiBaseUrl}/api/welcome`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal: AbortSignal.timeout(5000)
                });
                this._oldOrders = [];
                this._wellcomeLoaded = true;
            } catch (error) {
                console.error('Network error:', error);
                this.showPopup('OfflineErrorPopup', {
                    title: 'Network Error',
                    body: 'Failed to send products due to network issues or VDF server error.',
                });
            }
        }

        async _sendOrder() {
            const current_order = this.env.pos.get_order();
            if (current_order && current_order.orderlines.length > 0) {
                const productsData = current_order.orderlines.map(line => ({
                    product_id: line.product.id,
                    name: line.product.display_name,
                    price: line.get_unit_price(),
                    quantity: line.quantity,
                }));

                try {
                    const response = await fetch(`${this.apiBaseUrl}/api/receive_order`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(productsData),
                        signal: AbortSignal.timeout(5000)
                    });

                    if (response.ok) {
                        console.log('Products sent successfully:', productsData);
                    } else {
                        console.error('Error sending products:', response.statusText);
                        this.showPopup('ErrorPopup', {
                            title: 'Error',
                            body: 'Failed to send products. Please try again.',
                        });
                    }
                } catch (error) {
                    console.error('Network error:', error);
                }
            }
        }

        willUnmount() {
            this._stopAutoSend();
            super.willUnmount();
        }
    }

    SendButton.template = 'SendButton';
    ProductScreen.addControlButton({
        component: SendButton,
        position: ['before','OrderlineCustomerNoteButton'],
    });
    Registries.Component.add(SendButton);
    return SendButton;
});
