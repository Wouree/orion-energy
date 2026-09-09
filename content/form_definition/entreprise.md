---
slug: entreprise
segment: entreprise
title: "Électrifier une flotte ou équiper un site professionnel"
lead: "Nous commençons par un audit : vos usages réels, votre installation électrique, votre site. Le matériel vient après, pas avant."
success_message: "Merci. Votre demande est enregistrée et notre équipe revient vers vous pour organiser l'audit."
endpoint_key: default
cta_label: "Demander un audit"
fields:
  - { name: company, label: "Entreprise", type: text, required: true }
  - { name: name, label: "Nom complet", type: text, required: true }
  - { name: role, label: "Votre fonction", type: text, required: false }
  - { name: phone, label: "Téléphone ou WhatsApp", type: tel, required: true, placeholder: "+237" }
  - { name: email, label: "Email professionnel", type: email, required: true }
  - { name: city, label: "Ville du site principal", type: city, required: true }
  - { name: sector, label: "Secteur", type: select, required: true, options: ["Flotte d'entreprise", "Hôtellerie ou restauration", "Centre commercial", "Immobilier ou copropriété", "Station-service", "Autre"] }
  - { name: fleet_size, label: "Nombre de véhicules concernés", type: number, required: false, hint: "Laissez vide si le projet ne concerne pas une flotte." }
  - { name: sites, label: "Nombre de sites à équiper", type: number, required: false }
  - { name: available_power, label: "Puissance électrique disponible sur le site", type: text, required: false, hint: "Figure sur votre facture. Écrivez « inconnue » si vous ne l'avez pas sous la main." }
  - { name: timeline, label: "Échéance envisagée", type: select, required: false, options: ["Dès que possible", "Dans les six mois", "Cette année", "Nous nous renseignons"] }
  - { name: message, label: "Décrivez votre projet", type: textarea, required: false }
---
