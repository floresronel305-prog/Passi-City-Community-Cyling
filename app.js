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
/* ============================================= */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const fallbackLogo=`data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#1769e0" stroke="#fff" stroke-width="6"/><path d="M50 20 L63 48 H85 L68 60 L76 86 L50 70 L24 86 L32 60 L15 48 H37 Z" fill="#fff"/></svg>')}`;
function setLogo(){document.querySelectorAll('.lg').forEach(e=>{const i=new Image();i.alt="Passi City logo";i.className=e.className;i.onerror=()=>{i.onerror=null;i.src=fallbackLogo};i.src=LOGO_URL;});const t=new Image();t.onerror=()=>document.body.style.setProperty('--logo',`url("${fallbackLogo}")`);t.onload=()=>document.body.style.setProperty('--logo',`url("${LOGO_URL}")`);t.src=LOGO_URL}
setLogo();
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3500)}
document.addEventListener('click',e=>{const b=e.target.closest('.btn');if(!b)return;const r=document.createElement('span'),d=Math.max(b.offsetWidth,b.offsetHeight),p=b.getBoundingClientRect();r.className='ripple';r.style.width=r.style.height=d+'px';r.style.left=(e.clientX-p.left-d/2)+'px';r.style.top=(e.clientY-p.top-d/2)+'px';b.appendChild(r);setTimeout(()=>r.remove(),600)});
const sha=async s=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch{return btoa(s)}};
const initials=n=>(n||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
const avatar=(u,cls='av')=>u.avatar?`<img class="${cls}" src="${u.avatar}" alt="">`:`<div class="${cls}">${initials(u.name)}</div>`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function resize(file,max=900){return new Promise(res=>{const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;const x=c.getContext('2d');x.drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.78))};i.src=r.result};r.readAsDataURL(file)})}

/* ---------- data ---------- */
let users=load('pcc_users',[]),me=null,pos=null;
(async()=>{if(!users.find(u=>u.email===ADMIN.email)){users.push({id:'admin',name:ADMIN.name,email:ADMIN.email,pass:await sha(ADMIN.pass),role:'admin',member:'active',plan:'Club',phone:'',addr:'',bio:'',avatar:'',share:true,loc:null});save('pcc_users',users)}
const settings=load('pcc_settings',{dark:false,sound:true});
if(settings.dark)document.body.classList.add('dark');
setTimeout(()=>{$('#splash').classList.add('out');boot()},1800);

/* ---------- location gate ---------- */
function getPos(){return new Promise((ok,no)=>{if(!navigator.geolocation)return no({message:'Geolocation is not supported by this browser.'});navigator.geolocation.getCurrentPosition(p=>{pos=p;ok(p)},e=>no(e),{enableHighAccuracy:true,timeout:10000,maximumAge:0})})}
/* Location is now requested only when the user opens the Map tab (not at login/sign up). */
let locAsked=false;
async function askMapLoc(force){if(pos||(locAsked&&!force))return;locAsked=true;
 try{await getPos();if(me){me.loc={lat:pos.coords.latitude,lng:pos.coords.longitude,t:Date.now()};persist()}
  map.setView([pos.coords.latitude,pos.coords.longitude],15);toast('Location is on.')}
 catch(e){toast('Location is off. Allow location in your browser settings to see yourself on the map.')}}
function boot(){const sid=sessionStorage.getItem('pcc_me');if(sid){const u=users.find(x=>x.id===sid);if(u){me=u;return enter()}}
  /* show the login/sign up forms right away; hide the old location gate */
  $('#forms')?.classList.remove('hidden');['#locBtn','#dot','#locTxt'].forEach(s=>$(s)?.classList.add('hidden'));
  $('#auth').classList.remove('hidden')}
$$('.tabs button').forEach(b=>b.onclick=()=>{$$('.tabs button').forEach(x=>x.classList.toggle('on',x===b));$('#fLogin').classList.toggle('hidden',b.dataset.t!=='login');$('#fSign').classList.toggle('hidden',b.dataset.t!=='signup');$('#fForgot').classList.add('hidden');$('#amsg').textContent='';});
const amsg=(t,ok)=>{$('#amsg').textContent=t;$('#amsg').className='msg'+(ok?' ok':'')};
$('#toForgot').onclick=()=>{$('#fLogin').classList.add('hidden');$('#fForgot').classList.remove('hidden')};
$('#backLogin').onclick=()=>{$('#fForgot').classList.add('hidden');$('#fLogin').classList.remove('hidden')};
$('#fSign').onsubmit=async e=>{e.preventDefault();
  const email=$('#sEmail').value.trim().toLowerCase();if(users.find(u=>u.email===email))return amsg('This email is already registered.');
  const u={id:'u'+Date.now(),name:$('#sName').value.trim(),email,pass:await sha($('#sPass').value),role:'user',member:'none',plan:'Basic',phone:'',addr:'',bio:'',avatar:'',share:true};
  users.push(u);save('pcc_users',users);me=u;login()};
$('#fLogin').onsubmit=async e=>{e.preventDefault();
  const u=users.find(x=>x.email===$('#lEmail').value.trim().toLowerCase());
  if(!u||u.pass!==await sha($('#lPass').value))return amsg('Wrong email or password.');me=u;login()};
function login(){sessionStorage.setItem('pcc_me',me.id);enter()}
/* forgot password: 6-digit code sent to the user's Gmail via EmailJS */
function startCool(){let c=60;const b=$('#sendCode');b.disabled=true;const t=setInterval(()=>{c--;b.textContent=c>0?`Resend code in ${c}s`:'Send code to my email';if(c<=0){b.disabled=false;clearInterval(t);b.textContent='Send code to my email';}},1000)}
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
  initMap();show('home')}
function persist(){const i=users.findIndex(u=>u.id===me.id);users[i]=me;save('pcc_users',users)}
function show(v){$$('.view').forEach(x=>x.classList.toggle('on',x.id==='v-'+v));$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));
  if(v==='map'){setTimeout(()=>map.invalidateSize(),50);askMapLoc()}({home:renderHome,bike:renderBikes,member:renderMember,chat:renderChat,photos:renderPhotos,profile:fillProfile,settings:fillSettings,admin:renderAdmin}[v]?.())}

/* ---------- map + routes + live GPS ---------- */
let map,meMarker,acc,trail,watch=null,trailPts=[],dist=0,others=L.layerGroup(),ctrls=[],routeLayers={};
function initMap(){if(map)return;map=L.map('map').setView([11.1086,122.6411],12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);others.addTo(map);
  $('#chips').innerHTML=ROUTES.map((r,i)=>`<button class="chip" data-i="${i}" style="border-color:${r.color};color:${r.color}">${r.name}</button>`).join('');
  ROUTES.forEach((r,i)=>{const c=L.Routing.control({waypoints:r.pts.map(p=>L.latLng(p)),router:L.Routing.osrmv1({serviceUrl:'https://router.project-osrm.org/route/v1',profile:'driving'}),
   lineOptions:{styles:[{color:'#fff',weight:9,opacity:.9},{color:r.color,weight:5}],addWaypoints:false},addWaypoints:false,draggableWaypoints:false,fitSelectedRoutes:false,show:false,
   createMarker:(j,wp)=>j===0||j===r.pts.length-1?L.marker(wp.latLng).bindPopup(`<b>${r.name}</b>${j===0?' (start)':' (end)'}`):null}).addTo(map);
   c.on('routesfound',e=>{r.km=(e.routes[0].summary.totalDistance/1000).toFixed(1);r.bounds=L.latLngBounds(e.routes[0].coordinates)});ctrls.push(c)});
  $('#chips').onclick=e=>{const b=e.target.closest('.chip');if(!b)return;const r=ROUTES[b.dataset.i];if(r.bounds)map.fitBounds(r.bounds,{padding:[40,40]});$('#sRoute').textContent=r.km?r.km+' km':'–'};
  map.on('layeradd',()=>{});setInterval(drawOthers,5000);drawOthers()}
function drawOthers(){others.clearLayers();load('pcc_users',[]).forEach(u=>{if(u.id===me?.id||!u.share||!u.loc||Date.now()-u.loc.t>3600000)return;L.circleMarker([u.loc.lat,u.loc.lng],{radius:8,color:'#1d4ed8',fillOpacity:.7}).addTo(others)})}
function onPos(p){const ll=[p.coords.latitude,p.coords.longitude];pos=p;
  if(!meMarker){meMarker=L.marker(ll,{icon:L.divIcon({className:'',html:'<div class="pulse"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(map);acc=L.circle(ll,{radius:p.coords.accuracy,color:'#3b82f6',fillColor:'#3b82f6',fillOpacity:.18}).addTo(map)}
  else{meMarker.setLatLng(ll);acc.setLatLng(ll).setRadius(p.coords.accuracy)}
  if(trailPts.length)dist+=map.distance(trailPts[trailPts.length-1],ll);trailPts.push(ll);trail=trail?trail: L.polyline([], {color:'#22c55e', weight:5, opacity:.9}).addTo(map);trail.setLatLngs(trailPts);
  $('#sDist').textContent=(dist/1000).toFixed(2);$('#sSpd').textContent=p.coords.speed?Math.round(p.coords.speed*3.6):0;
  if(me.share){me.loc={lat:ll[0],lng:ll[1],t:Date.now()};persist()}}
$('#rideBtn').onclick=()=>{if(watch!==null){navigator.geolocation.clearWatch(watch);watch=null;$('#rideBtn').textContent='Start live GPS';return toast('Ride stopped')}
  watch=navigator.geolocation.watchPosition(onPos,()=>toast('Cannot get GPS. Turn on location.'),{enableHighAccuracy:true,maximumAge:1000});$('#rideBtn').textContent='Stop live GPS';toast('Live GPS started')}
$('#centerBtn').onclick=()=>meMarker?map.setView(meMarker.getLatLng(),17):toast('Start live GPS first.');

/* ---------- bike form ---------- */
const bikes=()=>load('pcc_bikes',[]);
$('#bikeForm').onsubmit=async e=>{e.preventDefault();const f=$('#bPhoto').files[0],b=bikes();b.push({id:Date.now(),owner:me.id,name:$('#bName').value,type:$('#bType').value,brand:$('#bBrand').value,color:$('#bColor').value,serial:$('#bSerial').value,photo:f?await resize(f,900):''});save('pcc_bikes',b);$('#bikeForm').reset();renderBikes();toast('Bike saved')};
function renderBikes(){const l=bikes().filter(b=>b.owner===me.id||me.role==='admin');$('#bikeList').innerHTML=l.length?l.map(b=>`<div style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)"><div class="av" style="background:linear-gradient(135deg,#e0f2fe,#bfdbfe);color:#0f172a">🚲</div><div style="flex:1"><b>${esc(b.name)}</b><div style="font-size:.8rem;color:var(--mute)">${esc(b.type)} · ${esc(b.brand||'Unknown brand')}</div></div><button class="link" data-d="${b.id}">Delete</button></div>`).join(''):'<p style="color:var(--mute)">No bikes added yet.</p>';
  $$('#bikeList [data-d]').forEach(x=>x.onclick=()=>{save('pcc_bikes',bikes().filter(b=>b.id!=x.dataset.d));renderBikes()})}

/* ---------- membership ---------- */
function renderMember(){$('#mStat').textContent=me.member==='active'?'Active · '+me.plan:me.member==='pending'?'Pending approval · '+me.plan:'Not a member';$('#mStat').className='badge '+(me.member==='active'?'active':me.member==='pending'?'pending':'idle');
  $('#plans').innerHTML=PLANS.map(p=>`<div class="card plan"><h3>${p.id}</h3><div class="pr">${p.price}</div><ul>${p.perks.map(x=>`<li>✓ ${x}</li>`).join('')}</ul><button class="btn" data-p="${p.id}">${me.plan===p.id?'Current plan':'Choose plan'}</button></div>`).join('');
  $$('#plans [data-p]').forEach(b=>b.onclick=()=>{me.plan=b.dataset.p;me.member=b.dataset.p==='Basic'?'active':'pending';persist();renderMember();toast(me.member==='active'?'You are now a Basic member.':'Membership requested.');})}

/* ---------- chat (live between tabs via storage event) ---------- */
let chatWith='all';const msgs=()=>load('pcc_msgs',[]);
function renderChat(){const us=load('pcc_users',[]).filter(u=>u.id!==me.id);
  $('#cl').innerHTML=`<div class="ci ${chatWith==='all'?'on':''}" data-id="all"><div class="av">👥</div><b>Community</b></div>`+us.map(u=>`<div class="ci ${chatWith===u.id?'on':''}" data-id="${u.id}"><div class="av">${initials(u.name)}</div><b>${esc(u.name)}</b></div>`).join('');
  $$('.ci').forEach(c=>c.onclick=()=>{chatWith=c.dataset.id;renderChat()});
  const peer=us.find(u=>u.id===chatWith);$('#cH').textContent=chatWith==='all'?'Community':peer?peer.name:'Community';
  const list=msgs().filter(m=>chatWith==='all'?m.to==='all':(m.from===me.id&&m.to===chatWith)||(m.from===chatWith&&m.to===me.id));
  $('#cM').innerHTML=list.length?list.map(m=>`<div class="b ${m.from===me.id?'me':''}"><small>${m.from===me.id?'You':esc(load('pcc_users',[]).find(u=>u.id===m.from)?.name||'?')}</small><div>${esc(m.text)}</div></div>`).join(''):'<div class="chat-empty">No messages yet.</div>';
  $('#cM').scrollTop=1e9}
$('#cF').onsubmit=e=>{e.preventDefault();const t=$('#cI').value.trim();if(!t)return;const m=msgs();m.push({from:me.id,to:chatWith,text:t,t:Date.now()});save('pcc_msgs',m);$('#cI').value='';renderChat()};
addEventListener('storage',e=>{if(e.key==='pcc_msgs'&&me&&$('#v-chat').classList.contains('on'))renderChat()});

/* ---------- photos ---------- */
const photos=()=>load('pcc_photos',[]);
$('#pBtn').onclick=async()=>{const fs=[...$('#pUp').files];if(!fs.length)return toast('Choose a photo first.');const p=photos();for(const f of fs)p.unshift({id:Date.now()+Math.random(),by:me.name,owner:me.id,cap:$('#pCap').value||'Ride photo',src:await resize(f,1600)});save('pcc_photos',p);$('#pUp').value='';$('#pCap').value='';renderPhotos();toast('Photos uploaded')};
function renderPhotos(){$('#gal').innerHTML=photos().map(p=>`<figure><img src="${p.src}" alt="${esc(p.cap||'Ride photo')}"><figcaption>${esc(p.cap||'')} <i>by ${esc(p.by)}</i>${p.owner===me.id||me.role==='admin' ? `<button class="link" data-x="${p.id}">Delete</button>`:''}</figcaption></figure>`).join('');
  $$('#gal [data-x]').forEach(a=>a.onclick=e=>{e.preventDefault();save('pcc_photos',photos().filter(p=>p.id!=a.dataset.x));renderPhotos()})}

/* ---------- profile / settings ---------- */
function fillProfile(){$('#pfName').value=me.name;$('#pfEmail').value=me.email;$('#pfPhone').value=me.phone||'';$('#pfAddr').value=me.addr||'';$('#pfBio').value=me.bio||'';$('#pAv').outerHTML=avatar(me).replace('class="av"','class="av" id="pAv"').replace('<img class="av"','<img id="pAv" class="av"');}
$('#pPic').onchange=async e=>{if(e.target.files[0]){me.avatar=await resize(e.target.files[0],240);persist();fillProfile();toast('Photo selected. Click Save profile.')}};
$('#pf').onsubmit=e=>{e.preventDefault();Object.assign(me,{name:$('#pfName').value,phone:$('#pfPhone').value,addr:$('#pfAddr').value,bio:$('#pfBio').value});persist();$('#hName').textContent=me.name.split(' ')[0];toast('Profile saved')};
function fillSettings(){$('#tDark').classList.toggle('on',settings.dark);$('#tShare').classList.toggle('on',!!me.share);$('#tSound').classList.toggle('on',settings.sound)}
$('#tDark').onclick=()=>{settings.dark=!settings.dark;document.body.classList.toggle('dark',settings.dark);save('pcc_settings',settings);fillSettings()};
$('#tSound').onclick=()=>{settings.sound=!settings.sound;save('pcc_settings',settings);fillSettings()};
$('#tShare').onclick=()=>{me.share=!me.share;persist();fillSettings()};
$('#cpBtn').onclick=async()=>{if(me.pass!==await sha($('#cpOld').value))return toast('Current password is wrong.');if($('#cpNew').value.length<6)return toast('New password needs 6+ characters.');me.pass=await sha($('#cpNew').value);persist();toast('Password updated.')};
$('#logout').onclick=()=>{sessionStorage.removeItem('pcc_me');location.reload()};

/* ---------- admin ---------- */
function renderAdmin(){const us=load('pcc_users',[]);$('#aStats').innerHTML=`<div><b>${us.length}</b><span>Users</span></div><div><b>${us.filter(u=>u.member==='active').length}</b><span>Active members</span></div><div><b>${us.filter(u=>u.role==='admin').length}</b><span>Admins</span></div>`;
  $('#aBody').innerHTML=us.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role}</td><td><span class="badge ${u.member}">${u.member==='none'?'–':u.plan+' · '+u.member}</span></td><td>${u.loc?`${u.loc.lat.toFixed(4)}, ${u.loc.lng.toFixed(4)}`:'None'}</td><td>${u.role==='admin'?'':`<button class="link" data-a="${u.id}">Approve</button>`}</td></tr>`).join('');
  $$('#aBody [data-a]').forEach(b=>b.onclick=()=>{const l=load('pcc_users',[]),u=l.find(x=>x.id===b.dataset.a);u.member='active';save('pcc_users',l);users=l;renderAdmin();toast('Approved')})}

/* ---------- home ---------- */
function renderHome(){$('#hw').textContent='Welcome, '+me.name.split(' ')[0]+'!';
  $('#rcards').innerHTML=ROUTES.map((r,i)=>`<div class="rcd" data-i="${i}" style="animation-delay:${i*.08}s;--rc:${r.color}"><div class="im" style="background-image:url(route-${i+1}.jpg);background-size:cover;background-position:center"></div><div class="rct"><b>${r.name}</b><span>${r.km||'Route'} km</span></div></div>`).join('');
  $$('#rcards .rcd').forEach(c=>c.onclick=()=>{show('map');setTimeout(()=>$(`#chips .chip[data-i="${c.dataset.i}"]`)?.click(),350)});
  $$('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go))}
})();
