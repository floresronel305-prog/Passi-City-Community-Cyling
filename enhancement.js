/* PASSI CITY COMMUNITY CYCLING - enhancement.js
   Progressive enhancements for the existing static app. */
(() => {
  /* Password visibility and signup strength meter. */
  $$('input[type="password"]').forEach(inp => {
    const wrap = document.createElement('div'); wrap.className = 'pw';
    inp.parentNode.insertBefore(wrap, inp); wrap.appendChild(inp);
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.textContent = 'Show';
    toggle.setAttribute('aria-label', 'Show password');
    toggle.onclick = () => { const show = inp.type === 'password'; inp.type = show ? 'text' : 'password'; toggle.textContent = show ? 'Hide' : 'Show'; toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); };
    wrap.appendChild(toggle);
  });
  const signupPassword = $('#sPass');
  if (signupPassword) {
    const meter = document.createElement('div'), label = document.createElement('div');
    meter.className = 'meter'; meter.innerHTML = '<i></i>'; label.className = 'mtxt';
    signupPassword.parentNode.after(meter, label);
    signupPassword.addEventListener('input', () => {
      const value = signupPassword.value; let score = 0;
      if (value.length >= 6) score++; if (value.length >= 10) score++;
      if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
      if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
      const colors = ['#dc2626', '#f59e0b', '#eab308', '#16a34a', '#15803d'];
      const names = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
      meter.firstChild.style.width = (value ? (score + 1) * 20 : 0) + '%';
      meter.firstChild.style.background = colors[score]; label.textContent = value ? names[score] : '';
    });
  }

  /* Refined direct messaging: user-to-user and admin-to-user conversations. */
  const chatStyles = document.createElement('style');
  chatStyles.textContent = `
    #v-chat>h2{font-size:clamp(1.5rem,2.4vw,2rem);letter-spacing:-.04em}
    #v-chat .chat{height:min(72vh,760px);min-height:480px;grid-template-columns:minmax(230px,290px) minmax(0,1fr);border-radius:20px;box-shadow:0 20px 55px rgba(10,47,92,.13)}
    #v-chat .cl{background:linear-gradient(180deg,var(--card),var(--bg2));padding:12px 9px}
    #v-chat .contact-tools{padding:4px 7px 12px;border-bottom:1px solid var(--line);margin-bottom:7px}
    #v-chat .contact-tools label{display:block;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;margin:0 0 7px 4px}
    #v-chat .contact-search{margin:0;padding:10px 12px;border-radius:12px;font-size:.88rem}
    #v-chat .contact-caption{font-size:.72rem;color:var(--mute);padding:10px 9px 5px;text-transform:uppercase;letter-spacing:.09em;font-weight:800}
    #v-chat .ci{position:relative;border-radius:13px;margin:2px 0;padding:10px;min-height:58px}
    #v-chat .ci:hover{transform:translateX(2px)}
    #v-chat .ci.on{background:rgba(23,105,224,.11);box-shadow:inset 3px 0 var(--blue)}
    #v-chat .ci .av{width:39px;height:39px;font-size:.86rem}
    #v-chat .contact-meta{display:flex;flex-direction:column;min-width:0;gap:3px}
    #v-chat .contact-meta b{font-size:.86rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #v-chat .contact-sub{font-size:.72rem;color:var(--mute)}
    #v-chat .role-tag{display:inline-flex;align-items:center;margin-left:5px;border-radius:99px;background:#e8f1ff;color:#1857a6;padding:2px 6px;font-size:.61rem;font-weight:800;vertical-align:1px}
    body.dark #v-chat .role-tag{background:#203f66;color:#b8d7ff}
    #v-chat .cw{background:var(--card)}
    #v-chat .ch{display:flex;align-items:center;gap:12px;padding:14px 18px;min-height:70px;background:var(--card)}
    #v-chat .chat-title{display:flex;flex-direction:column;gap:4px;min-width:0}
    #v-chat .chat-title strong{font-size:.98rem}
    #v-chat .chat-title span{font-size:.75rem;color:var(--mute);font-weight:500}
    #v-chat .cm{padding:20px;gap:12px;background:linear-gradient(180deg,var(--bg2),var(--card) 38%)}
    #v-chat .chat-day{text-align:center;color:var(--mute);font-size:.69rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:2px 0 4px}
    #v-chat .b{max-width:min(76%,520px);padding:11px 14px;border-radius:17px 17px 17px 5px;line-height:1.5;box-shadow:0 3px 12px rgba(10,47,92,.06)}
    #v-chat .b.me{border-radius:17px 17px 5px 17px;background:linear-gradient(135deg,#2b7df2,#1258c9);box-shadow:0 7px 18px rgba(23,105,224,.18)}
    #v-chat .b small{font-size:.67rem;margin-bottom:3px;opacity:.78}
    #v-chat .message-time{display:block;text-align:right;font-size:.64rem;opacity:.7;margin-top:5px}
    #v-chat .chat-empty{margin:auto;text-align:center;max-width:320px;color:var(--mute);padding:24px;animation:rise .35s ease both}
    #v-chat .chat-empty-icon{display:grid;place-items:center;width:58px;height:58px;border-radius:19px;background:rgba(23,105,224,.1);font-size:1.6rem;margin:0 auto 12px}
    #v-chat .cf{padding:12px 14px;background:var(--card);align-items:center}
    #v-chat .cf input{padding:12px 15px;border-radius:14px;background:var(--bg2)}
    #v-chat .cf .btn{min-width:82px;border-radius:13px}
    #v-chat .chat-note{font-size:.7rem;color:var(--mute);text-align:center;padding:0 12px 9px;background:var(--card)}
    @media(max-width:650px){#v-chat .chat{height:calc(100dvh - 220px);min-height:430px;grid-template-columns:92px minmax(0,1fr)}#v-chat .contact-tools{padding:4px 3px 10px}#v-chat .contact-tools label,#v-chat .contact-meta,#v-chat .contact-caption{display:none}#v-chat .contact-search{padding:8px 5px;font-size:.72rem}#v-chat .ci{justify-content:center;padding:9px 4px}#v-chat .ci .av{width:42px;height:42px}#v-chat .b{max-width:90%}#v-chat .cf{padding:9px}#v-chat .cf .btn{min-width:60px;padding:9px}}
    @media(prefers-reduced-motion:reduce){#v-chat *,#v-chat *::before,#v-chat *::after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
  `;
  document.head.appendChild(chatStyles);

  let chatSearch = '';
  renderChat = function enhancedRenderChat() {
    const contacts = load('pcc_users', []).filter(user => user.id !== me.id)
      .sort((a, b) => (a.role === 'admin' ? -1 : 0) - (b.role === 'admin' ? -1 : 0) || a.name.localeCompare(b.name));
    const filtered = contacts.filter(user => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(chatSearch));
    const community = `<div class="ci ${chatWith === 'all' ? 'on' : ''}" data-id="all" role="button" tabindex="0" aria-label="Community chat"><div class="av">👥</div><div class="contact-meta"><b>Community</b><span class="contact-sub">Group conversation</span></div></div>`;
    const people = filtered.map(user => `<div class="ci ${chatWith === user.id ? 'on' : ''}" data-id="${esc(user.id)}" role="button" tabindex="0" aria-label="Chat with ${esc(user.name)}">${avatar(user)}<div class="contact-meta"><b>${esc(user.name)}${user.role === 'admin' ? '<span class="role-tag">ADMIN</span>' : ''}</b><span class="contact-sub">${user.role === 'admin' ? 'Community support' : 'Cycling community'}</span></div></div>`).join('');
    $('#cl').innerHTML = `<div class="contact-tools"><label for="chatContactSearch">Find a member</label><input id="chatContactSearch" class="contact-search" type="search" placeholder="Search people…" value="${esc(chatSearch)}" autocomplete="off" aria-label="Search chat contacts"></div>${community}<div class="contact-caption">Direct messages</div>${people || '<div class="contact-sub" style="padding:10px">No members found.</div>'}`;
    const search = $('#chatContactSearch');
    search.addEventListener('input', () => { chatSearch = search.value.trim().toLowerCase(); const caret = search.selectionStart; renderChat(); const next = $('#chatContactSearch'); next.focus(); next.setSelectionRange(caret, caret); });
    $$('#cl .ci').forEach(item => {
      const select = () => { chatWith = item.dataset.id; renderChat(); };
      item.onclick = select;
      item.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } };
    });
    const peer = contacts.find(user => user.id === chatWith);
    const isCommunity = chatWith === 'all' || !peer;
    const title = isCommunity ? 'Community' : peer.name;
    $('#cH').innerHTML = `${isCommunity ? '<div class="av">👥</div>' : avatar(peer)}<div class="chat-title"><strong>${esc(title)}${!isCommunity && peer.role === 'admin' ? '<span class="role-tag">ADMIN</span>' : ''}</strong><span>${isCommunity ? 'Share ride updates with the cycling community' : peer.role === 'admin' ? 'Message the community administrator' : 'Private conversation'}</span></div>`;
    const messages = msgs().filter(message => isCommunity
      ? message.to === 'all'
      : (message.from === me.id && message.to === chatWith) || (message.from === chatWith && message.to === me.id));
    const users = load('pcc_users', []);
    const bubbleMarkup = messages.map(message => {
      const sender = users.find(user => user.id === message.from);
      const when = new Date(message.t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `<div class="b ${message.from === me.id ? 'me' : ''}"><small>${message.from === me.id ? 'You' : esc(sender?.name || 'Member')}${sender?.role === 'admin' && message.from !== me.id ? ' · Admin' : ''}</small>${esc(message.text)}<span class="message-time">${when}</span></div>`;
    }).join('');
    $('#cM').innerHTML = messages.length ? bubbleMarkup : `<div class="chat-empty"><div class="chat-empty-icon">${isCommunity ? '👋' : '💬'}</div><b>${isCommunity ? 'Welcome to the community chat' : `Start a conversation with ${esc(title)}`}</b><p style="margin-top:7px;font-size:.84rem">${isCommunity ? 'Share a ride update, ask a question, or say hello to fellow cyclists.' : 'Your messages in this direct conversation will appear here.'}</p></div>`;
    $('#cM').scrollTop = $('#cM').scrollHeight;
    const input = $('#cI');
    input.placeholder = isCommunity ? 'Message the community…' : `Message ${title}…`;
    input.setAttribute('aria-label', input.placeholder);
    $('#cF').querySelector('button').setAttribute('aria-label', 'Send message');
  };
  /* Existing submit/storage handlers call renderChat, so the polished view stays live. */

  /* Photo lightbox. */
  document.addEventListener('click', event => {
    const image = event.target.closest('.gal img'); if (!image) return;
    const lightbox = document.createElement('div'); lightbox.className = 'lb';
    const enlarged = document.createElement('img'); enlarged.src = image.src; enlarged.alt = image.alt || 'Ride photo';
    lightbox.appendChild(enlarged); lightbox.onclick = () => lightbox.remove(); document.body.appendChild(lightbox);
  });
  addEventListener('keydown', event => { if (event.key === 'Escape') $('.lb')?.remove(); });

  /* Offline banner and unread message indicator. */
  const network = document.createElement('div'); network.id = 'net'; network.textContent = 'You are offline. Map and routes need internet.'; document.body.appendChild(network);
  const updateNetwork = () => network.classList.toggle('show', !navigator.onLine);
  addEventListener('online', () => { updateNetwork(); toast('Back online'); }); addEventListener('offline', updateNetwork); updateNetwork();
  let unread = 0;
  const updateBadge = () => { const button = $('#nav [data-v=chat]'); if (!button) return; button.querySelector('.nb')?.remove(); if (unread) button.insertAdjacentHTML('beforeend', `<span class="nb">${unread > 99 ? '99+' : unread}</span>`); };
  addEventListener('storage', event => { if (event.key === 'pcc_msgs' && me && !$('#v-chat').classList.contains('on')) { unread++; updateBadge(); } });
  document.addEventListener('click', event => { if (event.target.closest('#nav [data-v=chat]')) { unread = 0; setTimeout(updateBadge, 0); } });

  /* Header elevation and route ride-time hint. */
  addEventListener('scroll', () => $('header.top')?.classList.toggle('sc', scrollY > 8), { passive: true });
  $('#chips')?.addEventListener('click', event => {
    const button = event.target.closest('.chip'); if (!button) return;
    setTimeout(() => { const route = ROUTES[button.dataset.i]; if (route?.km) $('#sRoute').textContent = `${route.km} km · ~${Math.round(route.km / 15 * 60)} min`; }, 50);
  });

  /* Ride history card. */
  const rideHistory = load('pcc_rides', []);
  const historyCard = document.createElement('div'); historyCard.className = 'card'; historyCard.style.marginTop = '16px'; historyCard.id = 'rideHist';
  $('#v-map')?.appendChild(historyCard);
  function drawRideHistory() {
    if (!me || !historyCard) return;
    const rides = load('pcc_rides', []).filter(ride => ride.owner === me.id).slice(0, 8);
    historyCard.innerHTML = '<h3>My ride history</h3>' + (rides.length ? rides.map(ride => `<div class="rh"><span>${new Date(ride.t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span><b>${esc(ride.km)} km</b></div>`).join('') : '<p style="color:var(--mute);margin-top:8px">Your completed rides will appear here.</p>');
  }
  $('#rideBtn')?.addEventListener('click', () => {
    if (watch === null) {
      if (dist > 50) { const rides = load('pcc_rides', []); rides.unshift({ owner: me.id, t: Date.now(), km: (dist / 1000).toFixed(2) }); save('pcc_rides', rides); toast('Ride saved: ' + (dist / 1000).toFixed(2) + ' km'); }
      dist = 0; trailPts = []; trail?.setLatLngs([]); $('#sDist').textContent = '0.00'; $('#sSpd').textContent = '0';
    }
    drawRideHistory();
  });
  const observer = new MutationObserver(drawRideHistory);
  if ($('#v-map')) observer.observe($('#v-map'), { attributes: true, attributeFilter: ['class'] });
  drawRideHistory();
})();
