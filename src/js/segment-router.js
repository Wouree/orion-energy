/* ============================================
   ORION Energy — segment router

   The homepage asks one question — are you a household, a business, a site owner, or an existing
   customer — and remembers the answer for the session.

   The answer then travels as a hidden `segment` field into whichever form the visitor eventually reaches,
   which may be several pages and several minutes later. A lead that arrives knowing which funnel it came
   from is worth considerably more than one that arrives labelled "contact".

   The cards are ordinary links, so they work with JavaScript disabled and behave correctly on a
   middle-click. The routing is the enhancement, not the mechanism.
   ============================================ */

(function () {
  'use strict';

  var KEY = 'orion.segment';

  function remember(segment) {
    if (!segment) return;
    try {
      sessionStorage.setItem(KEY, segment);
    } catch (e) {
      /* storage unavailable — the link still works, only the memory is lost */
    }
  }

  function recall() {
    try {
      return sessionStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var chosen = recall();

    document.querySelectorAll('[data-segment-router] [data-segment]').forEach(function (card) {
      // Show what was chosen earlier in the session.
      if (chosen && card.dataset.segment === chosen) {
        card.setAttribute('aria-current', 'true');
      }

      card.addEventListener('click', function () {
        remember(card.dataset.segment);
        if (window.orionTrack) {
          window.orionTrack('segment_selected', { segment: card.dataset.segment });
        }
      });
    });

    // A form page states its own segment; that is authoritative and also updates the memory, so a
    // visitor who navigated straight to a form is routed consistently from then on.
    var form = document.querySelector('[data-orion-form][data-segment]');
    if (form && form.dataset.segment) remember(form.dataset.segment);
  });

  // Read by attribution.js when stamping a form that does not declare its own segment.
  window.orionSegment = { get: recall, set: remember };
})();
