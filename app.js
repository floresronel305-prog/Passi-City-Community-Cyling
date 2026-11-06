/* ---------- auth forms ---------- */
const authEl = $('#auth');
const formsEl = $('#forms');
const locBtn = $('#locBtn');
const dotEl = $('#dot');
const locTxt = $('#locTxt');
const fLogin = $('#fLogin');
const fSign = $('#fSign');
const fForgot = $('#fForgot');
const toForgot = $('#toForgot');
const backLogin = $('#backLogin');
const sendCode = $('#sendCode');
const resetBtn = $('#resetBtn');
const amsgBox = $('#amsg');

if (formsEl) formsEl.classList.remove('hidden');
if (locBtn || dotEl || locTxt) {
  ['#locBtn', '#dot', '#locTxt'].forEach(s => {
    const el = $(s);
    if (el) el.classList.add('hidden');
  });
}
if (authEl) authEl.classList.remove('hidden');

const lastUser = localStorage.getItem('pcc_last_user_email');
if (lastUser && $('#lEmail')) $('#lEmail').value = lastUser;

if (fSign && fLogin) {
  $$('.tabs button').forEach((b) => {
    b.onclick = () => {
      $$('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
      if (fLogin) fLogin.classList.toggle('hidden', b.dataset.t !== 'login');
      if (fSign) fSign.classList.toggle('hidden', b.dataset.t !== 'signup');
    };
  });
}

const amsg = (t, ok) => {
  if (!amsgBox) return;
  amsgBox.textContent = t;
  amsgBox.className = 'msg' + (ok ? ' ok' : '');
};

if (toForgot && fLogin && fForgot) {
  toForgot.onclick = () => {
    fLogin.classList.add('hidden');
    fForgot.classList.remove('hidden');
  };
}

if (backLogin && fLogin && fForgot) {
  backLogin.onclick = () => {
    fForgot.classList.add('hidden');
    fLogin.classList.remove('hidden');
  };
}

if (fSign) {
  fSign.onsubmit = async (e) => {
    e.preventDefault();
    const email = $('#sEmail').value.trim().toLowerCase();
    if (users.find(u => u.email === email)) return amsg('This email is already registered.');
    const u = {
      id: 'u' + Date.now(),
      name: $('#sName').value.trim(),
      email,
      pass: await sha($('#sPass').value),
      role: 'user',
      member: 'none',
      plan: 'Basic',
      phone: '',
      addr: '',
      bio: '',
      avatar: '',
      share: true,
      theme: 'green'
    };
    users.push(u);
    save('pcc_users', users);
    me = u;
    login();
  };
}

if (fLogin) {
  fLogin.onsubmit = async (e) => {
    e.preventDefault();
    const email = $('#lEmail').value.trim().toLowerCase();
    const u = users.find(x => x.email === email);
    if (!u || u.pass !== await sha($('#lPass').value)) return amsg('Wrong email or password.');
    me = u;
    login();
  };
}

function login() {
  if (!me) return;
  sessionStorage.setItem('pcc_me', me.id);
  localStorage.setItem('pcc_last_user_email', me.email);
  enter();
}

function startCool() {
  let c = 60;
  const b = $('#sendCode');
  if (!b) return;
  b.disabled = true;
  const t = setInterval(() => {
    c--;
    b.textContent = c > 0 ? `Resend code in ${c}s` : 'Send code to my email';
    if (c <= 0) {
      b.disabled = false;
      clearInterval(t);
      b.textContent = 'Send code to my email';
    }
  }, 1000);
}

if (fForgot) {
  fForgot.onsubmit = async (e) => {
    e.preventDefault();
    const email = $('#fEmail').value.trim().toLowerCase();
    const u = users.find(x => x.email === email);
    const b = $('#sendCode');
    if (!u) return amsg('No account found with that email.');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    save('pcc_reset', {
      email,
      code: await sha(code + email),
      exp: Date.now() + 10 * 60000,
      tries: 0
    });

    if (b) {
      b.disabled = true;
      b.textContent = 'Sending…';
    }

    if (!EMAILJS.publicKey) {
      if (b) {
        b.disabled = false;
        b.textContent = 'Send code to my email';
      }
      $('#codeBox').classList.remove('hidden');
      return amsg('Email service is not set up yet (see EMAILJS_SETUP.md). Test code: ' + code + '.', 1);
    }

    try {
      emailjs.init({ publicKey: EMAILJS.publicKey });
      await emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, {
        to_email: email,
        code,
        name: u.name
      });
      amsg('A 6-digit code was sent to ' + email + '. It expires in 10 minutes.', 1);
      $('#codeBox').classList.remove('hidden');
      startCool();
    } catch (err) {
      if (b) {
        b.disabled = false;
        b.textContent = 'Send code to my email';
      }
      amsg('Could not send the email. Check your EmailJS keys and template.');
    }
  };
}

if (resetBtn) {
  resetBtn.onclick = async () => {
    const r = load('pcc_reset', null);
    const email = $('#fEmail').value.trim().toLowerCase();

    if (!r || r.email !== email || Date.now() > r.exp) return amsg('Code expired. Request a new one.');
    if (r.tries >= 5) {
      localStorage.removeItem('pcc_reset');
      return amsg('Too many wrong tries. Request a new code.');
    }

    if (r.code !== await sha($('#fCode').value.trim() + email)) {
      r.tries++;
      save('pcc_reset', r);
      return amsg('Wrong code. ' + (5 - r.tries) + ' tries left.');
    }

    if ($('#fNew').value.length < 6) return amsg('New password needs 6+ characters.');

    const u = users.find(x => x.email === email);
    if (!u) return amsg('No account found with that email.');
    u.pass = await sha($('#fNew').value);
    save('pcc_users', users);
    localStorage.removeItem('pcc_reset');
    amsg('Password updated. You can log in now.', 1);
    setTimeout(() => {
      if (fForgot) fForgot.classList.add('hidden');
      if (fLogin) fLogin.classList.remove('hidden');
    }, 1200);
  };
}
