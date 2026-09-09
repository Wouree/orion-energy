---
slug: indicateur-revenus-site
label: "Indicateur de revenus — site partenaire"

# Toutes les valeurs ci-dessous sont des HYPOTHÈSES DE TRAVAIL, destinées à être remplacées dès que
# le premier site aura tourné un trimestre. Aucune n'est une donnée confirmée par le client, et aucune
# ne doit être présentée comme une offre.

# Tarif facturé au conducteur. ORION le fixe site par site et ne l'a pas publié.
# Valeur illustrative uniquement — affichée avec le badge « hypothèse ».
default_tariff: 200

# Coût de l'électricité supporté par ORION. 99 FCFA/kWh correspond à la tranche 801–2000 kWh du tarif
# basse tension de l'ARSEL, celle dans laquelle tombe un site équipé d'un point de charge. La tranche
# applicable à un site donné n'est pas confirmée, d'où le badge « hypothèse ».
default_electricity_cost: 99

# Frais d'encaissement, en pourcentage du chiffre d'affaires.
payment_fee_pct: 2

# Un point de charge ne délivre pas sa puissance nominale en continu : pertes, sessions partielles,
# temps de branchement. Facteur prudent.
efficiency_factor: 0.85

# Parts par défaut, par modèle de partage. Ce sont des hypothèses ajustables affichées en fourchette,
# jamais un pourcentage qu'ORION propose.
default_net_share_pct: 30
default_gross_share_pct: 10

# Échéances affichées, dans l'ordre.
milestones:
  - "3ᵉ mois"
  - "6ᵉ mois"
  - "9ᵉ mois"
  - "12ᵉ mois"

# Trajectoires d'utilisation — fourchette basse et haute à chaque échéance.
# Le parc de véhicules électriques au Cameroun est encore restreint : on modélise une montée en charge,
# pas un régime établi. Aucune source externe n'existe pour ces valeurs ; elles sont classées
# « estimation » et la page le dit.
ramps:
  - key: slow
    label: Lent
    milestones:
      - { low: 0.005, high: 0.015 }
      - { low: 0.010, high: 0.030 }
      - { low: 0.020, high: 0.045 }
      - { low: 0.030, high: 0.065 }
  - key: mid
    label: Modéré
    milestones:
      - { low: 0.010, high: 0.025 }
      - { low: 0.020, high: 0.050 }
      - { low: 0.040, high: 0.080 }
      - { low: 0.060, high: 0.120 }
  - key: fast
    label: Rapide
    milestones:
      - { low: 0.015, high: 0.040 }
      - { low: 0.035, high: 0.075 }
      - { low: 0.065, high: 0.125 }
      - { low: 0.100, high: 0.180 }

# Types de site proposés dans le sélecteur.
site_types:
  - { key: forecourt, label: "Station-service" }
  - { key: hotel, label: "Hôtel" }
  - { key: mall, label: "Centre commercial" }
  - { key: office, label: "Immeuble de bureaux" }
  - { key: parking, label: "Parking" }

default_site_type: forecourt
default_ramp: mid
default_share_model: net
default_points: 2
default_hours: 14
default_product: ta-dc-dd60kw
---
