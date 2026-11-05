/* PASSI CITY COMMUNITY CYCLING - enhancement.js
   Extra features loaded after app.js (shares its globals: me, map, toast, $, $$ ...) */
(() => {
  /* Load the logo/map improvements after the main application has defined its globals. */
  const upgrade = document.createElement('script');
  upgrade.src = 'map-upgrade.js';
  upgrade.defer = true;
  document.head.appendChild(upgrade);

  /* 1. Show/hide password + strength meter */
  $$('input[type=password]').forEach(inp => {
    const w = document.createElement('div'); w.className = 'pw';
    inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Show';
    b.onclick = () => { const s = inp.type === 'password'; inp.type = s ? 'text' : 'password'; b.textContent = s ? 'Hide' : 'Show'; };
    w.appendChild(b);
  });
  const sp = $('#sPass');
  if (sp) {
    const w = sp.parentNode, m = document.createElement('div'), t = document.createElement('div');
    m.className = 'meter'; m.innerHTML = '<i></i>'; t.className = 'mtxt'; w.after(m, t);
    sp.addEventListener('input', () => {
      const v = sp.value; let s = 0;
      if (v.length >= 6) s++; if (v.length >= 10) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
      const c = ['#dc2626', '#f59e0b', '#eab308', '#16a34a', '#15803d'], n = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
      m.firstChild.style.width = (v ? (s + 1) * 20 : 0) + '%'; m.firstChild.style.background = c[s]; t.textContent = v ? n[s] : '';
    });
  }

  /* 2. Photo lightbox */
  document.addEventListener('click', e => {
    const img = e.target.closest('.gal img'); if (!img) return;
    const d = document.createElement('div'); d.className = 'lb'; d.innerHTML = `<img src="${img.src}" alt="">`;
    d.onclick = () => d.remove(); document.body.appendChild(d);
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') $('.lb')?.remove(); });

  /* 3. Offline banner */
  const net = document.createElement('div'); net.id = 'net'; net.textContent = 'You are offline. Map and routes need internet.'; document.body.appendChild(net);
  const upd = () => net.classList.toggle('show', !navigator.onLine);
  addEventListener('online', () => { upd(); toast('Back online'); }); addEventListener('offline', upd); upd();

  /* 4. Unread chat badge */
  let unread = 0;
  const badge = () => { const b = $('#nav [data-v=chat]'); if (!b) return; b.querySelector('.nb')?.remove(); if (unread) b.insertAdjacentHTML('beforeend', `<span class="nb">${unread}</span>`); };
  addEventListener('storage', e => { if (e.key === 'pcc_msgs' && me && !$('#v-chat').classList.contains('on')) { unread++; badge(); } });
  document.addEventListener('click', e => { if (e.target.closest('#nav [data-v=chat]')) { unread = 0; setTimeout(badge, 0); } });

  /* 5. Header shadow on scroll */
  addEventListener('scroll', () => $('header.top').classList.toggle('sc', scrollY > 8), { passive: true });

  /* 6. Bike ETA on route selection (~15 km/h) */
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    setTimeout(() => { const r = ROUTES[b.dataset.i]; if (r.km) $('#sRoute').textContent = `${r.km} km · ~${Math.round(r.km / 15 * 60)} min`; }, 50);
  });

  /* 7. Ride history (saved when you stop live GPS) */
  const hist = () => load('pcc_rides', []);
  const card = document.createElement('div'); card.className = 'card'; card.style.marginTop = '16px'; card.id = 'rideHist';
  $('#v-map').appendChild(card);
  function drawHist() {
    const l = hist().filter(r => r.owner === me?.id).slice(0, 8);
    card.innerHTML = '<h3>My ride history</h3>' + (l.length ? l.map(r => `<div class="rh"><span>${new Date(r.t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span><b>${r.km} km</b></div>`).join('') : '<p style="color:var(--mute);margin-top:8px">No rides recorded yet.</p>');
  }
  $('#rideBtn').addEventListener('click', () => {
    if (watch === null) { // ride was just stopped
      if (dist > 50) { const h = hist(); h.unshift({ owner: me.id, t: Date.now(), km: (dist / 1000).toFixed(2) }); save('pcc_rides', h); toast('Ride saved: ' + (dist / 1000).toFixed(2) + ' km'); }
      dist = 0; trailPts = []; trail?.setLatLngs([]); $('#sDist').textContent = '0.00'; $('#sSpd').textContent = '0';
    }
    drawHist();
  });
  const obs = new MutationObserver(() => { if (me) drawHist(); }); obs.observe($('#v-map'), { attributes: true });
  drawHist();
})();
