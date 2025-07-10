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


        willUnmount() {
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
