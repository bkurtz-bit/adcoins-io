/* Big Ideas Group — shared behaviour. Copied into each site by build.sh. */
(function () {
  'use strict';

  /* ---- scroll reveal ---------------------------------------------------- */
  var targets = document.querySelectorAll('.reveal');
  var revealAll = function () {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  };

  /* Failsafe: .reveal starts at opacity 0, so anything that stops the observer
     from firing (background tab, print, an odd embedding context) would hide the
     page. Show everything after a short delay no matter what. */
  setTimeout(revealAll, 1500);
  window.addEventListener('beforeprint', revealAll);

  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + 'ms';
      io.observe(el);
    });
  }

  /* ---- mobile nav ------------------------------------------------------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var panel = document.querySelector('[data-nav-panel]');
  if (toggle && panel) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---- contact form ------------------------------------------------------
     Set data-endpoint on the <form> to a Formspree / Railway URL that accepts
     JSON POSTs. Until one is set the form falls back to a mailto: draft so the
     site is never a dead end.
  ------------------------------------------------------------------------- */
  var fallbackTo = 'business@' + location.hostname.replace(/^www\./, '');

  document.querySelectorAll('form[data-contact]').forEach(function (form) {
    var status = form.querySelector('.form__status');
    var say = function (msg, ok) {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form__status ' + (ok ? 'is-ok' : 'is-err');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());
      if (data._gotcha) return;                    // honeypot tripped
      delete data._gotcha;

      var endpoint = form.dataset.endpoint;
      if (!endpoint) {
        var to = form.dataset.mailto || fallbackTo;
        var body = Object.keys(data).map(function (k) {
          return k.replace(/^\w/, function (c) { return c.toUpperCase(); }) + ': ' + data[k];
        }).join('\n');
        window.location.href = 'mailto:' + to +
          '?subject=' + encodeURIComponent(form.dataset.subject || 'Website enquiry') +
          '&body=' + encodeURIComponent(body);
        say('Opening your email client…', true);
        return;
      }

      var btn = form.querySelector('button[type=submit]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.reset();
        say('Thanks — we’ll come back to you within one business day.', true);
      }).catch(function () {
        say('Something went wrong. Email us directly at ' +
            (form.dataset.mailto || fallbackTo) + '.', false);
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      });
    });
  });

  /* ---- current year ------------------------------------------------------ */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
