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
        alert('Veuillez choisir un jour du mardi au samedi.');
        dateInput.value = formatDate(minDate);
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
        alert('Veuillez choisir un jour du mardi au samedi.');
        input.value = formatDate(minDate);
      }
    });
  });

  // --- Form Submission ---
  async function handleSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const endpoint = document.querySelector('meta[name="form-endpoint"]')?.content;

    if (!endpoint || endpoint === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      showFormSuccess(form);
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Envoi en cours...';
    submitBtn.disabled = true;

    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      showFormSuccess(form);
    } catch (err) {
      alert('Une erreur est survenue. Veuillez réessayer ou nous contacter par téléphone.');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  function showFormSuccess(form) {
    const groups = form.querySelectorAll('.form-group, .form-row, button[type="submit"], [data-field]');
    groups.forEach(el => el.style.display = 'none');

    const success = document.createElement('div');
    success.className = 'form-success';
    success.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#598435" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <h3>Demande envoyée !</h3>
      <p>Merci pour votre confiance. Notre équipe vous contactera sous 24 heures.</p>
    `;
    form.appendChild(success);
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
