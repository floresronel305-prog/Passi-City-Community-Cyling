/* ============ CONFIG (edit these) ============ */
const LOGO_URL = "logo.png"; // put the official Passi City logo file next to index.html
const EMAILJS = { publicKey:"", serviceId:"", templateId:"" }; // https://www.emailjs.com (template vars: {{to_email}}, {{code}}, {{name}})
const ADMIN = { email:"admin@passicycling.com", pass:"admin123", name:"Admin" }; // change after first login
const ROUTES = [
  {name:"Agcararao Mountain View", color:"#e11d48", pts:[[11.1086,122.6411],[11.15286,122.67738]]},
  {name:"San Enrique Plaza", color:"#16a34a", pts:[[11.1086,122.6411],[11.07145,122.65567]]},
  {name:"San Enrique – Compo", color:"#f59e0b", pts:[[11.07145,122.65567],[11.0571,122.6557]]},
  {name:"Passi City Bypass Road", color:"#7c3aed", pts:[[11.081361,122.626791]]}
];
const PLANS = [
  {id:"Basic",price:"Free",perks:["Join community rides","Live route map","Group chat"]},
  {id:"Member",price:"₱100 / year",perks:["Everything in Basic","Member jersey","Priority event slots"]},
  {id:"Club",price:"₱300 / year",perks:["Everything in Member","Bike service discount","Leader badge"]}];
const THEMES = [
  {id:"green", name:"Forest green", primary:"#167451", dark:"#10583e"},
  {id:"blue", name:"Ocean blue", primary:"#2563eb", dark:"#1d4ed8"},
  {id:"purple", name:"Royal purple", primary:"#7c3aed", dark:"#6d28d9"},
  {id:"coral", name:"Coral", primary:"#e05252", dark:"#c83e49"},
  {id:"amber", name:"Golden amber", primary:"#c27a12", dark:"#995b0b"}
];
/* ============================================= */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const fallbackLogo=`data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#1769e0" stroke="#fff" stroke-width="6"/><path d="M18 48c12-18 22-27 32-27S69 30 82 48c-12 12-18 19-32 19S31 59 18 48Z" fill="#fff" opacity=".94"/></svg>')}`;
function setLogo(){document.querySelectorAll('.lg').forEach(e=>{const i=new Image();i.alt="Passi City logo";i.className=e.className;i.onerror=()=>{i.onerror=null;i.src=fallbackLogo};i.src=LOGO_URL;});}
setLogo();
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3500)}
document.addEventListener('click',e=>{const b=e.target.closest('.btn');if(!b)return;const r=document.createElement('span'),d=Math.max(b.offsetWidth,b.offsetHeight),p=b.getBoundingClientRect();r.className='rip';r.style.width=r.style.height=d+'px';r.style.left=(e.clientX-p.left-d/2)+'px';r.style.top=(e.clientY-p.top-d/2)+'px';b.appendChild(r);setTimeout(()=>r.remove(),600)});
const sha=async s=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch{return btoa(s)}};
const initials=n=>(n||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const avatar=(u,cls='av')=>u.avatar?`<img class="${cls}" src="${u.avatar}" alt="">`:`<div class="${cls}">${initials(u.name)}</div>`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function resize(file,max=900){return new Promise(res=>{const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);const ctx=c.getContext('2d');ctx.drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.82))};i.src=r.result};r.readAsDataURL(file)});} 

/* ---------- data ---------- */
let users=load('pcc_users',[]),me=null,pos=null;
(async()=>{if(!users.find(u=>u.email===ADMIN.email)){users.push({id:'admin',name:ADMIN.name,email:ADMIN.email,pass:await sha(ADMIN.pass),role:'admin',member:'active',plan:'Club',phone:'',addr:'',bio:'',avatar:'',share:true,theme:'green'});save('pcc_users',users);} 
const settings=load('pcc_settings',{dark:false,sound:true});
if(settings.dark)document.body.classList.add('dark');
setTimeout(()=>{$('#splash').classList.add('out');boot()},1800);})();

function applyTheme(themeId='green'){
  const theme = THEMES.find(t=>t.id===themeId) || THEMES[0];
  document.body.dataset.theme = theme.id;
  document.documentElement.style.setProperty('--blue', theme.primary);
  document.documentElement.style.setProperty('--blue2', theme.dark);
  document.documentElement.style.setProperty('--ok', theme.primary);
  document.documentElement.style.setProperty('--theme-primary', theme.primary);
  document.documentElement.style.setProperty('--theme-dark', theme.dark);
  if(me && me.theme !== theme.id){me.theme=theme.id;persist();}
  const picks=$$('[data-theme-choice]');
  picks.forEach(btn => {
    const selected = btn.dataset.themeChoice === theme.id;
    btn.classList.toggle('selected', selected);
    btn.setAttribute('aria-pressed', String(selected));
  });
}

/* ---------- location gate ---------- */
function getPos(){return new Promise((ok,no)=>{if(!navigator.geolocation)return no({message:'Geolocation is not supported by this browser.'});navigator.geolocation.getCurrentPosition(p=>{pos=p;ok(p)},err=>no(err));});}
/* Location is now requested only when the user opens the Map tab (not at login/sign up). */
let locAsked=false;
async function askMapLoc(force){if(pos||(locAsked&&!force))return;locAsked=true;
 try{await getPos();if(me){me.loc={lat:pos.coords.latitude,lng:pos.coords.longitude,t:Date.now()};persist()}
  map.setView([pos.coords.latitude,pos.coords.longitude],15);toast('Location is on.');}
 catch(e){toast('Location is off. Allow location in your browser settings to see yourself on the map.')}}
function boot(){const sid=sessionStorage.getItem('pcc_me');if(sid){const u=users.find(x=>x.id===sid);if(u){me=u;return enter()}}
  /* show the login/sign up forms right away; hide the old location gate */
  $('#forms')?.classList.remove('hidden');['#locBtn','#dot','#locTxt'].forEach(s=>$(s)?.classList.add('hidden'));
  const lastUser = localStorage.getItem('pcc_last_user_email');
  if(lastUser && $('#lEmail')) $('#lEmail').value = lastUser;
  $('#auth').classList.remove('hidden');}
$$('.tabs button').forEach(b=>b.onclick=()=>{$$('.tabs button').forEach(x=>x.classList.toggle('on',x===b));$('#fLogin').classList.toggle('hidden',b.dataset.t!=='login');$('#fSign').classList.toggle('hidden',b.dataset.t!=='signup');});
const amsg=(t,ok)=>{$('#amsg').textContent=t;$('#amsg').className='msg'+(ok?' ok':'')};
$('#toForgot').onclick=()=>{$('#fLogin').classList.add('hidden');$('#fForgot').classList.remove('hidden')};
$('#backLogin').onclick=()=>{$('#fForgot').classList.add('hidden');$('#fLogin').classList.remove('hidden')};
$('#fSign').onsubmit=async e=>{e.preventDefault();
  const email=$('#sEmail').value.trim().toLowerCase();if(users.find(u=>u.email===email))return amsg('This email is already registered.');
  const u={id:'u'+Date.now(),name:$('#sName').value.trim(),email,pass:await sha($('#sPass').value),role:'user',member:'none',plan:'Basic',phone:'',addr:'',bio:'',avatar:'',share:true,theme:'green'};
  users.push(u);save('pcc_users',users);me=u;login()};
$('#fLogin').onsubmit=async e=>{e.preventDefault();
  const email=$('#lEmail').value.trim().toLowerCase();
  const u=users.find(x=>x.email===email);
  if(!u||u.pass!==await sha($('#lPass').value))return amsg('Wrong email or password.');
  me=u;login()};
function login(){sessionStorage.setItem('pcc_me',me.id);localStorage.setItem('pcc_last_user_email', me.email);enter()}
/* forgot password: 6-digit code sent to the user's Gmail via EmailJS */
function startCool(){let c=60;const b=$('#sendCode');b.disabled=true;const t=setInterval(()=>{c--;b.textContent=c>0?`Resend code in ${c}s`:'Send code to my email';if(c<=0){b.disabled=false;clearInterval(t);b.textContent='Send code to my email'}},1000)}
$('#fForgot').onsubmit=async e=>{e.preventDefault();
  const email=$('#fEmail').value.trim().toLowerCase(),u=users.find(x=>x.email===email),b=$('#sendCode');
  if(!u)return amsg('No account found with that email.');
  const code=String(Math.floor(100000+Math.random()*900000));
  save('pcc_reset',{email,code:await sha(code+email),exp:Date.now()+10*60000,tries:0});
  b.disabled=true;b.textContent='Sending…';
  if(!EMAILJS.publicKey){b.disabled=false;b.textContent='Send code to my email';$('#codeBox').classList.remove('hidden');return amsg('Email service is not set up yet (see EMAILJS_SETUP.md). Test code: '+code+'.',1)};
  try{emailjs.init({publicKey:EMAILJS.publicKey});await emailjs.send(EMAILJS.serviceId,EMAILJS.templateId,{to_email:email,code,name:u.name});
   amsg('A 6-digit code was sent to '+email+'. It expires in 10 minutes.',1);$('#codeBox').classList.remove('hidden');startCool()}
  catch(err){b.disabled=false;b.textContent='Send code to my email';amsg('Could not send the email. Check your EmailJS keys and template.')}};
$('#resetBtn').onclick=async()=>{const r=load('pcc_reset',null),email=$('#fEmail').value.trim().toLowerCase();
  if(!r||r.email!==email||Date.now()>r.exp)return amsg('Code expired. Request a new one.');
  if(r.tries>=5){localStorage.removeItem('pcc_reset');return amsg('Too many wrong tries. Request a new code.')}
  if(r.code!==await sha($('#fCode').value.trim()+email)){r.tries++;save('pcc_reset',r);return amsg('Wrong code. '+(5-r.tries)+' tries left.')}
  if($('#fNew').value.length<6)return amsg('New password needs 6+ characters.');
  const u=users.find(x=>x.email===email);u.pass=await sha($('#fNew').value);save('pcc_users',users);localStorage.removeItem('pcc_reset');amsg('Password updated. You can log in now.',1);setTimeout(()=>{$('#fForgot').classList.add('hidden');$('#fLogin').classList.remove('hidden')},1200)};

/* ---------- app shell ---------- */
const NAV=[['home','🏠','Home'],['map','🗺️','Map'],['bike','🚲','Bike'],['member','🎫','Member'],['chat','💬','Chat'],['photos','📷','Photos'],['profile','👤','Profile'],['settings','⚙️','Settings']];
function enter(){$('#auth').classList.add('hidden');$('#app').classList.remove('hidden');
  const items=[...NAV];if(me.role==='admin')items.push(['admin','🛡️','Admin']);
  $('#nav').innerHTML=items.map(i=>`<button data-v="${i[0]}"><span>${i[1]}</span>${i[2]}</button>`).join('');
  $$('#nav button').forEach(b=>b.onclick=()=>show(b.dataset.v));
  $('#hName').textContent=me.name.split(' ')[0];$('#hAv').outerHTML=avatar(me).replace('class="av"','class="av" id="hAv"').replace('<img class="av"','<img id="hAv" class="av"');
  if(pos){me.loc={lat:pos.coords.latitude,lng:pos.coords.longitude,t:Date.now()};persist()}
  applyTheme(me.theme || 'green');
  initMap();show('home')}
function persist(){const i=users.findIndex(u=>u.id===me.id);if(i>=0){users[i]=me;save('pcc_users',users)}}
function show(v){$$('.view').forEach(x=>x.classList.toggle('on',x.id==='v-'+v));$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  if(v==='map'){setTimeout(()=>map.invalidateSize(),50);askMapLoc()}
  const views={home:renderHome,bike:renderBikes,member:renderMember,chat:renderChat,photos:renderPhotos,profile:fillProfile,settings:fillSettings,admin:renderAdmin};
  if(views[v])views[v]();}

/* ---------- map + routes + live GPS ---------- */
let map,meMarker,acc,trail,watch=null,trailPts=[],dist=0,others=L.layerGroup(),ctrls=[],routeLayers={};
function initMap(){if(map)return;map=L.map('map').setView([11.1086,122.6411],12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);others.addTo(map);
  $('#chips').innerHTML=ROUTES.map((r,i)=>`<button class="chip" data-i="${i}" style="border-color:${r.color};color:${r.color}">${r.name}</button>`).join('');
  ROUTES.forEach((r,i)=>{const c=L.Routing.control({waypoints:r.pts.map(p=>L.latLng(p)),router:L.Routing.osrmv1({serviceUrl:'https://router.project-osrm.org/route/v1',profile:'driving'}),
   lineOptions:{styles:[{color:'#fff',weight:9,opacity:.9},{color:r.color,weight:5}],addWaypoints:false},addWaypoints:false,draggableWaypoints:false,fitSelectedRoutes:false,show:false,
   createMarker:(j,wp)=>j===0||j===r.pts.length-1?L.marker(wp.latLng).bindPopup(`<b>${r.name}</b>${j===0?' (start)':' (end)'}`):null}).addTo(map);
   c.on('routesfound',e=>{r.km=(e.routes[0].summary.totalDistance/1000).toFixed(1);r.bounds=L.latLngBounds(e.routes[0].coordinates)});ctrls.push(c)});
  $('#chips').onclick=e=>{const b=e.target.closest('.chip');if(!b)return;const r=ROUTES[b.dataset.i];if(r.bounds)map.fitBounds(r.bounds,{padding:[40,40]});$('#sRoute').textContent=r.km?r.km+' km':'–';};
  map.on('layeradd',()=>{});setInterval(drawOthers,5000);drawOthers()}
function drawOthers(){others.clearLayers();load('pcc_users',[]).forEach(u=>{if(u.id===me?.id||!u.share||!u.loc||Date.now()-u.loc.t>3600000)return;L.circleMarker([u.loc.lat,u.loc.lng],{radius:8,color:'#22c55e',fillColor:'#7dd3fc',fillOpacity:.9}).addTo(others);});}
function onPos(p){const ll=[p.coords.latitude,p.coords.longitude];pos=p;
  if(!meMarker){meMarker=L.marker(ll,{icon:L.divIcon({className:'',html:'<div class="pulse"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(map);acc=L.circle(ll,{radius:p.coords.accuracy,color:'#22c55e',fillColor:'#7dd3fc',fillOpacity:.25}).addTo(map);}
  else{meMarker.setLatLng(ll);acc.setLatLng(ll).setRadius(p.coords.accuracy)}
  if(trailPts.length)dist+=map.distance(trailPts[trailPts.length-1],ll);trailPts.push(ll);trail=trail?trail: L.polyline([], {color:'#22c55e', weight:5, opacity:.9}).addTo(map);trail.setLatLngs(trailPts);
  $('#sDist').textContent=(dist/1000).toFixed(2);$('#sSpd').textContent=p.coords.speed?Math.round(p.coords.speed*3.6):0;
  if(me.share){me.loc={lat:ll[0],lng:ll[1],t:Date.now()};persist()}}
$('#rideBtn').onclick=()=>{if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;$('#rideBtn').textContent='Start live GPS';return toast('Ride stopped')}
  watch=navigator.geolocation.watchPosition(onPos,()=>toast('Cannot get GPS. Turn on location.'),{enableHighAccuracy:true,maximumAge:1000});$('#rideBtn').textContent='Stop live GPS';toast('Live GPS started.');}
$('#centerBtn').onclick=()=>meMarker?map.setView(meMarker.getLatLng(),17):toast('Start live GPS first.');

/* ---------- bike form ---------- */
const bikes=()=>load('pcc_bikes',[]);
$('#bikeForm').onsubmit=async e=>{e.preventDefault();const f=$('#bPhoto').files[0],b=bikes();b.push({id:Date.now(),owner:me.id,name:$('#bName').value,type:$('#bType').value,brand:$('#bBrand').value,color:$('#bColor').value,serial:$('#bSerial').value,photo:f?await resize(f,900):''});save('pcc_bikes',b);$('#bikeForm').reset();renderBikes();toast('Bike saved.');};
function renderBikes(){const l=bikes().filter(b=>b.owner===me.id||me.role==='admin');$('#bikeList').innerHTML=l.length?l.map(b=>`<div style="display:flex;gap:12px;align-items:center;padding:10px 12px"><div style="width:44px;height:44px;border-radius:12px;background:${b.color||'#d8e7dc'};display:grid;place-items:center;color:#fff;font-weight:800">${initials(b.name)}</div><div style="flex:1"><b>${esc(b.name)}</b><div style="color:var(--mute);font-size:.78rem">${esc(b.type)} · ${esc(b.brand||'Unknown brand')}</div></div><button class="btn sm red" data-d="${b.id}">Delete</button></div>`).join(''):'<div class="card"><p style="color:var(--mute);margin:0">No bikes added yet.</p></div>';  $$('#bikeList [data-d]').forEach(x=>x.onclick=()=>{save('pcc_bikes',bikes().filter(b=>b.id!=x.dataset.d));renderBikes()})}

/* ---------- membership ---------- */
function renderMember(){$('#mStat').textContent=me.member==='active'?'Active · '+me.plan:me.member==='pending'?'Pending approval · '+me.plan:'Not a member';$('#mStat').className='badge '+(me.member||'none');$('#plans').innerHTML=PLANS.map(p=>`<div class="card plan"><h3>${p.id}</h3><div class="pr">${p.price}</div><ul>${p.perks.map(x=>`<li>✓ ${x}</li>`).join('')}</ul><button class="btn" data-p="${p.id}">${me.plan===p.id?'Current':'Select'}</button></div>`).join('');$$('#plans [data-p]').forEach(b=>b.onclick=()=>{me.plan=b.dataset.p;me.member=b.dataset.p==='Basic'?'active':'pending';persist();renderMember();toast(me.member==='active'?'You are now a Basic member.':'Membership request sent.');})}

/* ---------- chat (live between tabs via storage event) ---------- */
let chatWith='all';const msgs=()=>load('pcc_msgs',[]);
function renderChat(){const us=load('pcc_users',[]).filter(u=>u.id!==me.id);
  $('#cl').innerHTML=`<div class="ci ${chatWith==='all'?'on':''}" data-id="all"><div class="av">👥</div><b>Community</b></div>`+us.map(u=>`<div class="ci ${chatWith===u.id?'on':''}" data-id="${u.id}"><div class="av">${initials(u.name)}</div><b>${esc(u.name)}</b></div>`).join('');
  $$('.ci').forEach(c=>c.onclick=()=>{chatWith=c.dataset.id;renderChat()});
  const peer=us.find(u=>u.id===chatWith);$('#cH').textContent=chatWith==='all'?'Community':peer?peer.name:'Community';
  const list=msgs().filter(m=>chatWith==='all'?m.to==='all':(m.from===me.id&&m.to===chatWith)||(m.from===chatWith&&m.to===me.id));
  $('#cM').innerHTML=list.length?list.map(m=>`<div class="b ${m.from===me.id?'me':''}"><small>${m.from===me.id?'You':esc(load('pcc_users',[]).find(u=>u.id===m.from)?.name||'?')}</small><div>${esc(m.text)}</div></div>`).join(''):'<div class="chat-empty">No messages yet.</div>';
  $('#cM').scrollTop=1e9}
$('#cF').onsubmit=e=>{e.preventDefault();const t=$('#cI').value.trim();if(!t)return;const m=msgs();m.push({from:me.id,to:chatWith,text:t,t:Date.now()});save('pcc_msgs',m);$('#cI').value='';renderChat();};
addEventListener('storage',e=>{if(e.key==='pcc_msgs'&&me&&$('#v-chat').classList.contains('on'))renderChat()});

/* ---------- photos ---------- */
const photos=()=>load('pcc_photos',[]);
$('#pBtn').onclick=async()=>{const fs=[...$('#pUp').files];if(!fs.length)return toast('Choose a photo first.');const p=photos();for(const f of fs)p.unshift({id:Date.now()+Math.random(),by:me.name,owner:me.id,src:await resize(f,1200),cap:$('#pCap').value||''});save('pcc_photos',p);renderPhotos();toast('Photo uploaded.');};
function renderPhotos(){$('#gal').innerHTML=photos().map(p=>`<figure><img src="${p.src}" alt="${esc(p.cap||'Ride photo')}"><figcaption>${esc(p.cap||'')} <i>by ${esc(p.by)}</i>${p.owner===me.id||me.role==='admin'?'<a href="#" data-x="'+p.id+'">Delete</a>':''}</figcaption></figure>`).join('');$$('#gal [data-x]').forEach(a=>a.onclick=e=>{e.preventDefault();save('pcc_photos',photos().filter(p=>p.id!=a.dataset.x));renderPhotos()})}

/* ---------- profile / settings ---------- */
function fillProfile(){$('#pfName').value=me.name;$('#pfEmail').value=me.email;$('#pfPhone').value=me.phone||'';$('#pfAddr').value=me.addr||'';$('#pfBio').value=me.bio||'';$('#pAv').outerHTML=avatar(me).replace('class="av"','class="av" id="pAv"').replace('<img class="av"','<img id="pAv" class="av"');
$('#pPic').onchange=async e=>{if(e.target.files[0]){me.avatar=await resize(e.target.files[0],240);persist();fillProfile();toast('Photo selected. Click Save profile.')}};}
$('#pf').onsubmit=e=>{e.preventDefault();Object.assign(me,{name:$('#pfName').value.trim(),phone:$('#pfPhone').value.trim(),addr:$('#pfAddr').value.trim(),bio:$('#pfBio').value.trim()});persist();$('#hName').textContent=me.name.split(' ')[0];toast('Profile updated.');};
function fillSettings(){const s=load('pcc_settings',{dark:false,sound:true});$('#tDark').classList.toggle('on',s.dark);$('#tShare').classList.toggle('on',!!me.share);$('#tSound').classList.toggle('on',s.sound);}
$('#tDark').onclick=()=>{const s=load('pcc_settings',{dark:false,sound:true});s.dark=!s.dark;document.body.classList.toggle('dark',s.dark);save('pcc_settings',s);fillSettings();};
$('#tSound').onclick=()=>{const s=load('pcc_settings',{dark:false,sound:true});s.sound=!s.sound;save('pcc_settings',s);fillSettings();};
$('#tShare').onclick=()=>{me.share=!me.share;persist();fillSettings();};
$('#cpBtn').onclick=async()=>{if(me.pass!==await sha($('#cpOld').value))return toast('Current password is wrong.');if($('#cpNew').value.length<6)return toast('New password needs 6+ characters.');me.pass=await sha($('#cpNew').value);persist();toast('Password updated.');};
$('#logout').onclick=()=>{sessionStorage.removeItem('pcc_me');localStorage.setItem('pcc_last_user_email', me.email);location.reload()};

/* ---------- admin ---------- */
function renderAdmin(){const us=load('pcc_users',[]);$('#aStats').innerHTML=`<div><b>${us.length}</b><span>Users</span></div><div><b>${us.filter(u=>u.member==='active').length}</b><span>Active members</span></div><div><b>${us.filter(u=>u.role==='admin').length}</b><span>Admins</span></div>`;$('#aBody').innerHTML=us.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role}</td><td><span class="badge ${u.member}">${u.member==='none'?'–':u.plan+' · '+u.member}</span></td><td>${u.loc?`${u.loc.lat.toFixed(4)}, ${u.loc.lng.toFixed(4)}`:'—'}</td><td>${u.role==='user'&&u.member!=='active'?`<button class="btn sm" data-a="${u.id}">Approve</button>`:''}</td></tr>`).join('');$$('#aBody [data-a]').forEach(b=>b.onclick=()=>{const l=load('pcc_users',[]),u=l.find(x=>x.id===b.dataset.a);u.member='active';save('pcc_users',l);users=l;renderAdmin();toast('Approved')})}

/* ---------- home ---------- */
function renderHome(){$('#hw').textContent='Welcome, '+me.name.split(' ')[0]+'!';
  $('#rcards').innerHTML=ROUTES.map((r,i)=>`<div class="rcd" data-i="${i}" style="animation-delay:${i*.08}s;--rc:${r.color}"><div class="im" style="background-image:url(route-${i+1}.jpg)"></div><div class="tx"><b>${r.name}</b><span>${r.km||'Trail'} route</span></div></div>`).join('');
  $$('#rcards .rcd').forEach(c=>c.onclick=()=>{show('map');setTimeout(()=>$(`#chips .chip[data-i="${c.dataset.i}"]`)?.click(),350)});
  $$('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go))}

/* ---------- theme controls ---------- */
function buildThemePicker(){
  const settingsCard=$('#v-settings .card');
  if(!settingsCard||settingsCard.dataset.themePickerBound)return;
  settingsCard.dataset.themePickerBound='true';
  const picker=document.createElement('div');
  picker.className='theme-picker';
  picker.innerHTML='<div class="sw" style="border-bottom:none;padding-bottom:0"><span>Website color</span></div><div class="theme-panel">'+THEMES.map(theme=>`<button type="button" class="theme-option" data-theme-choice="${theme.id}" aria-label="${theme.name}" aria-pressed="false"><span style="background:${theme.primary}"></span><small>${theme.name}</small></button>`).join('')+'</div>';
  const heading=[...settingsCard.querySelectorAll('h3')].find(el=>el.textContent.includes('Change password'));
  if(heading)settingsCard.insertBefore(picker,heading);else settingsCard.appendChild(picker);
  picker.querySelectorAll('[data-theme-choice]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.themeChoice;applyTheme(id);if(me)me.theme=id;persist();});
  applyTheme(me?.theme || 'green');
}
const themeStyles=document.createElement('style');
themeStyles.textContent=`
  .theme-picker { margin-top: 8px; padding-top: 16px; border-top: 1px solid var(--line); }
  .theme-panel { display:grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); gap: 10px; margin-top: 12px; }
  .theme-option { display:flex; flex-direction:column; align-items:center; gap:8px; padding:10px 8px; border:1px solid var(--line); border-radius:12px; background:var(--card); cursor:pointer; color:var(--ink); }
  .theme-option span { display:block; width:28px; height:28px; border-radius:50%; box-shadow: inset 0 0 0 2px rgba(255,255,255,.55); }
  .theme-option small { font-size:.72rem; font-weight:700; }
  .theme-option.selected { border-color: var(--blue); box-shadow: 0 0 0 2px rgba(22,116,81,.12); }
  body[data-theme="blue"] .theme-option.selected { box-shadow: 0 0 0 2px rgba(37,99,235,.18); }
  body[data-theme="purple"] .theme-option.selected { box-shadow: 0 0 0 2px rgba(124,58,237,.18); }
  body[data-theme="coral"] .theme-option.selected { box-shadow: 0 0 0 2px rgba(224,82,82,.18); }
  body[data-theme="amber"] .theme-option.selected { box-shadow: 0 0 0 2px rgba(194,122,18,.18); }
`;
document.head.appendChild(themeStyles);
setInterval(()=>{if(me && $('#v-settings') && $('#v-settings').classList.contains('on'))buildThemePicker();},400);

// Global theme application for persistent user/admin preference
if (localStorage.getItem('pcc_last_user_email')) {
  const savedTheme = load('pcc_theme_'+localStorage.getItem('pcc_last_user_email').toLowerCase(), 'green');
  document.body.dataset.theme = savedTheme;
  applyTheme(savedTheme);
}

// Keep the selected theme synced across users
setInterval(()=>{
  if(!me) return;
  const active = document.body.dataset.theme || (me.theme || 'green');
  if (active !== (me.theme || 'green')) applyTheme(me.theme || 'green');
  if (me.email) localStorage.setItem('pcc_theme_'+me.email.toLowerCase(), me.theme || 'green');
}, 300);


})();
