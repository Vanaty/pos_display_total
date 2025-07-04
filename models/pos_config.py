from odoo import models, fields, api

class PosConfig(models.Model):
    _inherit = 'pos.config'

    api_base_url = fields.Char(
        string='API Base URL',
        default='http://localhost:8086',
        help='Base URL for the external API'
    )

    @api.model
    def get_api_config(self):
        """Return API configuration for the current POS session"""
        config = self.env['pos.config'].search([('id', '=', self.env.context.get('active_id'))], limit=1)
        return {
            'api_base_url': config.api_base_url if config else self.env['ir.config_parameter'].sudo().get_param('pos_display_total.api_base_url', 'http://localhost:5000')
        }
