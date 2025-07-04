# POS Display Total

Un module Odoo 16 pour envoyer les produits sélectionnés du Point de Vente vers une API externe.

## Description

Ce module ajoute un bouton "Display Info" à l'interface du Point de Vente d'Odoo qui permet d'envoyer les informations des produits de la commande courante vers une API externe configurable.

## Fonctionnalités

- ✅ Bouton personnalisé dans l'interface POS
- ✅ Envoi des données de commande vers une API externe
- ✅ Configuration de l'URL de l'API via l'interface d'administration
- ✅ Gestion des erreurs réseau et de serveur
- ✅ Interface utilisateur responsive

## Installation

1. Copiez le module dans votre répertoire `addons` d'Odoo
2. Redémarrez votre serveur Odoo
3. Allez dans **Apps** → **Mettre à jour la liste des applications**
4. Recherchez "POS Display Total" et installez le module

## Configuration

### Configuration de l'API

1. Allez dans **Point de Vente** → **Configuration** → **Point de Vente**
2. Ouvrez la configuration de votre POS
3. Dans la section "External API Configuration", configurez l'URL de base de votre API
4. Sauvegardez les modifications

### Configuration système (optionnel)

Vous pouvez également configurer l'URL de l'API au niveau système :
1. Allez dans **Paramètres** → **Paramètres techniques** → **Paramètres système**
2. Créez ou modifiez le paramètre `pos_display_total.api_base_url`

## Utilisation

1. Ouvrez une session POS
2. Ajoutez des produits à votre commande
3. Cliquez sur le bouton "Display Info" (icône avion en papier)
4. Les données de la commande seront envoyées à l'API configurée

## Format des données envoyées

Le module envoie les données au format JSON vers l'endpoint `/api/receive_order` :

```json
[
  {
    "product_id": 123,
    "name": "Nom du produit",
    "price": 15.50,
    "quantity": 2
  }
]
```

## Structure du module

```
pos_display_total/
├── __init__.py
├── __manifest__.py
├── README.md
├── controllers/
│   ├── __init__.py
│   └── main.py
├── data/
│   └── config_data.xml
├── models/
│   ├── __init__.py
│   └── pos_config.py
├── static/src/
│   ├── js/
│   │   └── send_button.js
│   └── xml/
│       └── send_button.xml
└── views/
    └── pos_config_views.xml
```

## Dépendances

- `point_of_sale` : Module Point de Vente d'Odoo

## Compatibilité

- Odoo 16.0
- Testé sur Windows

## Gestion des erreurs

Le module gère plusieurs types d'erreurs :
- **Erreurs réseau** : Affiche un popup "Network Error"
- **Erreurs serveur** : Affiche un popup "Error" 
- **Commande vide** : Log un avertissement dans la console

## Configuration de l'API externe

Votre API externe doit :
1. Accepter les requêtes POST sur l'endpoint `/api/receive_order`
2. Accepter le content-type `application/json`
3. Traiter un tableau d'objets produit au format spécifié ci-dessus

Exemple de serveur simple avec Python/Flask :

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/receive_order', methods=['POST'])
def receive_order():
    products = request.get_json()
    print(f"Received products: {products}")
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(host='localhost', port=8086)
```

## Auteur

**Eric** - Développeur du module

## Licence

LGPL-3

## Support

Pour toute question ou problème, veuillez consulter les logs d'Odoo ou contacter l'administrateur système.