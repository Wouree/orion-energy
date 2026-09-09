---
slug: residentiel
segment: residentiel
title: "Installer une borne chez moi"
lead: "Une visite d'évaluation gratuite, chez vous, avant tout devis. Elle mesure votre mise à la terre, relève votre puissance disponible et détermine le trajet du câble."
success_message: "Merci. Votre demande est enregistrée et notre équipe revient vers vous pour convenir d'un rendez-vous."
endpoint_key: default
cta_label: "Demander une visite"
fields:
  - { name: name, label: "Nom complet", type: text, required: true }
  - { name: phone, label: "Téléphone ou WhatsApp", type: tel, required: true, placeholder: "+237" }
  - { name: email, label: "Email", type: email, required: false }
  - { name: city, label: "Ville", type: city, required: true }
  - { name: address, label: "Quartier ou adresse", type: text, required: true, hint: "Assez précis pour organiser le déplacement." }
  - { name: property_type, label: "Type de logement", type: select, required: true, options: ["Maison individuelle", "Appartement en copropriété", "Villa avec cour", "Autre"] }
  - { name: parking, label: "Disposez-vous d'une place de stationnement à vous ?", type: radio, required: true, options: ["Oui, privative", "Oui, en copropriété", "Non, stationnement dans la rue"] }
  - { name: vehicle, label: "Véhicule électrique", type: select, required: false, options: ["J'en ai déjà un", "Je compte en acheter un", "Je me renseigne"] }
  - { name: vehicle_model, label: "Marque et modèle, si vous le connaissez", type: text, required: false, hint: "Nous vérifions le connecteur avant tout engagement." }
  - { name: earthing, label: "Savez-vous si votre installation a une mise à la terre ?", type: radio, required: false, options: ["Oui", "Non", "Je ne sais pas"] }
  - { name: message, label: "Autre chose à nous dire ?", type: textarea, required: false }
---
