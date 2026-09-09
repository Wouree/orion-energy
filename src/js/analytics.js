/* ============================================
   ORION Energy — event layer

   A single `orionTrack(name, params)` that pushes to `dataLayer` and, when Google Analytics is
   configured, forwards to gtag. It is safe to call whether or not any analytics id is set: with no id,
   events accumulate in dataLayer and go nowhere, so instrumentation can be written now and switched on
   later without touching the pages again.
   ============================================ */

(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  function track(name, params) {
    var payload = Object.assign({ event: name, page_path: window.location.pathname }, params || {});
    window.dataLayer.push(payload);
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload);
    }
  }

  window.orionTrack = track;

  document.addEventListener('DOMContentLoaded', function () {
    // Which CTA opened which form, and from where.
    document.querySelectorAll('[data-form-type]').forEach(function (el) {
      el.addEventListener('click', function () {
        track('cta_click', {
          form_type: el.dataset.formType,
          cta_text: (el.textContent || '').trim().slice(0, 80)
        });
      });
    });

    document.querySelectorAll('a[href*="wa.me"]').forEach(function (el) {
      el.addEventListener('click', function () {
        track('whatsapp_click', { location: el.classList.contains('whatsapp-float') ? 'float' : 'inline' });
      });
    });

    document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
      el.addEventListener('click', function () { track('phone_click', {}); });
    });
  });
})();
