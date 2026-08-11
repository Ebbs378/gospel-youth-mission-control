
const cfg=window.MISSION_CONFIG;
const client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseKey);
const $=id=>document.getElementById(id);
const DAYS=[["2026-08-29","Sa","29. Aug","Anreise"],["2026-08-30","So","30. Aug","Ankunft"],["2026-08-31","Mo","31. Aug","Identität"],["2026-09-01","Di","1. Sep","Metanoia"],["2026-09-02","Mi","2. Sep","Gaben"],["2026-09-03","Do","3. Sep","Ausflug"],["2026-09-04","Fr","4. Sep","Gnade"],["2026-09-05","Sa","5. Sep","Alltag"],["2026-09-06","So","6. Sep","Zeugnisse"],["2026-09-07","Mo","7. Sep","Heimfahrt"]];
const defaults={settings:{id:null,event_title:"Sommerfestival 2026",event_subtitle:"Heaven Now",intro:"Social-Media-Planung für das gesamte Team.",instagram_url:"",tiktok_url:"",heading_morning:"Morgen",heading_midday:"Mittag",heading_evening:"Abend"},members:[],program:[],tasks:[],content:[],goals:[]};
let state=structuredClone(defaults),selectedDate=DAYS[0][0],category="all",adminSession=null,editing=null,teamFilter="all";

function esc(s=""){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function fmt(d){return new Date(d+"T12:00:00").toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"long"})}
function timeVal(t){return (t||"").slice(0,5)}
function toggleTheme(){const n=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=n;localStorage.setItem("gyTheme8",n)}
document.documentElement.dataset.theme=localStorage.getItem("gyTheme8")||"dark";

async function loadAll(){
 $("connectionStatus").className="status-banner";$("connectionStatus").textContent="Daten werden aus Supabase geladen …";
 try{
  const [s,m,p,t,c,i,g]=await Promise.all([
   client.from("app_settings").select("*").limit(1),
   client.from("team_members").select("*").order("name"),
   client.from("program_items").select("*").order("event_date").order("start_time"),
   client.from("tasks").select("*").order("event_date").order("start_time"),
   client.from("content_items").select("*").order("event_date").order("shoot_time"),
   client.from("content_images").select("*").order("created_at"),
   client.from("daily_goals").select("*").order("event_date")
  ]);
  for(const r of [s,m,p,t,c,i,g]) if(r.error) throw r.error;
  state.settings=s.data[0]||defaults.settings;
  state.members=m.data||[];
  state.goals=g.data||[];
  state.program=(p.data||[]).map(x=>({id:x.id,date:x.event_date,time:timeVal(x.start_time),daypart:x.daypart,title:x.title,speaker:x.speaker,desc:x.description,photographer:x.photographer,story_coordinator:x.story_coordinator,story_maker:x.story_maker,reel_maker:x.reel_maker,interviewer:x.interviewer||""}));
  state.tasks=(t.data||[]).map(x=>({id:x.id,program_id:x.program_id,date:x.event_date,time:timeVal(x.start_time),category:x.category||roleToCategory(x.role),title:x.title,owner:x.owner,role:x.role,desc:x.description,done:x.done}));
  state.content=(c.data||[]).map(x=>({id:x.id,program_id:x.program_id,date:x.event_date,kind:x.kind,category:x.category||kindToCategory(x.kind),title:x.title,description:x.description,owner:x.owner,shoot_time:timeVal(x.shoot_time),publish_time:timeVal(x.publish_time),social_url:x.social_url,status:x.status,images:(i.data||[]).filter(im=>im.content_id===x.id).map(im=>({id:im.id,url:im.image_url,caption:im.caption}))}));
  $("connectionStatus").className="status-banner ok";$("connectionStatus").textContent="Live mit Supabase verbunden";
  renderAll();if(adminSession)renderAdminPanels();
 }catch(e){
  $("connectionStatus").className="status-banner error";$("connectionStatus").textContent="Supabase-Fehler: "+e.message;console.error(e)
 }
}

function roleToCategory(role=""){const x=role.toLowerCase();if(x.includes("foto"))return"photo";if(x.includes("reel"))return"reel";if(x.includes("interview"))return"interview";return"story"}
function kindToCategory(kind=""){return({Reel:"reel",Story:"story",Foto:"photo",Interview:"interview"})[kind]||"story"}
function categoryLabel(c){return({all:"Gesamt",story:"Stories",photo:"Fotograf",reel:"Reels",interview:"Interviews"})[c]||c}
function renderHeader(){const s=state.settings;$("eventTitle").textContent=s.event_title||"Sommerfestival 2026";$("eventSubtitle").textContent=s.event_subtitle||"Heaven Now";$("eventIntro").textContent=s.intro||"";$("igTop").href=s.instagram_url||"#";$("ttTop").href=s.tiktok_url||"#"}
function renderDays(){$("dayStrip").innerHTML=DAYS.map(d=>`<button class="day-btn ${d[0]===selectedDate?"active":""}" onclick="selectDay('${d[0]}')"><strong>${d[1]} · ${d[2]}</strong><small>${d[3]}</small></button>`).join("")}
function selectDay(d){selectedDate=d;renderAll()}
function setCategory(c,b){category=c;document.querySelectorAll(".category").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderAll()}
function categoryMatchesTask(t){return category==="all"||t.category===category}
function categoryMatchesProgram(p){if(category==="all")return true;const k={story:"story_maker",photo:"photographer",reel:"reel_maker",interview:"interviewer"}[category];return !!p[k]||state.tasks.some(t=>t.program_id===p.id&&t.category===category)||state.content.some(c=>c.program_id===p.id&&c.category===category)}

function renderGoals(){
 const g=state.goals.find(x=>x.event_date===selectedDate)||{};
 const all=state.content.filter(c=>c.date===selectedDate);
 const done=c=>["Veröffentlicht","Freigabe"].includes(c.status);
 const vals=[
  ["Stories",all.filter(c=>c.category==="story"&&done(c)).length,+g.stories_goal||0],
  ["Reels",all.filter(c=>c.category==="reel"&&done(c)).length,+g.reels_goal||0],
  ["Foto-Uploads",all.filter(c=>c.category==="photo"&&done(c)).length,+g.photos_goal||0],
  ["Interviews",all.filter(c=>c.category==="interview"&&done(c)).length,+g.interviews_goal||0]
 ];
 $("goalsCard").innerHTML=`<div class="eyebrow">Content-Ziele · ${fmt(selectedDate)}</div><div class="goal-grid">${vals.map(([n,a,b])=>`<div class="goal"><div class="goal-top"><span>${n}</span><strong>${a} / ${b||"—"}</strong></div><div class="progress"><i style="width:${b?Math.min(100,a/b*100):0}%"></i></div></div>`).join("")}</div>`
}
function renderSummary(){
 const ps=state.program.filter(p=>p.date===selectedDate&&categoryMatchesProgram(p)),ts=state.tasks.filter(t=>t.date===selectedDate&&categoryMatchesTask(t)),cs=state.content.filter(c=>c.date===selectedDate&&(category==="all"||c.category===category));
 $("summaryCard").innerHTML=`<div class="eyebrow">${fmt(selectedDate)}</div><h2>${categoryLabel(category)}</h2><p>${ps.length} Programmpunkte · ${ts.length} Aufgaben · ${cs.length} Content-Einträge</p><div class="summary-meta"><span class="chip">${esc(state.settings.event_title)}</span><span class="chip">${esc(state.settings.event_subtitle)}</span></div>`
}
function renderAssignments(){
 const ps=state.program.filter(p=>p.date===selectedDate),collect=k=>[...new Set(ps.map(p=>p[k]).filter(Boolean))].join(", ")||"Offen";
 $("assignmentOverview").innerHTML=`<div class="section-label">Gesamtbesetzung für den Tag</div><div class="assignment-grid">${[["Story-Koordinator","story_coordinator"],["Story-Maker","story_maker"],["Fotograf","photographer"],["Reel-Maker","reel_maker"],["Interviews","interviewer"]].map(([l,k])=>`<div class="assignment-card"><span>${l}</span><strong>${esc(collect(k))}</strong></div>`).join("")}</div>`
}
function roleBoxes(p){
 const all=[["Fotograf",p.photographer,"photo"],["Story-Koord.",p.story_coordinator,"story"],["Story-Maker",p.story_maker,"story"],["Reel-Maker",p.reel_maker,"reel"],["Interviews",p.interviewer,"interview"]];
 const f=category==="all"?all:all.filter(x=>x[2]===category);
 return `<div class="role-grid">${f.map(x=>`<div class="role-box"><span>${x[0]}</span><strong>${esc(x[1]||"Offen")}</strong></div>`).join("")}</div>`
}
function embedHtml(url){
 if(!url)return"";
 try{
  const u=new URL(url);
  if(u.hostname.includes("tiktok.com")){
   const m=u.pathname.match(/\/video\/(\d+)/);if(m)return `<div class="embed-wrap"><iframe loading="lazy" allow="fullscreen" src="https://www.tiktok.com/player/v1/${m[1]}"></iframe></div>`
  }
  if(u.hostname.includes("instagram.com")){
   const clean=url.split("?")[0].replace(/\/?$/,"/");return `<div class="embed-wrap"><iframe loading="lazy" allowtransparency="true" src="${esc(clean)}embed/"></iframe></div>`
  }
 }catch(e){}
 return""
}
function contentMini(c){
 const embedded=embedHtml(c.social_url);
 return `<div class="content-card"><div class="content-top"><div><strong>${esc(c.kind)} · ${esc(c.title)}</strong><div class="content-meta">Dreh ${esc(c.shoot_time)} · Upload ${esc(c.publish_time)} · ${esc(c.owner)}</div></div><span class="chip">${esc(c.status)}</span></div><p>${esc(c.description)}</p>${embedded}${c.social_url?`<a class="small-btn" target="_blank" href="${esc(c.social_url)}">Original öffnen ↗</a>`:""}${c.images.length?`<div class="content-images">${c.images.map(i=>`<figure onclick="openImageViewer('${esc(i.url)}',${JSON.stringify(i.caption||"")})"><img src="${esc(i.url)}" alt=""><figcaption>${esc(i.caption||"Ohne Beschreibung")}</figcaption></figure>`).join("")}</div>`:""}</div>`
}
function programCard(p){
 const tasks=state.tasks.filter(t=>t.program_id===p.id&&categoryMatchesTask(t)),cont=state.content.filter(c=>c.program_id===p.id&&(category==="all"||c.category===category));
 return `<article class="program-card glass"><div class="program-head"><div class="program-time">${esc(p.time)}</div><div class="program-title-wrap"><h3 class="program-title">${esc(p.title)}</h3><div class="speaker">Sprecher: ${esc(p.speaker||"—")}</div></div></div><p class="program-desc">${esc(p.desc)}</p>${roleBoxes(p)}${tasks.length?`<div class="inner-section"><div class="inner-title">Aufgaben</div>${tasks.map(t=>`<div class="task"><div><strong>${esc(t.time)} · ${esc(t.title)}</strong><small>${esc(t.owner)} · ${esc(t.desc)}</small></div><button class="small-btn" onclick='downloadICS(${JSON.stringify(t)})'>Kalender</button></div>`).join("")}</div>`:""}${cont.length?`<div class="inner-section"><div class="inner-title">Content & Inspiration</div>${cont.map(contentMini).join("")}</div>`:""}</article>`
}
function renderDayparts(){
 const s=state.settings,parts=[["morning",s.heading_morning||"Morgen"],["midday",s.heading_midday||"Mittag"],["evening",s.heading_evening||"Abend"]];
 $("dayparts").innerHTML=parts.map(([key,title])=>{const arr=state.program.filter(p=>p.date===selectedDate&&p.daypart===key&&categoryMatchesProgram(p));return `<section class="daypart"><div class="daypart-head"><h2>${esc(title)}</h2></div><div class="program-list">${arr.length?arr.map(programCard).join(""):`<div class="empty">In dieser Kategorie ist hier noch nichts eingetragen.</div>`}</div></section>`}).join("")
}

function teamRoleMatch(m,f){
 const roles=(m.roles||[]).join(" ").toLowerCase();
 if(f==="all")return true;if(f==="photo")return roles.includes("foto");if(f==="coord")return roles.includes("koordinator");if(f==="story")return roles.includes("story-maker")||roles.includes("story maker");if(f==="reel")return roles.includes("reel");if(f==="interview")return roles.includes("interview");return true
}
function renderTeam(){
 const people=state.members.filter(m=>teamRoleMatch(m,teamFilter));
 $("teamDirectory").innerHTML=`<div class="section-label">Social-Media-Team</div><h2>Alle Mitarbeiter</h2><p>Kontakte und Rollen für schnelle Abstimmung vor Ort.</p><div class="team-filter">${[["all","Alle"],["photo","Fotografen"],["coord","Story-Koord."],["story","Story-Maker"],["reel","Reels"],["interview","Interviews"]].map(([k,l])=>`<button onclick="teamFilter='${k}';renderTeam()">${l}</button>`).join("")}</div><div class="team-grid">${people.map(m=>`<div class="person-card"><h3>${esc(m.name)}</h3><p>${(m.roles||[]).map(esc).join(" · ")||"Noch keine Rolle"}</p><div class="person-links">${m.phone?`<a class="small-btn" href="tel:${esc(m.phone)}">Anrufen</a><a class="small-btn" target="_blank" href="https://wa.me/${esc(m.phone.replace(/\D/g,""))}">WhatsApp</a>`:""}${m.email?`<a class="small-btn" href="mailto:${esc(m.email)}">E-Mail</a>`:""}</div></div>`).join("")||`<div class="empty">Noch niemand in dieser Kategorie.</div>`}</div>`
}
function personAssignments(n){
 const rolePrograms=state.program.filter(p=>[p.photographer,p.story_coordinator,p.story_maker,p.reel_maker,p.interviewer].includes(n)).map(p=>({date:p.date,time:p.time,title:p.title,category:"program",desc:"Programmpunkt"}));
 const tasks=state.tasks.filter(t=>t.owner===n);
 const uniq=[...rolePrograms,...tasks].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 return uniq
}
function renderMySchedule(){
 $("mySchedule").innerHTML=`<div class="section-label">Persönlicher Plan</div><h2>Meine Einsätze</h2><p>Name auswählen – dafür ist kein Login nötig.</p><select class="schedule-select" onchange="showPersonSchedule(this.value)"><option value="">Person auswählen …</option>${state.members.map(m=>`<option>${esc(m.name)}</option>`).join("")}</select><div id="personSchedule"></div>`
}
function showPersonSchedule(n){
 const a=personAssignments(n),e=$("personSchedule");if(!n){e.innerHTML="";return}
 e.innerHTML=`<button class="primary-btn" onclick='downloadPersonICS(${JSON.stringify(n)})'>Alle Einsätze in Kalender</button><div class="schedule-list" style="margin-top:12px">${a.map(t=>`<div class="schedule-item"><strong>${fmt(t.date)} · ${esc(t.time)}</strong><div>${esc(t.title)}</div><small>${t.category==="program"?"Programmpunkt":categoryLabel(t.category)} · ${esc(t.desc)}</small></div>`).join("")||`<div class="empty">Keine Einsätze.</div>`}</div>`
}
function downloadPersonICS(n){
 const a=personAssignments(n);let x="BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Gospel Youth//Mission Control//DE\n";
 a.forEach(t=>{const d=t.date.replaceAll("-",""),s=(t.time||"12:00").replace(":","")+"00",h=String((+s.slice(0,2)+1)%24).padStart(2,"0");x+=`BEGIN:VEVENT\nDTSTART:${d}T${s}\nDTEND:${d}T${h}${s.slice(2)}\nSUMMARY:${t.title}\nDESCRIPTION:${(t.desc||"").replaceAll("\n"," ")}\nEND:VEVENT\n`});x+="END:VCALENDAR";
 const q=document.createElement("a");q.href=URL.createObjectURL(new Blob([x],{type:"text/calendar"}));q.download=n.replaceAll(" ","-")+"-Sommerfestival-2026.ics";q.click()
}
function openImageViewer(url,caption){$("viewerImage").src=url;$("viewerCaption").textContent=caption;$("imageViewer").classList.remove("hidden")}
function closeImageViewer(){$("imageViewer").classList.add("hidden")}

function renderAll(){renderHeader();renderDays();renderGoals();renderSummary();renderAssignments();renderDayparts();renderTeam();renderMySchedule()}

async function openAdmin(){$("adminOverlay").classList.remove("hidden");const {data}=await client.auth.getSession();adminSession=data.session;renderAdmin()}
function closeAdmin(){$("adminOverlay").classList.add("hidden")}
async function loginAdmin(){const email=$("adminEmail").value.trim(),password=$("adminPassword").value;$("loginMessage").textContent="Anmeldung …";const {data,error}=await client.auth.signInWithPassword({email,password});if(error){$("loginMessage").textContent=error.message;return}adminSession=data.session;$("loginMessage").textContent="";renderAdmin()}
async function logoutAdmin(){await client.auth.signOut();adminSession=null;renderAdmin()}
function renderAdmin(){$("adminLogin").classList.toggle("hidden",!!adminSession);$("adminApp").classList.toggle("hidden",!adminSession);if(adminSession){$("adminUser").textContent=adminSession.user.email;renderAdminPanels()}}
function showAdminTab(name,b){document.querySelectorAll(".admin-panel").forEach(x=>x.classList.remove("active"));$("admin-"+name).classList.add("active");document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active")}
function actionBtns(type,id){return `<div class="admin-actions"><button class="small-btn" onclick="openForm('${type}','${id}')">Bearbeiten</button><button class="danger-btn" onclick="removeItem('${type}','${id}')">Löschen</button></div>`}
function renderAdminPanels(){
 $("admin-overview").innerHTML=`<div class="admin-grid">${DAYS.map(d=>{const ps=state.program.filter(p=>p.date===d[0]),open=ps.reduce((n,p)=>n+[p.photographer,p.story_coordinator,p.story_maker,p.reel_maker,p.interviewer].filter(x=>!x).length,0);return `<div class="admin-card"><h3>${d[1]} · ${d[2]}</h3><p>${d[3]} · ${ps.length} Programmpunkte · ${open} Rollen offen</p><div class="admin-actions"><button class="small-btn" onclick="selectedDate='${d[0]}';renderAll();closeAdmin()">Tag öffnen</button></div></div>`}).join("")}</div>`;
 $("admin-program").innerHTML=`<div class="admin-card"><div class="admin-card-head"><div><h3>Programm verwalten</h3><p>Programmpunkte, Sprecher und Besetzungen.</p></div><button class="primary-btn" onclick="openForm('program')">Neu</button></div></div><div class="admin-grid" style="margin-top:10px">${state.program.map(p=>`<div class="admin-card"><h3>${esc(p.date)} · ${esc(p.time)} · ${esc(p.title)}</h3><p>Sprecher: ${esc(p.speaker)}<br>${esc(p.desc)}</p>${actionBtns("program",p.id)}</div>`).join("")}</div>`;
 $("admin-content").innerHTML=`<div class="admin-card"><div class="admin-card-head"><div><h3>Content verwalten</h3><p>Reels, Stories, Fotos, Interviews und Inspiration.</p></div><button class="primary-btn" onclick="openForm('content')">Neu</button></div></div><div class="admin-grid" style="margin-top:10px">${state.content.map(c=>`<div class="admin-card"><h3>${esc(c.kind)} · ${esc(c.title)}</h3><p>${esc(c.date)} · ${esc(c.owner)} · Upload ${esc(c.publish_time)} · ${c.images.length} Bilder</p>${actionBtns("content",c.id)}</div>`).join("")}</div>`;
 $("admin-tasks").innerHTML=`<div class="admin-card"><div class="admin-card-head"><div><h3>Aufgaben verwalten</h3><p>Aufgaben direkt Programmpunkten zuordnen.</p></div><button class="primary-btn" onclick="openForm('task')">Neu</button></div></div><div class="admin-grid" style="margin-top:10px">${state.tasks.map(t=>`<div class="admin-card"><h3>${esc(t.date)} · ${esc(t.time)} · ${esc(t.title)}</h3><p>${esc(t.owner)} · ${categoryLabel(t.category)}<br>${esc(t.desc)}</p>${actionBtns("task",t.id)}</div>`).join("")}</div>`;
 $("admin-team").innerHTML=`<div class="admin-card"><div class="admin-card-head"><div><h3>Team verwalten</h3><p>Kontaktdaten und Rollen.</p></div><button class="primary-btn" onclick="openForm('member')">Neu</button></div></div><div class="admin-grid" style="margin-top:10px">${state.members.map(m=>`<div class="admin-card"><h3>${esc(m.name)}</h3><p>${esc(m.email||"")} · ${esc(m.phone||"Keine Nummer")}<br>${(m.roles||[]).map(esc).join(" · ")}</p>${actionBtns("member",m.id)}</div>`).join("")}</div>`;
 $("admin-goals").innerHTML=`<div class="admin-card"><div class="admin-card-head"><div><h3>Tagesziele</h3><p>Stories, Reels, Foto-Uploads und Interviews.</p></div><button class="primary-btn" onclick="openForm('goal')">Ziel setzen</button></div></div><div class="admin-grid" style="margin-top:10px">${state.goals.map(g=>`<div class="admin-card"><h3>${esc(g.event_date)}</h3><p>Stories ${g.stories_goal} · Reels ${g.reels_goal} · Fotos ${g.photos_goal} · Interviews ${g.interviews_goal}</p><button class="small-btn" onclick="openForm('goal','${g.id}')">Bearbeiten</button></div>`).join("")}</div>`;
 $("admin-settings").innerHTML=`<div class="admin-card"><div class="admin-card-head"><div><h3>Event & Links</h3><p>Texte, Überschriften, Instagram und TikTok.</p></div><button class="primary-btn" onclick="openForm('settings')">Bearbeiten</button></div></div>`
}
function optionsMembers(selected=""){return `<option value="">Offen</option>`+state.members.map(m=>`<option ${m.name===selected?"selected":""}>${esc(m.name)}</option>`).join("")}
function optionsPrograms(selected=""){return state.program.map(p=>`<option value="${p.id}" ${p.id===selected?"selected":""}>${esc(p.date)} · ${esc(p.time)} · ${esc(p.title)}</option>`).join("")}
function openForm(type,id=null){
 editing={type,id};let item=null;if(id){const k=type==="member"?"members":type==="program"?"program":type==="content"?"content":type==="goal"?"goals":"tasks";item=state[k].find(x=>x.id===id)}
 let h="";
 if(type==="program")h=`<div class="form-grid two"><div class="field"><label>Datum</label><input id="fDate" type="date" value="${item?.date||selectedDate}"></div><div class="field"><label>Uhrzeit</label><input id="fTime" type="time" value="${item?.time||"10:00"}"></div><div class="field"><label>Tageszeit</label><select id="fDaypart">${["morning","midday","evening"].map(x=>`<option value="${x}" ${item?.daypart===x?"selected":""}>${x==="morning"?"Morgen":x==="midday"?"Mittag":"Abend"}</option>`).join("")}</select></div><div class="field"><label>Sprecher</label><input id="fSpeaker" value="${esc(item?.speaker)}"></div><div class="field full"><label>Überschrift</label><input id="fTitle" value="${esc(item?.title)}"></div><div class="field full"><label>Beschreibung</label><textarea id="fDesc">${esc(item?.desc)}</textarea></div><div class="field"><label>Fotograf</label><select id="fPhoto">${optionsMembers(item?.photographer)}</select></div><div class="field"><label>Story-Koordinator</label><select id="fCoord">${optionsMembers(item?.story_coordinator)}</select></div><div class="field"><label>Story-Maker</label><select id="fStory">${optionsMembers(item?.story_maker)}</select></div><div class="field"><label>Reel-Maker</label><select id="fReel">${optionsMembers(item?.reel_maker)}</select></div><div class="field"><label>Interviews</label><select id="fInterview">${optionsMembers(item?.interviewer)}</select></div></div>`;
 if(type==="task")h=`<div class="form-grid two"><div class="field full"><label>Programmpunkt</label><select id="fProgram">${optionsPrograms(item?.program_id)}</select></div><div class="field"><label>Datum</label><input id="fDate" type="date" value="${item?.date||selectedDate}"></div><div class="field"><label>Uhrzeit</label><input id="fTime" type="time" value="${item?.time||"10:00"}"></div><div class="field"><label>Kategorie</label><select id="fCategory">${["story","photo","reel","interview"].map(x=>`<option value="${x}" ${item?.category===x?"selected":""}>${categoryLabel(x)}</option>`).join("")}</select></div><div class="field"><label>Person</label><select id="fOwner">${optionsMembers(item?.owner)}</select></div><div class="field full"><label>Aufgabe</label><input id="fTitle" value="${esc(item?.title)}"></div><div class="field full"><label>Beschreibung</label><textarea id="fDesc">${esc(item?.desc)}</textarea></div></div>`;
 if(type==="content")h=`<div class="form-grid two"><div class="field full"><label>Programmpunkt</label><select id="fProgram">${optionsPrograms(item?.program_id)}</select></div><div class="field"><label>Datum</label><input id="fDate" type="date" value="${item?.date||selectedDate}"></div><div class="field"><label>Typ</label><select id="fKind">${["Reel","Story","Foto","Interview"].map(x=>`<option ${item?.kind===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="field"><label>Kategorie</label><select id="fCategory">${["reel","story","photo","interview"].map(x=>`<option value="${x}" ${item?.category===x?"selected":""}>${categoryLabel(x)}</option>`).join("")}</select></div><div class="field"><label>Verantwortlich</label><select id="fOwner">${optionsMembers(item?.owner)}</select></div><div class="field full"><label>Titel</label><input id="fTitle" value="${esc(item?.title)}"></div><div class="field"><label>Drehzeit</label><input id="fShoot" type="time" value="${item?.shoot_time||"10:00"}"></div><div class="field"><label>Uploadzeit</label><input id="fPublish" type="time" value="${item?.publish_time||"18:30"}"></div><div class="field"><label>Status</label><select id="fStatus">${["Geplant","Dreh läuft","Material fertig","Schnitt","Freigabe","Veröffentlicht"].map(x=>`<option ${item?.status===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="field full"><label>Instagram-/TikTok-Beispiel-Link</label><input id="fSocial" value="${esc(item?.social_url)}"></div><div class="field full"><label>Beschreibung / Shotlist</label><textarea id="fDesc">${esc(item?.description)}</textarea></div><div class="field full"><label>Inspirationsbilder (mehrere möglich)</label><input id="fImage" type="file" accept="image/*" multiple><div class="field-help">Mehrere Bilder gleichzeitig auswählen.</div></div><div class="field full"><label>Bildbeschreibungen</label><textarea id="fCaptions" placeholder="Eine Zeile pro Bild – in derselben Reihenfolge."></textarea></div></div>`;
 if(type==="member")h=`<div class="form-grid"><div class="field"><label>Name</label><input id="fName" value="${esc(item?.name)}"></div><div class="field"><label>E-Mail</label><input id="fEmail" type="email" value="${esc(item?.email)}"></div><div class="field"><label>Telefonnummer</label><input id="fPhone" type="tel" value="${esc(item?.phone)}" placeholder="+49 …"></div><div class="field"><label>Rollen (Komma getrennt)</label><input id="fRoles" value="${esc((item?.roles||[]).join(", "))}"></div></div>`;
 if(type==="goal")h=`<div class="form-grid two"><div class="field full"><label>Datum</label><input id="fDate" type="date" value="${item?.event_date||selectedDate}"></div><div class="field"><label>Stories Ziel</label><input id="fStoriesGoal" type="number" min="0" value="${item?.stories_goal||0}"></div><div class="field"><label>Reels Ziel</label><input id="fReelsGoal" type="number" min="0" value="${item?.reels_goal||0}"></div><div class="field"><label>Foto-Uploads Ziel</label><input id="fPhotosGoal" type="number" min="0" value="${item?.photos_goal||0}"></div><div class="field"><label>Interviews Ziel</label><input id="fInterviewsGoal" type="number" min="0" value="${item?.interviews_goal||0}"></div></div>`;
 if(type==="settings"){const s=state.settings;h=`<div class="form-grid"><div class="field"><label>Eventname</label><input id="fEvent" value="${esc(s.event_title)}"></div><div class="field"><label>Untertitel</label><input id="fSubtitle" value="${esc(s.event_subtitle)}"></div><div class="field"><label>Intro</label><input id="fIntro" value="${esc(s.intro)}"></div><div class="field"><label>Überschrift Morgen</label><input id="fMorning" value="${esc(s.heading_morning)}"></div><div class="field"><label>Überschrift Mittag</label><input id="fMidday" value="${esc(s.heading_midday)}"></div><div class="field"><label>Überschrift Abend</label><input id="fEvening" value="${esc(s.heading_evening)}"></div><div class="field"><label>Instagram-Link</label><input id="fInstagram" value="${esc(s.instagram_url)}"></div><div class="field"><label>TikTok-Link</label><input id="fTiktok" value="${esc(s.tiktok_url)}"></div></div>`}
 $("formTitle").textContent=id?"Bearbeiten":"Neu anlegen";$("formBody").innerHTML=h;$("formError").classList.add("hidden");$("formModal").classList.remove("hidden")
}
function closeForm(){$("formModal").classList.add("hidden");editing=null}
function val(id){return $(id)?.value||""}
function showFormError(msg){$("formError").textContent=msg;$("formError").classList.remove("hidden")}
async function uploadImage(file,caption,contentId){
 const path=`${contentId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
 const {error}=await client.storage.from(cfg.storageBucket).upload(path,file,{upsert:false});if(error)throw error;
 const {data}=client.storage.from(cfg.storageBucket).getPublicUrl(path);
 const ins=await client.from("content_images").insert({content_id:contentId,image_url:data.publicUrl,caption});if(ins.error)throw ins.error
}
async function saveForm(){
 const {type,id}=editing;const b=$("saveButton");b.disabled=true;b.textContent="Speichern …";
 try{
  if(type==="program"){
   const row={event_date:val("fDate"),start_time:val("fTime"),daypart:val("fDaypart"),title:val("fTitle")||"Programmpunkt",speaker:val("fSpeaker")||"—",description:val("fDesc"),photographer:val("fPhoto")||null,story_coordinator:val("fCoord")||null,story_maker:val("fStory")||null,reel_maker:val("fReel")||null,interviewer:val("fInterview")||null,published:true};
   const r=id?await client.from("program_items").update(row).eq("id",id):await client.from("program_items").insert(row);if(r.error)throw r.error
  }
  if(type==="task"){
   const cat=val("fCategory"),role=({story:"Story-Maker",photo:"Fotograf",reel:"Reel-Maker",interview:"Interviews"})[cat];
   const row={program_id:val("fProgram")||null,event_date:val("fDate"),start_time:val("fTime"),title:val("fTitle")||"Aufgabe",owner:val("fOwner")||null,role,category:cat,description:val("fDesc"),done:false};
   const r=id?await client.from("tasks").update(row).eq("id",id):await client.from("tasks").insert(row);if(r.error)throw r.error
  }
  if(type==="content"){
   const row={program_id:val("fProgram")||null,event_date:val("fDate"),kind:val("fKind"),category:val("fCategory"),title:val("fTitle")||"Content",description:val("fDesc"),owner:val("fOwner")||null,shoot_time:val("fShoot"),publish_time:val("fPublish"),social_url:val("fSocial")||null,status:val("fStatus"),published:true};
   let contentId=id;
   if(id){const r=await client.from("content_items").update(row).eq("id",id);if(r.error)throw r.error}
   else{const r=await client.from("content_items").insert(row).select("id").single();if(r.error)throw r.error;contentId=r.data.id}
   const files=[...$("fImage").files],captions=val("fCaptions").split("\n");
   for(let n=0;n<files.length;n++) await uploadImage(files[n],(captions[n]||"").trim(),contentId)
  }
  if(type==="member"){
   const row={name:val("fName")||"Neue Person",email:val("fEmail")||null,phone:val("fPhone")||null,roles:val("fRoles").split(",").map(x=>x.trim()).filter(Boolean)};
   const r=id?await client.from("team_members").update(row).eq("id",id):await client.from("team_members").insert(row);if(r.error)throw r.error
  }
  if(type==="goal"){
   const row={event_date:val("fDate"),stories_goal:+val("fStoriesGoal")||0,reels_goal:+val("fReelsGoal")||0,photos_goal:+val("fPhotosGoal")||0,interviews_goal:+val("fInterviewsGoal")||0,updated_at:new Date().toISOString()};
   const r=id?await client.from("daily_goals").update(row).eq("id",id):await client.from("daily_goals").upsert(row,{onConflict:"event_date"});if(r.error)throw r.error
  }
  if(type==="settings"){
   const row={event_title:val("fEvent"),event_subtitle:val("fSubtitle"),intro:val("fIntro"),heading_morning:val("fMorning"),heading_midday:val("fMidday"),heading_evening:val("fEvening"),instagram_url:val("fInstagram"),tiktok_url:val("fTiktok"),updated_at:new Date().toISOString()};
   let r;if(state.settings.id)r=await client.from("app_settings").update(row).eq("id",state.settings.id);else r=await client.from("app_settings").insert(row);if(r.error)throw r.error
  }
  closeForm();await loadAll()
 }catch(e){showFormError(e.message);console.error(e)}
 finally{b.disabled=false;b.textContent="Speichern"}
}
async function removeItem(type,id){
 if(!confirm("Wirklich löschen?"))return;
 const table=type==="member"?"team_members":type==="program"?"program_items":type==="content"?"content_items":type==="goal"?"daily_goals":"tasks";
 const {error}=await client.from(table).delete().eq("id",id);if(error){alert(error.message);return}await loadAll()
}
function downloadICS(x){const d=(x.date||selectedDate).replaceAll("-",""),st=(x.time||x.shoot_time||"12:00").replace(":","")+"00",h=String((+st.slice(0,2)+1)%24).padStart(2,"0");const text=`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${d}T${st}\nDTEND:${d}T${h}${st.slice(2)}\nSUMMARY:${x.title}\nDESCRIPTION:${(x.desc||x.description||"").replaceAll("\n"," ")}${x.owner?"\\nVerantwortlich: "+x.owner:""}\nEND:VEVENT\nEND:VCALENDAR`;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/calendar"}));a.download=(x.title||"Termin").replaceAll(" ","-")+".ics";a.click()}
client.auth.onAuthStateChange((_event,session)=>{adminSession=session;if(!$("adminOverlay").classList.contains("hidden"))renderAdmin()});
document.addEventListener("DOMContentLoaded",loadAll);
