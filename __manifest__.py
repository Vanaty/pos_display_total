{
    "name": "POS Display Total",
    "version": "1.2",
    "depends": ["point_of_sale"],
    "author": "Eric",
    "category": "Point of Sale",
    "license": "LGPL-3",
    "summary": "Envoie des produits sélectionnés vers une API externe",
    "data": [],
    "assets": {
        "point_of_sale.assets": [
            "pos_display_total/static/src/js/send_button.js",
            "pos_display_total/static/src/xml/send_button.xml",
        ]
    },
    "installable": True,
    "application": False
}
