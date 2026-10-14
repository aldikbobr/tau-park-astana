/* TAU-PARK — a day slider that tints the hero, a pool-day bill with real prices */
(() => {
  'use strict';
  const M = window.Motion || { $: (s, r = document) => r.querySelector(s), $$: (s, r = document) => Array.from(r.querySelectorAll(s)), motion: false, fine: false, reduce: true, ready: (f) => f(), toast() {} };
  const { $, $$ } = M;
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  /* Time of day */
  const tod = $('#tod'), hero = $('#hero'), sky = $('#sky'), img = $('#hero-img');
  if (tod && hero) {
    const t = $('#tod-t'), s = $('#tod-s');
    const set = () => {
      const h = +tod.value;
      const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
      t.textContent = String(hh).padStart(2, '0') + ':' + String(mm === 60 ? 0 : mm).padStart(2, '0');
      // noon is brightest, edges are warm and darker
      const d = Math.abs(h - 14) / 6; // 0 at 14:00, ~1 at 10:00/20:00
      const k = Math.min(1, d);
      hero.style.setProperty('--br', (1 - k * 0.32).toFixed(2));
      hero.style.setProperty('--sa', (1 + k * 0.15).toFixed(2));
      hero.style.setProperty('--se', (k * 0.28).toFixed(2));
      const warm = h > 14 ? [255, 170, 110] : [255, 215, 170];
      sky.style.background = 'rgba(' + warm.join(',') + ',' + (k * 0.55).toFixed(2) + ')';
      s.textContent = h < 10.5 ? 'парк открывается' : h < 12 ? 'утро' : h < 16 ? 'день в разгаре' : h < 19 ? 'вечереет' : h >= 19.75 ? 'парк закрывается' : 'закат';
    };
    tod.addEventListener('input', set);
    set();
    // a gentle first sweep so people see it moves
    if (M.motion) M.ready(() => setTimeout(() => {
      const t0 = performance.now(); let touched = false;
      tod.addEventListener('pointerdown', () => { touched = true; }, { once: true });
      const run = (now) => {
        if (touched) return;
        const p = Math.min(1, (now - t0) / 2600);
        tod.value = 14 + Math.sin(p * Math.PI * 2) * 3.5; set();
        if (p < 1) requestAnimationFrame(run); else { tod.value = 14; set(); }
      };
      requestAnimationFrame(run);
    }, 900));
  }

  /* Pool day bill (prices: park price list in 2GIS, card updated 13 Oct 2026) */
  const form = $('#pc');
  if (form) {
    const P = { pool: { wk: [8000, 4000], we: [12000, 6000] }, beach: { wk: [3000, 1500], we: [3000, 1500] } };
    const X = { tap: ['Тапчан', 20000, false], robe: ['Халат', 2200, true], towel: ['Полотенце', 2200, true], shoes: ['Резиновая обувь', 500, true] };
    const cnt = { a: 2, k: 1 };
    const rows = $('#b-rows'), sumEl = $('#sum'), wa = $('#b-wa');
    let shown = 0, raf = 0;
    const anim = (to) => {
      cancelAnimationFrame(raf);
      if (!M.motion) { shown = to; sumEl.textContent = fmt(to); return; }
      const from = shown, t0 = performance.now();
      const step = (now) => { const k = Math.min(1, (now - t0) / 480), e = 1 - Math.pow(1 - k, 3); shown = from + (to - from) * e; sumEl.textContent = fmt(shown); if (k < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    };
    const val = (n) => (form.querySelector('input[name=' + n + ']:checked') || {}).value;
    const render = () => {
      const day = val('day'), zone = val('zone');
      const [pa, pk] = P[zone][day];
      const lines = []; let total = 0; const msg = [];
      const add = (n, amt) => { lines.push([n, amt]); total += amt; msg.push('– ' + n + ': ' + fmt(amt) + ' ₸'); };
      const dn = day === 'wk' ? 'будни' : 'выходные';
      if (cnt.a) add((zone === 'pool' ? 'Бассейн' : 'Пляж') + ', взрослые × ' + cnt.a + ' (' + dn + ')', pa * cnt.a);
      if (cnt.k) add((zone === 'pool' ? 'Бассейн' : 'Пляж') + ', дети 3–12 × ' + cnt.k, pk * cnt.k);
      const people = cnt.a + cnt.k;
      $$('#extras input:checked').forEach((c) => { const [n, p, each] = X[c.value]; add(n + (each ? ' × ' + people : ''), p * (each ? people : 1)); });
      rows.innerHTML = '';
      if (!lines.length) { const li = document.createElement('li'); li.textContent = 'Добавьте гостей'; rows.appendChild(li); }
      lines.forEach(([n, a]) => { const li = document.createElement('li'); const b = document.createElement('b'); b.textContent = n; b.style.fontWeight = '600'; const s = document.createElement('span'); s.textContent = fmt(a) + ' ₸'; li.append(b, s); rows.appendChild(li); });
      anim(total);
      wa.href = 'https://wa.me/77054848008?text=' + encodeURIComponent('Здравствуйте! Хотим приехать в TAU-PARK.\nПосчитали на сайте (' + dn + '):\n' + msg.join('\n') + '\nИтого по прайсу: ' + fmt(total) + ' ₸.');
      wa.target = '_blank'; wa.rel = 'noopener';
      form.querySelectorAll('.qty').forEach((q) => { q.querySelector('output').textContent = cnt[q.dataset.k]; });
    };
    form.addEventListener('change', render);
    $$('.qty button', form).forEach((b) => b.addEventListener('click', () => { const k = b.closest('.qty').dataset.k; cnt[k] = Math.max(0, Math.min(30, cnt[k] + +b.dataset.d)); render(); }));
    render();
  }
})();
