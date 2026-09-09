---
slug: site-partenaire
segment: site_partenaire
title: "Accueillir une borne sur mon site"
lead: "Vous apportez l'emplacement, nous apportons tout le reste. Ce formulaire demande ce dont nous avons besoin pour juger un site."
success_message: "Merci. Votre proposition est enregistrée. Nous répondons à chaque site proposé, y compris pour dire non — avec la raison."
endpoint_key: default
cta_label: "Proposer mon site"
fields:
  - { name: site_type, label: "Type de site", type: select, required: true, options: ["Hôtel", "Restaurant", "Centre commercial", "Station-service", "Immeuble de bureaux", "Résidence ou copropriété", "Parking", "Autre"] }
  - { name: site_name, label: "Nom de l'établissement", type: text, required: true }
  - { name: city, label: "Ville", type: city, required: true }
  - { name: address, label: "Adresse ou quartier", type: text, required: true }
  - { name: spaces_available, label: "Places dédiables à la recharge", type: number, required: true, hint: "Des places réservables durablement, pas ponctuellement." }
  - { name: daily_footfall, label: "Véhicules par jour, en moyenne", type: number, required: false, hint: "Une estimation honnête vaut mieux qu'un chiffre flatteur." }
  - { name: dwell_time, label: "Durée de stationnement habituelle", type: select, required: false, options: ["Moins de 30 minutes", "Entre 30 minutes et 2 heures", "Entre 2 heures et une journée", "La nuit ou plusieurs jours"] }
  - { name: available_power, label: "Puissance électrique disponible", type: text, required: false, hint: "Écrivez « inconnue » si vous ne la connaissez pas." }
  - { name: existing_solar, label: "Installation solaire sur le site", type: radio, required: false, options: ["Oui", "Non", "Non, mais il y a de la surface"] }
  - { name: security, label: "Éclairage et surveillance", type: radio, required: false, options: ["Éclairé et surveillé", "Éclairé seulement", "Ni l'un ni l'autre"] }
  - { name: decision_maker, label: "Qui décide pour ce site ?", type: select, required: true, options: ["Je suis propriétaire", "Je suis mandaté par le propriétaire", "Je suis locataire avec un bail long", "La décision revient à une copropriété", "Autre situation"] }
  - { name: name, label: "Nom complet", type: text, required: true }
  - { name: phone, label: "Téléphone ou WhatsApp", type: tel, required: true, placeholder: "+237" }
  - { name: email, label: "Email", type: email, required: false }
  - { name: message, label: "Autre chose à nous dire ?", type: textarea, required: false }
---
