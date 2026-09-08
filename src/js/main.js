/* ============================================
   ORION Energy — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Navigation ---
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });
    // Close on link click
    links.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }

  // Nav scroll effect
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // --- Modal System ---
  const modalOverlay = document.getElementById('formModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalForm = document.getElementById('modalForm');

  const formConfigs = {
    visite: {
      title: 'Réserver une visite à domicile',
      fields: ['name', 'phone', 'whatsapp', 'email', 'city', 'address', 'property', 'ev', 'date', 'time', 'message']
    },
    rappel: {
      title: 'Demander un rappel',
      fields: ['name', 'phone', 'day', 'timeslot', 'topic']
    },
    devis: {
      title: 'Demander un devis commercial',
      fields: ['name', 'company', 'phone', 'email', 'fleet', 'message']
    },
    contact: {
      title: 'Nous contacter',
      fields: ['name', 'phone', 'email', 'subject', 'message']
    },
    partenaire: {
      title: 'Devenir partenaire',
      fields: ['name', 'company', 'phone', 'email', 'location', 'premises', 'message']
    }
  };

  function openModal(formType) {
    if (!modalOverlay || !modalForm) return;
    const config = formConfigs[formType];
    if (!config) return;

    modalTitle.textContent = config.title;
    modalForm.querySelector('input[name="form_type"]').value = formType;

    // Show/hide fields
    modalForm.querySelectorAll('[data-field]').forEach(el => {
      el.classList.toggle('hidden', !config.fields.includes(el.dataset.field));
    });

    // Set date constraints for visite
    if (formType === 'visite') {
      setupDatePicker();
    }

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    if (modalForm) {
      modalForm.reset();
      // Reset success state
      const successEl = modalForm.querySelector('.form-success');
      if (successEl) successEl.remove();
      modalForm.querySelectorAll('.form-group, .form-row, .btn').forEach(el => el.style.display = '');
    }
  }

  // CTA button listeners
  document.querySelectorAll('[data-form-type]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn.dataset.formType);
    });
  });

  // Close modal
  document.querySelectorAll('.modal-close').forEach(el => {
    el.addEventListener('click', () => closeModal());
  });
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  /**
   * Field-level validation message. Replaces two blocking alert() calls (D-08): a modal dialog is the
   * wrong instrument for "that day is not available", and it freezes any browser-automation run.
   */
  function setFieldNotice(input, message) {
    let notice = input.parentElement?.querySelector('.field-notice');
    if (!message) {
      if (notice) notice.remove();
      input.removeAttribute('aria-invalid');
      return;
    }
    if (!notice) {
      notice = document.createElement('p');
      notice.className = 'field-notice';
      notice.setAttribute('role', 'status');
      input.parentElement?.appendChild(notice);
    }
    notice.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  // --- Date Picker (Tue-Sat, 48h advance) ---
  function setupDatePicker() {
    const dateInput = modalForm?.querySelector('input[name="preferred_date"]');
    if (!dateInput) return;

    const now = new Date();
    const minDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Find next Tue-Sat
    while (![2,3,4,5,6].includes(minDate.getDay())) {
      minDate.setDate(minDate.getDate() + 1);
    }

    const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    dateInput.min = formatDate(minDate);
    dateInput.max = formatDate(maxDate);
    dateInput.value = formatDate(minDate);

    dateInput.addEventListener('input', () => {
      const selected = new Date(dateInput.value + 'T12:00:00');
      const day = selected.getDay();
      if (![2,3,4,5,6].includes(day)) {
        dateInput.value = formatDate(minDate);
        setFieldNotice(dateInput, 'Les visites ont lieu du mardi au samedi. Nous avons sélectionné la prochaine date disponible.');
      } else {
        setFieldNotice(dateInput, '');
      }
    });
  }

  function formatDate(d) {
    return d.toISOString().split('T')[0];
  }

  // Also set up date picker for inline forms
  document.querySelectorAll('.inline-date-picker').forEach(input => {
    const now = new Date();
    const minDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    while (![2,3,4,5,6].includes(minDate.getDay())) {
      minDate.setDate(minDate.getDate() + 1);
    }
    const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    input.min = formatDate(minDate);
    input.max = formatDate(maxDate);
    input.value = formatDate(minDate);
    input.addEventListener('input', () => {
      const selected = new Date(input.value + 'T12:00:00');
      if (![2,3,4,5,6].includes(selected.getDay())) {
        input.value = formatDate(minDate);
        setFieldNotice(input, 'Les visites ont lieu du mardi au samedi. Nous avons sélectionné la prochaine date disponible.');
      } else {
        setFieldNotice(input, '');
      }
    });
  });

  /* ============================================
     Form submission

     Two rules govern this whole section.

     1. Google Apps Script ALWAYS returns HTTP 200 — including when it failed. `response.ok` is therefore
        meaningless here and must never be the success test. The only truth is `result.ok` in the parsed
        JSON body. The previous implementation posted with `mode: 'no-cors'`, which makes the response
        opaque and `result.ok` unreadable by construction, then called the success handler unconditionally.
        Every failed submission was reported to the user as sent.

     2. A form that cannot submit says so. When no endpoint is configured, the previous code showed the
        success message and discarded the submission — so every form on the live site was a no-op that
        thanked the user for a request nobody received. It now shows an error and a WhatsApp fallback that
        actually reaches someone.

     The POST is sent as text/plain so the browser issues no CORS preflight — Apps Script does not answer
     OPTIONS. The body is still JSON; only the Content-Type differs.
     ============================================ */

  const WHATSAPP_NUMBER = document.querySelector('meta[name="whatsapp-number"]')?.content || '';

  function whatsappFallbackLink(text) {
    if (!WHATSAPP_NUMBER) return '';
    return `<a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">WhatsApp</a>`;
  }

  async function handleSubmit(form) {
    const data = Object.fromEntries(new FormData(form));
    const endpoint = document.querySelector('meta[name="form-endpoint"]')?.content;

    clearFormError(form);

    if (!endpoint) {
      // Not configured. Say so plainly rather than pretending the request went somewhere.
      showFormError(
        form,
        "Le formulaire n'est pas encore relié à notre système d'enregistrement. " +
          'Votre message ne serait pas reçu. Écrivez-nous directement — ' +
          (whatsappFallbackLink(
            'Bonjour ORION Energy, je souhaite vous joindre (le formulaire du site est indisponible).'
          ) || 'par email') +
          ' — nous vous répondrons.'
      );
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.textContent = 'Envoi en cours…';
      submitBtn.disabled = true;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        // text/plain avoids a CORS preflight; Apps Script does not answer OPTIONS.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });

      // Apps Script answers 200 even on failure, so response.ok proves nothing. Read the body.
      let result;
      try {
        result = JSON.parse(await response.text());
      } catch (parseError) {
        throw new Error('reponse-illisible');
      }

      if (!result || result.ok !== true) {
        throw new Error(result && result.error ? result.error : 'echec-enregistrement');
      }

      showFormSuccess(form);
    } catch (err) {
      showFormError(
        form,
        "Votre demande n'a pas pu être enregistrée. Réessayez dans un instant, ou écrivez-nous sur " +
          (whatsappFallbackLink(
            'Bonjour ORION Energy, je n’ai pas réussi à envoyer le formulaire du site.'
          ) || 'WhatsApp') +
          '.'
      );
    } finally {
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    }
  }

  function showFormSuccess(form) {
    form.querySelectorAll('.form-group, .form-row, button[type="submit"], [data-field]')
      .forEach(el => { el.style.display = 'none'; });

    const success = document.createElement('div');
    success.className = 'form-success';
    success.setAttribute('role', 'status');
    // No response-time figure. The client's commitment is under review and no number may be published.
    success.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <h3>Demande envoyée</h3>
      <p>Merci. Votre demande est bien enregistrée et notre équipe revient vers vous.</p>
    `;
    form.appendChild(success);
  }

  function showFormError(form, html) {
    clearFormError(form);
    const error = document.createElement('div');
    error.className = 'form-error';
    error.setAttribute('role', 'alert');
    error.innerHTML = html;
    form.appendChild(error);
    error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearFormError(form) {
    const existing = form.querySelector('.form-error');
    if (existing) existing.remove();
  }

  // Bind all forms
  document.querySelectorAll('[data-orion-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(form);
    });
  });

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.classList.contains('open');

      // Close all others
      document.querySelectorAll('.faq-question.open').forEach(other => {
        if (other !== btn) {
          other.classList.remove('open');
          other.nextElementSibling.style.maxHeight = null;
        }
      });

      btn.classList.toggle('open', !isOpen);
      answer.style.maxHeight = isOpen ? null : answer.scrollHeight + 'px';
    });
  });

  // --- Scroll Animations ---
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate').forEach(el => observer.observe(el));

});
