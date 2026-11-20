/* TenAuto (варіант B): вміст з адмінки (спільна база Supabase «clients») + онлайн-запис. Налаштування — window.CMS */
(function () {
  var C = window.CMS || {};
  if (!C.url || !C.key || !C.shop) return;
  var SH = encodeURIComponent(C.shop), H = { apikey: C.key, Authorization: 'Bearer ' + C.key };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $$(s) { return [].slice.call(document.querySelectorAll(s)); }
  function el(id) { return document.getElementById(id); }
  var css = document.createElement('style');
  css.textContent = '.cms-notice{background:#facc15;color:#1e3a8a;text-align:center;font-weight:700;font-size:15px;padding:10px 16px}' +
    '.cms-pr{position:absolute;top:12px;left:12px;z-index:1;background:#facc15;color:#1e3a8a;font-size:13px;font-weight:800;padding:5px 10px;border-radius:999px}' +
    '.bk{background:var(--bg)}.bk form{display:grid;gap:12px;max-width:760px}.bk .r{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
    '.bk label{display:grid;gap:6px;font-size:14px;font-weight:600;color:var(--mut)}.bk input,.bk select{font:inherit;font-size:16px;padding:13px 14px;border-radius:12px;border:1.5px solid var(--line);background:#fff;color:var(--ink);width:100%}' +
    '.bk button{justify-self:start;border:0;cursor:pointer}.bk .m{font-size:15px;color:var(--mut)}.bk .ok{padding:22px;border-radius:18px;background:#fff;font-size:17px}.bk .ok b{display:block;font-size:20px;margin-bottom:6px}.bk .hp{position:absolute;left:-9999px}' +
    '@media (max-width:700px){.bk .r{grid-template-columns:1fr}.bk button{justify-self:stretch}}';
  document.head.appendChild(css);

  fetch(C.url + '/rest/v1/content?shop=eq.' + SH + '&select=data', { headers: H }).then(function (r) { return r.json(); }).then(function (rows) {
    var d = rows && rows[0] && rows[0].data; if (!d || !Object.keys(d).length) return;
    if (d.notice) { var n = document.createElement('div'); n.className = 'cms-notice'; n.textContent = d.notice; document.body.insertBefore(n, document.body.firstChild); }
    if (d.phone) {
      var digits = d.phone.replace(/\D/g, '').replace(/^380/, '0').replace(/^80/, '0'), tel = 'tel:+38' + digits;
      $$('a[href^="tel:"]').forEach(function (a) { a.href = tel; });
      $$('a[href^="tel:"] span, a[href^="tel:"] b, .hc span').forEach(function (x) { if (x.children.length === 0 && x.textContent.trim() === C.phone) x.textContent = d.phone; });
      $$('a[href^="viber:"]').forEach(function (a) { a.href = 'viber://chat?number=%2B38' + digits; });
    }
    if (d.hours && d.hours.length) {
      var short = function (t) { return t.replace(/\s*–\s*/g, '–').replace(/(\d{2}):00/g, function (m, h) { return String(+h); }); };
      var top = el('hrs-top'); if (top) top.textContent = d.hours.map(function (h) { return h[1].replace(/\s*–\s*/, '–') + ' ' + short(h[2]); }).join(' · ');
      var ct = el('hrs-ct'); if (ct) ct.innerHTML = d.hours.map(function (h) { return esc(h[1].replace(/\s*–\s*/, '–') + ' ' + h[2].replace(/\s*–\s*/g, '–')); }).join('<br>');
      try {
        var k = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kyiv' })), w = String((k.getDay() + 6) % 7), mins = k.getHours() * 60 + k.getMinutes(), on = false, to = '';
        d.hours.forEach(function (h) {
          var m = /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/.exec(h[2]);
          if (String(h[0]).split(',').indexOf(w) > -1 && m) { var a = +m[1] * 60 + +m[2], b = +m[3] * 60 + +m[4]; on = mins >= a && mins < b; to = m[3] + ':' + m[4]; }
        });
        var st = el('st'), dot = el('dot');
        if (st) st.textContent = on ? 'Відкрито до ' + to : 'Зачинено';
        if (dot) dot.classList.toggle('off', !on);
      } catch (e) {}
    }
    var pr = el('promo');
    if (pr) {
      var pt = pr.querySelector('[data-cms="promo_title"]'), pp = pr.querySelector('[data-cms="promo_text"]');
      if (d.promo_title) { pt.textContent = d.promo_title; pp.textContent = d.promo_text || ''; }
      pr.hidden = false;
    }
    if (d.today != null && el('today')) {
      var ul = el('today').querySelector('ul'), out = '', open = false;
      d.today.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).forEach(function (l) {
        if (/^[-–—•]/.test(l)) { if (!open) { out = out.replace(/<\/li>$/, '<ul>'); open = true; } out += '<li>' + esc(l.replace(/^[-–—•]\s*/, '')) + '</li>'; }
        else { if (open) { out += '</ul></li>'; open = false; } out += '<li>' + esc(l) + '</li>'; }
      });
      if (open) out += '</ul></li>';
      if (ul) ul.innerHTML = out;
    }
    if (d.services && window.SVD) {
      var byK = {}; d.services.forEach(function (s) { if (s.k) byK[s.k] = s; });
      $$('.tile[data-k]').forEach(function (t) {
        var s = byK[t.dataset.k], i = +t.dataset.i; if (!s) return;
        var b = t.querySelector('.tt b'), img = t.querySelector('img');
        if (s.t) { b.textContent = s.t; img.alt = s.t; window.SVD[i].t = s.t; }
        if (s.p != null && s.p.trim()) window.SVD[i].l = s.p.split('\n').map(function (x) { return x.trim(); }).filter(Boolean).map(esc);
        var c = t.querySelector('.cms-pr');
        if (s.price) { if (!c) { c = document.createElement('span'); c.className = 'cms-pr'; t.appendChild(c); } c.textContent = s.price; } else if (c) c.remove();
      });
    }
    if (d.price_note && el('pnote')) el('pnote').textContent = d.price_note;
    if (d.gallery && d.gallery.length && el('gal')) el('gal').innerHTML = d.gallery.map(function (g) { return '<img src="' + esc(g[0]) + '" alt="' + esc(g[1] || 'СТО TenAuto') + '" loading="lazy">'; }).join('');
  }).catch(function () {});

  // ---------- онлайн-запис ----------
  var anchor = el('reviews') || el('contacts'); if (!anchor) return;
  var opts = (window.SVD || []).map(function (s) { return '<option>' + esc(s.t) + '</option>'; }).join('');
  var today = new Date().toISOString().slice(0, 10);
  var sec = document.createElement('section'); sec.className = 'bk'; sec.id = 'book';
  sec.innerHTML = '<div class="w"><span class="k">Запис</span><h2>Записатися на сервіс</h2><p class="ld">Залиште заявку — передзвонимо, уточнимо деталі й погодимо час.</p>' +
    '<form novalidate><div class="r"><label>Ім’я<input name="name" required maxlength="80" autocomplete="name"></label><label>Телефон<input name="phone" required inputmode="tel" maxlength="25" autocomplete="tel" placeholder="0__ ___ __ __"></label></div>' +
    '<div class="r"><label>Авто<input name="device" maxlength="80" placeholder="Напр. Toyota Camry 2015"></label><label>Послуга<select name="service"><option value="">Оберіть послугу</option>' + opts + '<option>Інше</option></select></label></div>' +
    '<div class="r"><label>Зручна дата<input name="wish_date" type="date" min="' + today + '"></label><label>Коментар<input name="comment" maxlength="500" placeholder="Що турбує в авто"></label></div>' +
    '<input name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true"><button class="btn" type="submit">Надіслати заявку</button><p class="m" role="status"></p></form></div>';
  anchor.parentNode.insertBefore(sec, anchor);
  $$('#promo .btn').forEach(function (a) { a.href = '#book'; });
  var f = sec.querySelector('form'), msg = sec.querySelector('.m');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var o = {}; new FormData(f).forEach(function (v, k) { o[k] = String(v).trim(); });
    if (o.website) return; delete o.website;
    if (!o.name) { msg.textContent = 'Вкажіть, будь ласка, ім’я'; f.name.focus(); return; }
    if (o.phone.replace(/\D/g, '').length < 10) { msg.textContent = 'Перевірте номер телефону'; f.phone.focus(); return; }
    Object.keys(o).forEach(function (k) { if (o[k] === '') o[k] = null; }); o.shop = C.shop;
    var b = f.querySelector('button'); b.disabled = true; msg.textContent = 'Надсилаємо…';
    fetch(C.url + '/rest/v1/requests', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, H), body: JSON.stringify(o) })
      .then(function (r) { if (!r.ok) throw r; f.innerHTML = '<div class="ok"><b>Дякуємо, заявку отримали!</b>Передзвонимо найближчим часом у робочі години.</div>'; })
      .catch(function () { b.disabled = false; msg.innerHTML = 'Не вдалося надіслати. Зателефонуйте нам: <a href="' + (document.querySelector('a[href^="tel:"]') || {}).href + '">' + esc(C.phone || '') + '</a>'; });
  });
})();
