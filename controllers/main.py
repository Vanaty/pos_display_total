from odoo import http
from odoo.http import request

class PosDisplayTotalController(http.Controller):

    @http.route('/pos_display_total/get_config', type='json', auth='user')
    def get_config(self):
        """Get configuration for POS Display Total"""
        api_base_url = request.env['ir.config_parameter'].sudo().get_param(
            'pos_display_total.api_base_url', 
            'http://localhost:8086'
        )
        return {
            'api_base_url': api_base_url
        }
