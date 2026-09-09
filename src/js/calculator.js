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

  /* ---------- 1. Site revenue indicator ---------- */

  /**
   * What a host site could earn, as a band across four horizons.
   *
   * Three framing rules are structural here, not cosmetic:
   *
   *   NEVER A SINGLE FIGURE. Charge point usage in Cameroon cannot be predicted, only observed, so every
   *   output is a low–high band. The mid-point appears as a secondary line, never as the headline.
   *
   *   BOTH SHARE MODELS STAY VISIBLE. Selecting one does not hide the other's figure — the host is
   *   choosing between two trade-offs and needs to see both to choose.
   *
   *   THE SPLIT IS AN ADJUSTABLE HYPOTHESIS, NOT AN OFFER. The percentages are inputs the visitor can
   *   move, displayed as a band and stamped "ne constitue ni une offre ni un engagement de revenus".
   *   ORION has not published a revenue share; nothing here may read as one.
   *
   * All numbers come from the calculator_assumptions collection via the JSON config block.
   */

  function fmt(n) {
    if (!isFinite(n)) return '—';
    return Math.round(n).toLocaleString('fr-FR').replace(/\u202F|\u00A0|,/g, ' ');
  }

  function pctLabel(n) {
    return (n * 100).toFixed(1).replace('.', ',') + ' %';
  }

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  FORMULAS.siteRevenue = function (v, form, config) {
    if (!config) {
      return {
        html: '<div class="form-error" role="alert">Les hypothèses de calcul n\u2019ont pas pu être chargées. ' +
              'Rien n\u2019est affiché plutôt qu\u2019un chiffre calculé sur des valeurs par défaut.</div>'
      };
    }

    var mode = (form.querySelector('[name="share_model"]:checked') || {}).value || config.default_share_model || 'net';
    var paceKey = (form.querySelector('[name="pace"]:checked') || {}).value || config.default_ramp || 'mid';
    var ramp = (config.ramps || []).filter(function (r) { return r.key === paceKey; })[0] || config.ramps[0];

    var siteSelect = form.querySelector('[name="site_type"]');
    var siteKey = siteSelect ? siteSelect.value : config.default_site_type;
    var siteLabel = ((config.site_types || []).filter(function (t) { return t.key === siteKey; })[0] || {}).label || '';

    var productSelect = form.querySelector('[name="product"]');
    var kw = productSelect ? parseFloat(productSelect.value) || 0 : 0;
    var productLabel = productSelect ? productSelect.options[productSelect.selectedIndex].dataset.model || '' : '';

    var i = {
      points: Math.max(1, v.points || 1),
      hours: Math.max(1, v.hours || 1),
      kw: kw,
      tariff: Math.max(0, v.tariff || 0),
      cost: Math.max(0, v.electricity_cost || 0),
      fees: Math.max(0, v.payment_fee || 0) / 100,
      netShare: Math.max(0, v.net_share || 0) / 100,
      grossShare: Math.max(0, v.gross_share || 0) / 100
    };

    var efficiency = config.efficiency_factor;

    function model(util) {
      var kwh = i.points * i.kw * i.hours * 30 * util * efficiency;
      var revenue = kwh * i.tariff;
      var energy = kwh * i.cost;
      var fees = revenue * i.fees;
      var net = revenue - energy - fees;
      return {
        kwh: kwh,
        revenue: revenue,
        net: net,
        hostNet: Math.max(0, net * i.netShare),
        hostGross: revenue * i.grossShare
      };
    }

    var hostValue = function (r) { return mode === 'net' ? r.hostNet : r.hostGross; };
    var months = config.milestones || [];

    /* --- one card per horizon, always a band --- */
    var cards = '', rows = '';
    ramp.milestones.forEach(function (u, k) {
      var lo = model(u.low), hi = model(u.high);
      var vLo = hostValue(lo), vHi = hostValue(hi);
      var mid = (vLo + vHi) / 2;

      cards +=
        '<div class="rev-card">' +
          '<div class="rev-card-when">' + esc(months[k] || '') + '</div>' +
          '<div class="rev-card-band">' + fmt(vLo) + ' – ' + fmt(vHi) +
            '<span class="rev-card-unit">FCFA par mois</span></div>' +
          '<div class="rev-card-mid">Milieu de fourchette <b>' + fmt(mid) + ' FCFA</b></div>' +
          '<div class="rev-card-util">Utilisation ' + pctLabel(u.low) + ' à ' + pctLabel(u.high) + '</div>' +
        '</div>';

      rows +=
        '<tr><td><b>' + esc(months[k] || '') + '</b></td>' +
        '<td>' + pctLabel(u.low) + ' – ' + pctLabel(u.high) + '</td>' +
        '<td>' + fmt(lo.kwh) + ' – ' + fmt(hi.kwh) + ' kWh</td>' +
        '<td>' + fmt(lo.revenue) + ' – ' + fmt(hi.revenue) + '</td>' +
        '<td>' + fmt(lo.net) + ' – ' + fmt(hi.net) + '</td>' +
        '<td><b>' + fmt(vLo) + ' – ' + fmt(vHi) + '</b></td></tr>';
    });

    /* --- both models at the final horizon; the unselected one keeps showing its figure --- */
    var last = ramp.milestones[ramp.milestones.length - 1];
    var lastLabel = months[months.length - 1] || '';
    var lLast = model(last.low), hLast = model(last.high);

    var comparison =
      '<div class="rev-models">' +
        '<div class="rev-model' + (mode === 'net' ? ' is-selected' : '') + '">' +
          '<h4>Partage du net</h4>' +
          '<p class="rev-model-value">' + fmt(lLast.hostNet) + ' – ' + fmt(hLast.hostNet) +
            ' <span>FCFA / mois au ' + esc(lastLabel) + '</span></p>' +
          '<p class="rev-model-note">Électricité et frais déduits, puis partage. La part du site suit la rentabilité réelle de la borne.</p>' +
        '</div>' +
        '<div class="rev-model' + (mode === 'gross' ? ' is-selected' : '') + '">' +
          '<h4>Partage du brut</h4>' +
          '<p class="rev-model-value">' + fmt(lLast.hostGross) + ' – ' + fmt(hLast.hostGross) +
            ' <span>FCFA / mois au ' + esc(lastLabel) + '</span></p>' +
          '<p class="rev-model-note">Part calculée sur l\u2019encaissement total. Plus simple à vérifier : le site n\u2019a aucun coût à suivre.</p>' +
        '</div>' +
      '</div>';

    var context =
      i.points + ' point' + (i.points > 1 ? 's' : '') + ' de charge de ' + i.kw + ' kW, ' +
      (siteLabel ? siteLabel.toLowerCase() + ' ' : '') + 'ouvert ' + i.hours + ' h par jour · rythme d\u2019adoption ' +
      String(ramp.label).toLowerCase() + '.';

    /* --- assumptions, rendered from the collection and printed with the leave-behind --- */
    var share = mode === 'net'
      ? 'partage du résultat net, ' + (i.netShare * 100) + ' % pour le site'
      : 'partage du chiffre d\u2019affaires, ' + (i.grossShare * 100) + ' % pour le site';

    var assumptions =
      '<li>' + i.points + ' point(s) de charge de ' + i.kw + ' kW' + (productLabel ? ' (' + esc(productLabel) + ')' : '') +
        ', ' + i.hours + ' heures d\u2019ouverture par jour, 30 jours par mois.</li>' +
      '<li>Tarif facturé au conducteur : ' + fmt(i.tariff) + ' FCFA/kWh. <b>Hypothèse de travail</b>, à confirmer par ORION.</li>' +
      '<li>Coût de l\u2019électricité : ' + fmt(i.cost) + ' FCFA/kWh, supporté par ORION. <b>Hypothèse de travail</b>, à confirmer sur la base du tarif applicable au site.</li>' +
      '<li>Frais d\u2019encaissement : ' + String(i.fees * 100).replace('.', ',') + ' % du chiffre d\u2019affaires.</li>' +
      '<li>Modèle de partage : ' + share + '.</li>' +
      '<li>Rendement retenu : ' + (efficiency * 100) + ' % de la puissance nominale, pour tenir compte des sessions partielles et des pertes.</li>' +
      '<li>Trajectoire d\u2019utilisation « ' + String(ramp.label).toLowerCase() + ' » : de ' +
        pctLabel(ramp.milestones[0].low) + '–' + pctLabel(ramp.milestones[0].high) + ' au ' + esc(months[0] || '') + ' à ' +
        pctLabel(last.low) + '–' + pctLabel(last.high) + ' au ' + esc(lastLabel) + '. ' +
        'Aucune source externe : le parc de véhicules électriques au Cameroun est trop restreint pour que ce taux soit observable.</li>' +
      '<li>ORION prend en charge le matériel, le génie civil, le raccordement, l\u2019électricité consommée, la maintenance, ' +
        'l\u2019assurance et la signalétique. Le site met l\u2019emplacement à disposition.</li>';

    var stamp =
      'Simulation établie le ' +
      new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) +
      ' · ORION Energy · Document de travail — ne constitue ni une offre ni un engagement de revenus.';

    var html =
      '<p class="rev-context">' + esc(context) + '</p>' +
      '<div class="rev-cards">' + cards + '</div>' +
      comparison +
      '<div class="rev-detail">' +
        '<h3>Détail du modèle</h3>' +
        '<p>Fourchette basse et haute à chaque échéance.</p>' +
        '<div class="data-table-wrap"><table class="data-table"><thead><tr>' +
          '<th scope="col">Échéance</th><th scope="col">Taux d\u2019utilisation</th><th scope="col">Énergie livrée</th>' +
          '<th scope="col">Chiffre d\u2019affaires</th><th scope="col">Résultat net</th><th scope="col">Part du site</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '</div>' +
      '<div class="rev-assumptions"><h3>Hypothèses retenues</h3><ul>' + assumptions + '</ul></div>' +
      '<p class="rev-stamp">' + esc(stamp) + '</p>';

    return {
      html: html,
      // Carried into the next form as tool_result, so a lead arrives with the scenario the host ran.
      headline: fmt(hostValue(model(last.low))) + ' – ' + fmt(hostValue(model(last.high))) + ' FCFA'
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

  /**
   * A calculator may return `html` instead of the headline/rows pair when its output does not fit that
   * shape — the revenue indicator renders four milestone cards, a two-model comparison and a detail
   * table. This is additive: a formula that returns no `html` takes the original path unchanged, which
   * is what the other three calculators do.
   */
  function render(panel, result) {
    if (result.html) {
      panel.innerHTML = result.html;
      return;
    }

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

  /**
   * Assumptions reach a formula from the content collection, serialised into a JSON block beside the
   * form. Nothing numeric is hardcoded here: change the Markdown file and the maths changes.
   */
  function configFor(name) {
    var el = document.querySelector('[data-calculator-config="' + name + '"]');
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      return null;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-calculator]').forEach(function (form) {
      var name = form.dataset.calculator;
      var formula = FORMULAS[name];
      if (!formula) return;
      var config = configFor(name);

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

        var result = formula(values, form, config);
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
