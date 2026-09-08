---
slug: support
segment: support
title: "Une question, ou un problème sur une installation"
lead: "Décrivez le symptôme aussi précisément que possible. Une partie des cas se règlent par un diagnostic à distance."
success_message: "Merci. Votre message est enregistré et notre équipe technique le prend en charge."
endpoint_key: default
cta_label: "Envoyer ma demande"
fields:
  - { name: name, label: "Nom complet", type: text, required: true }
  - { name: phone, label: "Téléphone ou WhatsApp", type: tel, required: true, placeholder: "+237" }
  - { name: email, label: "Email", type: email, required: false }
  - { name: subject, label: "Objet", type: select, required: true, options: ["Panne ou dysfonctionnement", "Question sur ma garantie", "Question avant achat", "Maintenance préventive", "Autre"] }
  - { name: existing_customer, label: "Êtes-vous déjà client ?", type: radio, required: false, options: ["Oui", "Non"] }
  - { name: install_city, label: "Ville de l'installation", type: city, required: false }
  - { name: symptom, label: "Décrivez le symptôme", type: textarea, required: true, hint: "Que fait la borne, que font ses voyants, depuis quand, et dans quelles circonstances." }
---
