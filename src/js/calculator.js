/* ============================================
   ORION Energy — calculator shell

   One engine behind all three tools. A calculator page declares its inputs in HTML and names a formula;
   this module reads the inputs, runs the formula, and renders the result.

   Three rules are built into the shell rather than left to each page.

   1. EVERY ASSUMPTION IS AN INPUT. Tariffs, fuel prices, consumption figures — all of them are editable
      fields with sourced, dated defaults, never constants buried in the code. A visitor who thinks our
      electricity tariff is out of date can change it and see the answer move. This is deliberate: it is
      more honest than a supplier-chosen number, and it means the calculators shipped without waiting on
      client data.

   2. THE ASSUMPTIONS ARE VISIBLE WITH THE RESULT. The panel restates what the number was computed from,
      so a figure can never be screenshotted away from the assumptions that produced it.

   3. THE RESULT IS AN ESTIMATE AND SAYS SO. No output of these tools is presented as a quotation.
      ============================================ */

(function () {
  'use strict';

  var FORMULAS = {};

  /* ---------- helpers ---------- */

  function num(el) {
    var v = parseFloat(String(el.value).replace(',', '.'));
    return isNaN(v) ? 0 : v;
  }

  function fcfa(n) {
    if (!isFinite(n)) return '—';
    return Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' FCFA';
  }

  function hours(n) {
    if (!isFinite(n) || n <= 0) return '—';
    var h = Math.floor(n);
    var m = Math.round((n - h) * 60);
    if (m === 60) { h += 1; m = 0; }
    return h + ' h' + (m ? ' ' + String(m).padStart(2, '0') : '');
  }

  /* ---------- 1. Site revenue ---------- */

  FORMULAS.siteRevenue = function (v) {
    var kwhPerDay = v.sessions_per_day * v.kwh_per_session;
    var kwhPerMonth = kwhPerDay * 30;
    var grossPerMonth = kwhPerMonth * v.charging_tariff;
    var energyCostPerMonth = kwhPerMonth * v.electricity_tariff;
    var marginPerMonth = grossPerMonth - energyCostPerMonth;

    return {
      headline: v.charging_tariff > 0 ? fcfa(marginPerMonth) : '—',
      headlineLabel: 'Marge mensuelle brute, avant partage',
      rows: [
        ['Énergie délivrée', Math.round(kwhPerMonth).toLocaleString('fr-FR') + ' kWh par mois'],
        ['Chiffre d’affaires de la borne', v.charging_tariff > 0 ? fcfa(grossPerMonth) : '—'],
        ['Coût de l’électricité consommée', fcfa(energyCostPerMonth)],
        ['Marge avant partage', v.charging_tariff > 0 ? fcfa(marginPerMonth) : '—']
      ],
      caveat:
        v.charging_tariff > 0
          ? 'Ce montant est la marge <strong>avant</strong> partage entre ORION et le site. La part qui revient au site hôte est une clause du contrat, et elle n’est pas publiée sur ce site — nous ne l’inventerons pas ici. Ce calculateur vous donne la taille du gâteau, pas votre part.'
          : 'Renseignez un tarif de recharge pour obtenir un chiffre d’affaires. Nous n’en proposons pas par défaut : le tarif est fixé par ORION site par site et n’est pas encore publié.'
    };
  };

  /* ---------- 2. Fleet total cost of ownership ---------- */

  FORMULAS.fleetTco = function (v) {
    var totalKm = v.vehicles * v.km_per_vehicle_year;

    var litres = (totalKm / 100) * v.fuel_consumption;
    var fuelCost = litres * v.fuel_price;

    var kwh = (totalKm / 100) * v.ev_consumption;
    var elecCost = kwh * v.electricity_tariff;

    var saving = fuelCost - elecCost;

    return {
      headline: fcfa(saving),
      headlineLabel: saving >= 0
        ? 'Écart annuel sur l’énergie, en faveur de l’électrique'
        : 'Écart annuel sur l’énergie, en faveur du thermique',
      rows: [
        ['Kilométrage total de la flotte', Math.round(totalKm).toLocaleString('fr-FR') + ' km par an'],
        ['Carburant consommé', Math.round(litres).toLocaleString('fr-FR') + ' L par an'],
        ['Coût du carburant', fcfa(fuelCost)],
        ['Électricité consommée', Math.round(kwh).toLocaleString('fr-FR') + ' kWh par an'],
        ['Coût de l’électricité', fcfa(elecCost)],
        ['Écart annuel', fcfa(saving)]
      ],
      caveat:
        'Ce calcul porte <strong>uniquement sur l’énergie</strong>. Il ne comprend ni l’achat des véhicules, ni l’installation des bornes, ni l’entretien, ni l’assurance, ni la revente. Un coût total de possession complet les intègre — c’est ce que fait notre audit, sur vos données. Le résultat ci-dessus n’est donc pas une économie nette : c’est un seul terme de l’équation, celui qu’on peut calculer sans venir sur place.'
    };
  };

  /* ---------- 3. Home readiness ---------- */

  FORMULAS.homeReadiness = function (v, form) {
    var accepted = Math.min(v.vehicle_ac_kw || 7, 7);
    var chargeTime = accepted > 0 ? v.battery_kwh / accepted : 0;
    var dailyKwh = (v.daily_km / 100) * v.ev_consumption;
    var dailyTime = accepted > 0 ? dailyKwh / accepted : 0;
    var dailyCost = dailyKwh * v.electricity_tariff;

    var blockers = [];
    var notes = [];

    var earthing = form.querySelector('[name="earthing"]:checked');
    var parking = form.querySelector('[name="parking"]:checked');

    if (parking && parking.value === 'non') {
      blockers.push('Sans place de stationnement à vous, la recharge à domicile n’est pas possible. Il faudra compter sur la recharge publique ou sur votre lieu de travail.');
    }
    if (earthing && earthing.value === 'non') {
      blockers.push('Sans mise à la terre, aucune borne ne peut être posée. C’est le premier chantier, et il est indépendant du véhicule. Nous mesurons et reprenons la terre si nécessaire.');
    }
    if (earthing && earthing.value === 'inconnu') {
      notes.push('Vous ne savez pas si vous avez une terre : c’est le cas le plus fréquent, et c’est la première chose que mesure la visite d’évaluation.');
    }
    if (v.vehicle_ac_kw > 7) {
      notes.push('Votre véhicule accepte plus de 7 kW en courant alternatif, mais notre modèle résidentiel est limité à 7 kW. Une puissance supérieure suppose une alimentation triphasée et relève d’une étude à part.');
    }
    if (v.subscribed_kw > 0 && v.subscribed_kw < accepted + 2) {
      notes.push('Votre puissance souscrite laisse peu de marge une fois la borne en charge. C’est gérable en rechargeant la nuit, mais il faut le vérifier.');
    }
    if (dailyTime > v.hours_available && v.hours_available > 0) {
      notes.push('Votre besoin quotidien dépasse la fenêtre de recharge que vous avez indiquée. Une puissance supérieure ou une fenêtre plus longue sera nécessaire.');
    }

    return {
      headline: hours(dailyTime),
      headlineLabel: 'Temps de recharge nécessaire pour votre usage quotidien',
      rows: [
        ['Puissance de recharge retenue', accepted + ' kW'],
        ['Énergie consommée par jour', (Math.round(dailyKwh * 10) / 10).toLocaleString('fr-FR') + ' kWh'],
        ['Temps de recharge quotidien', hours(dailyTime)],
        ['Recharge complète, batterie vide', hours(chargeTime)],
        ['Coût quotidien de l’électricité', fcfa(dailyCost)],
        ['Coût mensuel estimé', fcfa(dailyCost * 30)]
      ],
      blockers: blockers,
      notes: notes,
      caveat:
        'Ce calcul suppose une recharge en courant alternatif sur notre borne murale de 7 kW. Il ne dit rien de l’état de votre installation : c’est la visite d’évaluation qui mesure la terre, relève votre puissance disponible et détermine le trajet du câble.'
    };
  };

  /* ---------- rendering ---------- */

  function render(panel, result) {
    var html = '';

    if (result.blockers && result.blockers.length) {
      html += '<div class="form-error" role="alert"><strong>À régler avant toute installation</strong><ul style="margin:8px 0 0;padding-left:20px;">';
      result.blockers.forEach(function (b) { html += '<li>' + b + '</li>'; });
      html += '</ul></div>';
    }

    html += '<div class="calc-headline"><span class="calc-headline-value">' + result.headline + '</span>';
    html += '<span class="calc-headline-label">' + result.headlineLabel + '</span></div>';

    html += '<div class="data-table-wrap"><table class="data-table"><tbody>';
    result.rows.forEach(function (r) {
      html += '<tr><td>' + r[0] + '</td><td><strong>' + r[1] + '</strong></td></tr>';
    });
    html += '</tbody></table></div>';

    if (result.notes && result.notes.length) {
      html += '<div class="notice"><strong>À noter</strong><ul style="margin:8px 0 0;padding-left:20px;">';
      result.notes.forEach(function (n) { html += '<li>' + n + '</li>'; });
      html += '</ul></div>';
    }

    html += '<p class="calc-caveat">' + result.caveat + '</p>';
    panel.innerHTML = html;
  }

  /** Restate the assumptions beside the result, so a figure cannot be read without them. */
  function renderAssumptions(form, target) {
    var items = [];
    form.querySelectorAll('[data-assumption]').forEach(function (el) {
      var label = el.dataset.assumption;
      var value = el.value;
      var unit = el.dataset.unit || '';
      var source = el.dataset.source || '';
      items.push(
        '<li><strong>' + label + '</strong> : ' + value + ' ' + unit +
        (source ? ' <span class="claim-cite" style="display:inline;">— ' + source + '</span>' : '') +
        '</li>'
      );
    });
    target.innerHTML = items.length
      ? '<h3>Hypothèses retenues</h3><ul>' + items.join('') + '</ul>' +
        '<p class="field-hint">Toutes ces valeurs sont modifiables ci-dessus. Elles sont des points de départ documentés, pas des constantes.</p>'
      : '';
  }

  /* ---------- wiring ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-calculator]').forEach(function (form) {
      var name = form.dataset.calculator;
      var formula = FORMULAS[name];
      if (!formula) return;

      // The result panel sits in a sibling column, not inside the form's own panel, so scope the lookup
      // to the shared layout container rather than to the form's parent.
      var scope = form.closest('.calc-layout') || document;
      var panel = scope.querySelector('[data-calculator-result]');
      var assumptions = scope.querySelector('[data-calculator-assumptions]');
      var cta = scope.querySelector('[data-calculator-cta]');

      if (!panel) return;

      function run() {
        var values = {};
        form.querySelectorAll('input[type="number"], input[type="text"]').forEach(function (el) {
          if (el.name) values[el.name] = num(el);
        });

        var result = formula(values, form);
        render(panel, result);
        if (assumptions) renderAssumptions(form, assumptions);
        if (cta) cta.hidden = false;

        // Carry the result into whichever form the visitor reaches next.
        if (window.orionAttribution) {
          window.orionAttribution.setToolResult({
            tool: name,
            headline: result.headline,
            inputs: values
          });
        }
        if (window.orionTrack) window.orionTrack('calculator_run', { tool: name });
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        run();
      });
      form.addEventListener('input', function () {
        if (panel && panel.innerHTML.trim()) run();
      });
    });
  });
})();
