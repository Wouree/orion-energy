/* ============================================
   ORION Energy — attribution and form provenance

   Every lead should arrive knowing where it came from. This module captures that once, on the first page
   of a visit, and attaches it to whatever form the visitor eventually reaches — which may be several
   pages later, on a different section of the site.

   Captured on landing, kept for the session:
     utm_source, utm_medium, utm_campaign, utm_term, utm_content   from the query string
     referrer                                                      first external referrer only
     landing_page                                                  where the visit started

   Added at submit time, from the page the form is actually on:
     source_page   the current path
     segment       residentiel | entreprise | site_partenaire | support
     language      the page locale
     tool_result   set by a calculator earlier in the visit, if any

   Nothing here is a tracking identifier: no cookie, no fingerprint, no cross-site id. It is sessionStorage
   on this origin, which the browser discards when the tab closes.
   ============================================ */

(function () {
  'use strict';

  var KEY = 'orion.attribution';
  var TOOL_KEY = 'orion.tool_result';
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

  function read(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key) || 'null');
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* private mode, storage disabled — attribution is a nice-to-have, never a blocker */
    }
  }

  /** Capture campaign parameters once per session, on the first page seen. */
  function capture() {
    var existing = read(KEY);
    if (existing) return existing;

    var params = new URLSearchParams(window.location.search);
    var data = { landing_page: window.location.pathname };

    UTM_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) data[k] = v.slice(0, 200);
    });

    // Only an external referrer tells us anything; an internal one is just the previous page.
    if (document.referrer && document.referrer.indexOf(window.location.origin) !== 0) {
      data.referrer = document.referrer.slice(0, 300);
    }

    write(KEY, data);
    return data;
  }

  /** A calculator stores its result so the form that follows can carry it. */
  function setToolResult(value) {
    write(TOOL_KEY, value);
  }

  function meta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.content : '';
  }

  function hidden(form, name, value) {
    if (value === undefined || value === null || value === '') return;
    var existing = form.querySelector('input[type="hidden"][name="' + name + '"]');
    if (existing) {
      existing.value = value;
      return;
    }
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  /** Stamp provenance onto a form immediately before it is read. */
  function stamp(form) {
    var attribution = read(KEY) || {};

    hidden(form, 'source_page', window.location.pathname);
    hidden(form, 'segment', form.dataset.segment || meta('page-segment') || 'support');
    hidden(form, 'language', document.documentElement.lang || 'fr');

    UTM_KEYS.forEach(function (k) {
      hidden(form, k, attribution[k]);
    });
    hidden(form, 'landing_page', attribution.landing_page);
    hidden(form, 'referrer', attribution.referrer);

    var tool = read(TOOL_KEY);
    if (tool) hidden(form, 'tool_result', typeof tool === 'string' ? tool : JSON.stringify(tool));
  }

  capture();

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-orion-form]').forEach(stamp);
  });

  // Exposed so main.js re-stamps just before submit — a modal form's segment depends on which CTA
  // opened it, which is not known at page load.
  window.orionAttribution = { capture: capture, stamp: stamp, setToolResult: setToolResult, read: read };
})();
