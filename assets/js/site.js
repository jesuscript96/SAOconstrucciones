/* Cimbra · interacción del sitio. Sin dependencias. */
(function () {
  'use strict';
  const doc = document.documentElement;
  doc.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Cabecera con sombra al hacer scroll ── */
  const hdr = $('.hdr');
  const onScroll = () => { if (hdr) hdr.classList.toggle('solid', window.scrollY > 40); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── Menú móvil ── */
  const mb = $('.menu-btn');
  if (mb) {
    mb.addEventListener('click', () => {
      const open = doc.classList.toggle('menu-open');
      mb.setAttribute('aria-expanded', String(open));
    });
    $$('.nav a').forEach((a) => a.addEventListener('click', () => { doc.classList.remove('menu-open'); mb.setAttribute('aria-expanded', 'false'); }));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && doc.classList.contains('menu-open')) mb.click(); });
  }

  /* ── Revelado al entrar en pantalla ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      if (en.target.classList.contains('chain')) en.target.classList.add('lit');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  $$('.rv, .gantt, .chain').forEach((el) => io.observe(el));

  /* ── Cifras que cuentan ── */
  const fmt = (n, dec) => { const [i, d] = n.toFixed(dec).split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (d ? ',' + d : ''); };
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target; cio.unobserve(el);
      if (reduced) return;
      const to = parseFloat(el.dataset.count); const dec = (el.dataset.count.split('.')[1] || '').length;
      const sup = el.querySelector('sup'); const supHTML = sup ? sup.outerHTML : '';
      const t0 = performance.now(); const dur = 1300;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - k, 3);
        el.innerHTML = fmt(to * e, dec) + supHTML;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  /* ── Fases de obra (pestañas) ── */
  $$('.phases').forEach((box) => {
    const tabs = $$('.ph-tab', box); const panels = $$('.ph-panel', box);
    const show = (i, focus) => {
      tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      panels.forEach((p, k) => { p.hidden = k !== i; });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(i));
      t.addEventListener('keydown', (e) => {
        const next = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (next) { e.preventDefault(); show((i + next + tabs.length) % tabs.length, true); }
      });
    });
    show(0);
  });

  /* ── Formulario de contacto ──
     Sin backend: valida y confirma en la página. Para producción, enviar a un endpoint
     (CRM, función serverless o servicio de formularios) en el submit. */
  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach((f) => {
        const fld = f.closest('.fld');
        const bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
        fld.classList.toggle('err', bad); if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;
      form.classList.add('sent');
      const btn = $('button[type="submit"]', form); btn.disabled = true; btn.textContent = 'Solicitud enviada';
      $('.form-ok', form).focus();
    });
  }
})();
