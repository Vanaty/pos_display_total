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
            this.apiBaseUrl = 'http://localhost:8086'; // default fallback
            this._loadConfig();
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
            const current_order = this.env.pos.get_order();
            if (current_order.orderlines.length > 0) {
                const productsData = current_order.orderlines.map(line => ({
                    product_id: line.product.id,
                    name: line.product.display_name,
                    price: line.get_unit_price(),
                    quantity: line.quantity,
                }));

                // Use dynamic API URL
                fetch(`${this.apiBaseUrl}/api/receive_order`, {
                    timeout: 5000,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(productsData),
                }).then(response => {
                    if (response.ok) {
                        console.log('Products sent successfully:', productsData);
                    } else {
                        console.error('Error sending products:', response.statusText);
                        this.showPopup('ErrorPopup',{
                            title: 'Error',
                            body: 'Failed to send products. Please try again.',
                        });
                    }
                }).catch(error => {
                    console.error('Network error:', error);
                    this.showPopup('OfflineErrorPopup',{
                        title: 'Network Error',
                        body: 'Failed to send products due to network issues or VDF server error.',
                    });
                });
            } else {
                console.warn('No products selected to send.');
            }
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
