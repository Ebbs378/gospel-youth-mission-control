
const $=id=>document.getElementById(id);
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const DAYS=[
["2026-08-29","Sa","29. Aug","Anreise"],["2026-08-30","So","30. Aug","Ankunft"],["2026-08-31","Mo","31. Aug","Identität"],["2026-09-01","Di","1. Sep","Metanoia"],["2026-09-02","Mi","2. Sep","Gaben"],["2026-09-03","Do","3. Sep","Ausflug"],["2026-09-04","Fr","4. Sep","Gnade"],["2026-09-05","Sa","5. Sep","Alltag"],["2026-09-06","So","6. Sep","Zeugnisse"],["2026-09-07","Mo","7. Sep","Heimfahrt"]];
const SEED={
 settings:{event_title:"Sommerfestival 2026",event_subtitle:"Heaven Now",intro:"Social-Media-Planung für das gesamte Team.",instagram_url:"https://www.instagram.com/",tiktok_url:"https://www.tiktok.com/",heading_morning:"Morgen",heading_midday:"Mittag",heading_evening:"Abend"},
 members:[
 {id:"m1",name:"Daniel",email:"admin@gospelyouth.de",roles:["Admin","Story-Koordinator"]},
 {id:"m2",name:"Jonas",email:"jonas@gospelyouth.de",roles:["Fotograf"]},
 {id:"m3",name:"Mia",email:"mia@gospelyouth.de",roles:["Story-Maker"]},
 {id:"m4",name:"Max",email:"max@gospelyouth.de",roles:["Reel-Maker"]},
 {id:"m5",name:"Lea",email:"lea@gospelyouth.de",roles:["Interviews"]}
 ],
 program:[
 {id:"p1",date:"2026-08-29",time:"15:00",daypart:"midday",title:"Check-in",speaker:"—",desc:"Ankommen im Gospel Forum Stuttgart.",photographer:"Jonas",story_coordinator:"Daniel",story_maker:"Mia",reel_maker:"Max",interviewer:"Lea"},
 {id:"p2",date:"2026-08-29",time:"16:30",daypart:"midday",title:"Gottesdienst",speaker:"Noch offen",desc:"Erwartungen an Gott.",photographer:"Jonas",story_coordinator:"Daniel",story_maker:"Mia",reel_maker:"Max",interviewer:"Lea"},
 {id:"p3",date:"2026-08-29",time:"18:00",daypart:"evening",title:"Abfahrt",speaker:"—",desc:"Busfahrt nach Frankreich.",photographer:"Jonas",story_coordinator:"Daniel",story_maker:"Mia",reel_maker:"Max",interviewer:"Lea"},
 {id:"p4",date:"2026-08-31",time:"10:00",daypart:"morning",title:"Morgenplenum",speaker:"Noch eintragen",desc:"Identität in Gott.",photographer:"Jonas",story_coordinator:"Daniel",story_maker:"Mia",reel_maker:"Max",interviewer:"Lea"}
 ],
 tasks:[
 {id:"t1",program_id:"p1",date:"2026-08-29",time:"15:00",category:"story",title:"Check-in Story",owner:"Mia",desc:"5–7 Hochformat-Clips, Namensschilder und erste Stimmung."},
 {id:"t2",program_id:"p2",date:"2026-08-29",time:"16:30",category:"photo",title:"Worship fotografieren",owner:"Jonas",desc:"Wide, Details, Gebet, echte Reaktionen."},
 {id:"t3",program_id:"p3",date:"2026-08-29",time:"17:30",category:"reel",title:"Abfahrt-Reel schneiden",owner:"Max",desc:"20–30 Sekunden; Upload 18:30."},
 {id:"t4",program_id:"p3",date:"2026-08-29",time:"18:15",category:"interview",title:"Bus-Interviews",owner:"Lea",desc:"3 kurze Fragen an Teilnehmer."}
 ],
 content:[
 {id:"c1",program_id:"p3",date:"2026-08-29",kind:"Reel",category:"reel",title:"Wir fahren los",description:"Emotionaler Recap aus Check-in, Gottesdienst und Abfahrt.",owner:"Max",shoot_time:"15:00",publish_time:"18:30",social_url:"https://www.instagram.com/",status:"Geplant",images:[]},
 {id:"c2",program_id:"p2",date:"2026-08-29",kind:"Foto",category:"photo",title:"Worship Moodboard",description:"Hände, Licht, Close-ups und Gebet.",owner:"Jonas",shoot_time:"16:30",publish_time:"20:00",social_url:"",status:"Geplant",images:[]}
 ]};
let state=JSON.parse(localStorage.getItem("gyMissionV6")||"null")||SEED;
let selectedDate=DAYS[0][0], category="all", adminSession=false, editing=null;
function persist(){localStorage.setItem("gyMissionV6",JSON.stringify(state))}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function fmt(d){return new Date(d+"T12:00:00").toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"long"})}
function toggleTheme(){const n=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=n;localStorage.setItem("gyTheme6",n)}
document.documentElement.dataset.theme=localStorage.getItem("gyTheme6")||"dark";

function renderHeader(){
 $("eventTitle").textContent=state.settings.event_title;
 $("eventSubtitle").textContent=state.settings.event_subtitle;
 document.querySelector(".event-hero p").textContent=state.settings.intro;
 $("igTop").href=state.settings.instagram_url||"#";
 $("ttTop").href=state.settings.tiktok_url||"#";
}
function renderDays(){
 $("dayStrip").innerHTML=DAYS.map(d=>`<button class="day-btn ${d[0]===selectedDate?"active":""}" onclick="selectDay('${d[0]}')"><strong>${d[1]} · ${d[2]}</strong><small>${d[3]}</small></button>`).join("")
}
function selectDay(d){selectedDate=d;renderAll()}
function setCategory(c,b){category=c;document.querySelectorAll(".category").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderAll()}
function categoryLabel(c){return ({all:"Gesamt",story:"Stories",photo:"Fotograf",reel:"Reels",interview:"Interviews"})[c]||c}
function categoryMatchesTask(t){return category==="all"||t.category===category}
function categoryMatchesProgram(p){
 if(category==="all")return true;
 const key={story:"story_maker",photo:"photographer",reel:"reel_maker",interview:"interviewer"}[category];
 return !!p[key] || state.tasks.some(t=>t.program_id===p.id&&t.category===category) || state.content.some(c=>c.program_id===p.id&&c.category===category)
}
function renderSummary(){
 const ps=state.program.filter(p=>p.date===selectedDate&&categoryMatchesProgram(p));
 const ts=state.tasks.filter(t=>t.date===selectedDate&&categoryMatchesTask(t));
 const cs=state.content.filter(c=>c.date===selectedDate&&(category==="all"||c.category===category));
 $("summaryCard").innerHTML=`<div class="eyebrow">${fmt(selectedDate)}</div><h2>${categoryLabel(category)}</h2><p>${ps.length} Programmpunkte · ${ts.length} Aufgaben · ${cs.length} Content-Einträge</p><div class="summary-meta"><span class="chip">Sommerfestival 2026</span><span class="chip">Heaven Now</span></div>`
}
function renderAssignments(){
 const ps=state.program.filter(p=>p.date===selectedDate);
 const collect=key=>[...new Set(ps.map(p=>p[key]).filter(Boolean))].join(", ")||"Offen";
 $("assignmentOverview").innerHTML=`<div class="section-label">Gesamtbesetzung für den Tag</div><div class="assignment-grid">
 <div class="assignment-card"><span>Story-Koordinator</span><strong>${esc(collect("story_coordinator"))}</strong></div>
 <div class="assignment-card"><span>Story-Maker</span><strong>${esc(collect("story_maker"))}</strong></div>
 <div class="assignment-card"><span>Fotograf</span><strong>${esc(collect("photographer"))}</strong></div>
 <div class="assignment-card"><span>Reel-Maker</span><strong>${esc(collect("reel_maker"))}</strong></div>
 <div class="assignment-card"><span>Interviews</span><strong>${esc(collect("interviewer"))}</strong></div>
 </div>`
}
function roleBoxes(p){
 const all=[["Fotograf",p.photographer,"photo"],["Story-Koord.",p.story_coordinator,"story"],["Story-Maker",p.story_maker,"story"],["Reel-Maker",p.reel_maker,"reel"],["Interviews",p.interviewer,"interview"]];
 const filtered=category==="all"?all:all.filter(x=>x[2]===category);
 return `<div class="role-grid">${filtered.map(x=>`<div class="role-box"><span>${x[0]}</span><strong>${esc(x[1]||"Offen")}</strong></div>`).join("")}</div>`
}
function contentMini(c){
 return `<div class="content-card"><div class="content-top"><div><strong>${esc(c.kind)} · ${esc(c.title)}</strong><div class="content-meta">Dreh ${esc(c.shoot_time)} · Upload ${esc(c.publish_time)} · ${esc(c.owner)}</div></div><span class="chip">${esc(c.status)}</span></div><p>${esc(c.description)}</p>${c.social_url?`<a class="small-btn" target="_blank" href="${esc(c.social_url)}">Beispiel öffnen ↗</a>`:""}${(c.images||[]).length?`<div class="content-images">${c.images.map(i=>`<figure><img src="${i.url}" alt=""><figcaption>${esc(i.caption||"")}</figcaption></figure>`).join("")}</div>`:""}</div>`
}
function programCard(p){
 const tasks=state.tasks.filter(t=>t.program_id===p.id&&categoryMatchesTask(t)).sort((a,b)=>a.time.localeCompare(b.time));
 const cont=state.content.filter(c=>c.program_id===p.id&&(category==="all"||c.category===category));
 return `<article class="program-card glass"><div class="program-head"><div class="program-time">${esc(p.time)}</div><div class="program-title-wrap"><h3 class="program-title">${esc(p.title)}</h3><div class="speaker">Sprecher: ${esc(p.speaker||"—")}</div></div></div><p class="program-desc">${esc(p.desc||"")}</p>${roleBoxes(p)}
 ${tasks.length?`<div class="inner-section"><div class="inner-title">Aufgaben</div>${tasks.map(t=>`<div class="task"><div><strong>${esc(t.time)} · ${esc(t.title)}</strong><small>${esc(t.owner)} · ${esc(t.desc)}</small></div><div class="task-actions"><button class="small-btn" onclick='downloadICS(${JSON.stringify(t)})'>Kalender</button></div></div>`).join("")}</div>`:""}
 ${cont.length?`<div class="inner-section"><div class="inner-title">Content</div>${cont.map(contentMini).join("")}</div>`:""}
 </article>`
}
function renderDayparts(){
 const parts=[["morning",state.settings.heading_morning||"Morgen","06:00–11:59"],["midday",state.settings.heading_midday||"Mittag","12:00–17:59"],["evening",state.settings.heading_evening||"Abend","ab 18:00"]];
 $("dayparts").innerHTML=parts.map(([key,title,time])=>{
   const arr=state.program.filter(p=>p.date===selectedDate&&p.daypart===key&&categoryMatchesProgram(p)).sort((a,b)=>a.time.localeCompare(b.time));
   return `<section class="daypart"><div class="daypart-head"><h2>${esc(title)}</h2><span>${time}</span></div><div class="program-list">${arr.length?arr.map(programCard).join(""):`<div class="empty">In dieser Kategorie ist hier noch nichts eingetragen.</div>`}</div></section>`
 }).join("")
}
function renderAll(){renderHeader();renderDays();renderSummary();renderAssignments();renderDayparts();persist()}

function openAdmin(){$("adminOverlay").classList.remove("hidden");renderAdmin()}
function closeAdmin(){$("adminOverlay").classList.add("hidden")}
function loginAdmin(){if($("adminPassword").value!=="missioncontrol"){alert("Falsches Passwort.");return}adminSession=true;renderAdmin()}
function renderAdmin(){
 $("adminLogin").classList.toggle("hidden",adminSession);
 $("adminApp").classList.toggle("hidden",!adminSession);
 if(!adminSession)return;
 renderAdminPanels()
}
function showAdminTab(name,b){document.querySelectorAll(".admin-panel").forEach(x=>x.classList.remove("active"));$("admin-"+name).classList.add("active");document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active")}
function actionBtns(type,id){return `<div class="admin-actions"><button class="small-btn" onclick="openForm('${type}','${id}')">Bearbeiten</button><button class="danger-btn" onclick="removeItem('${type}','${id}')">Löschen</button></div>`}
function renderAdminPanels(){
 $("admin-overview").innerHTML=`<div class="admin-grid">${DAYS.map(d=>{const ps=state.program.filter(p=>p.date===d[0]);return `<div class="admin-card"><div class="admin-card-head"><div><h3>${d[1]} · ${d[2]}</h3><p>${d[3]} · ${ps.length} Programmpunkte</p></div></div><div class="admin-actions"><button class="small-btn" onclick="selectedDate='${d[0]}';renderAll();closeAdmin()">Öffnen</button></div></div>`}).join("")}</div>`;
 $("admin-program").innerHTML=`<div class="admin-card"><div class="admin-card-head"><div><h3>Programm verwalten</h3><p>Programmpunkte, Sprecher und Besetzungen.</p></div><button class="primary-btn" onclick="openForm('program')">Neu</button></div></div><div class="admin-grid" style="margin-top:10px">${state.program.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(p=>`<div class="admin-card"><h3>${esc(p.date)} · ${esc(p.time)} · ${esc(p.title)}</h3><p>Sprecher: ${esc(p.speaker)}<br>${esc(p.desc)}</p>${actionBtns("program",p.id)}</div>`).join("")}</div>`;
 $("admin-content").innerHTML=`<div class="admin-card"><div class="admin-card-head"><div><h3>Content verwalten</h3><p>Reels, Stories, Fotos und Interviews.</p></div><button class="primary-btn" onclick="openForm('content')">Neu</button></div></div><div class="admin-grid" style="margin-top:10px">${state.content.map(c=>`<div class="admin-card"><h3>${esc(c.kind)} · ${esc(c.title)}</h3><p>${esc(c.date)} · ${esc(c.owner)} · Upload ${esc(c.publish_time)}</p>${actionBtns("content",c.id)}</div>`).join("")}</div>`;
 $("admin-tasks").innerHTML=`<div class="admin-card"><div class="admin-card-head"><div><h3>Aufgaben verwalten</h3><p>Aufgaben direkt Programmpunkten zuordnen.</p></div><button class="primary-btn" onclick="openForm('task')">Neu</button></div></div><div class="admin-grid" style="margin-top:10px">${state.tasks.map(t=>`<div class="admin-card"><h3>${esc(t.date)} · ${esc(t.time)} · ${esc(t.title)}</h3><p>${esc(t.owner)} · ${categoryLabel(t.category)}<br>${esc(t.desc)}</p>${actionBtns("task",t.id)}</div>`).join("")}</div>`;
 $("admin-team").innerHTML=`<div class="admin-card"><div class="admin-card-head"><div><h3>Team verwalten</h3><p>Mitarbeiter und Rollen.</p></div><button class="primary-btn" onclick="openForm('member')">Neu</button></div></div><div class="admin-grid" style="margin-top:10px">${state.members.map(m=>`<div class="admin-card"><h3>${esc(m.name)}</h3><p>${esc(m.email)}<br>${m.roles.map(esc).join(" · ")}</p>${actionBtns("member",m.id)}</div>`).join("")}</div>`;
 const s=state.settings;
 $("admin-settings").innerHTML=`<div class="admin-card"><div class="admin-card-head"><div><h3>Event & Links</h3><p>Alle Texte, Überschriften und Social-Links ohne Code ändern.</p></div><button class="primary-btn" onclick="openForm('settings')">Bearbeiten</button></div><p>${esc(s.event_title)} · ${esc(s.event_subtitle)}<br>Instagram und TikTok sind ebenfalls editierbar.</p></div>`
}
function optionsMembers(selected=""){return `<option value="">Offen</option>`+state.members.map(m=>`<option ${m.name===selected?"selected":""}>${esc(m.name)}</option>`).join("")}
function optionsPrograms(selected=""){return state.program.map(p=>`<option value="${p.id}" ${p.id===selected?"selected":""}>${esc(p.date)} · ${esc(p.time)} · ${esc(p.title)}</option>`).join("")}
function openForm(type,id=null){
 editing={type,id};let item=null,key=type==="member"?"members":type==="program"?"program":type==="content"?"content":"tasks";if(id)item=state[key].find(x=>x.id===id);
 let html="";
 if(type==="program")html=`<div class="form-grid two">
 <div class="field"><label>Datum</label><input id="fDate" type="date" value="${item?.date||selectedDate}"></div>
 <div class="field"><label>Uhrzeit</label><input id="fTime" type="time" value="${item?.time||"10:00"}"></div>
 <div class="field"><label>Tageszeit</label><select id="fDaypart">${["morning","midday","evening"].map(x=>`<option value="${x}" ${item?.daypart===x?"selected":""}>${x==="morning"?"Morgen":x==="midday"?"Mittag":"Abend"}</option>`).join("")}</select></div>
 <div class="field"><label>Sprecher</label><input id="fSpeaker" value="${esc(item?.speaker||"")}"></div>
 <div class="field full"><label>Überschrift</label><input id="fTitle" value="${esc(item?.title||"")}"></div>
 <div class="field full"><label>Beschreibung</label><textarea id="fDesc">${esc(item?.desc||"")}</textarea></div>
 <div class="field"><label>Fotograf</label><select id="fPhoto">${optionsMembers(item?.photographer)}</select></div>
 <div class="field"><label>Story-Koordinator</label><select id="fCoord">${optionsMembers(item?.story_coordinator)}</select></div>
 <div class="field"><label>Story-Maker</label><select id="fStory">${optionsMembers(item?.story_maker)}</select></div>
 <div class="field"><label>Reel-Maker</label><select id="fReel">${optionsMembers(item?.reel_maker)}</select></div>
 <div class="field"><label>Interviews</label><select id="fInterview">${optionsMembers(item?.interviewer)}</select></div></div>`;
 if(type==="task")html=`<div class="form-grid two"><div class="field full"><label>Programmpunkt</label><select id="fProgram">${optionsPrograms(item?.program_id)}</select></div><div class="field"><label>Datum</label><input id="fDate" type="date" value="${item?.date||selectedDate}"></div><div class="field"><label>Uhrzeit</label><input id="fTime" type="time" value="${item?.time||"10:00"}"></div><div class="field"><label>Kategorie</label><select id="fCategory">${["story","photo","reel","interview"].map(x=>`<option value="${x}" ${item?.category===x?"selected":""}>${categoryLabel(x)}</option>`).join("")}</select></div><div class="field"><label>Person</label><select id="fOwner">${optionsMembers(item?.owner)}</select></div><div class="field full"><label>Aufgabe</label><input id="fTitle" value="${esc(item?.title||"")}"></div><div class="field full"><label>Beschreibung</label><textarea id="fDesc">${esc(item?.desc||"")}</textarea></div></div>`;
 if(type==="content")html=`<div class="form-grid two"><div class="field full"><label>Programmpunkt</label><select id="fProgram">${optionsPrograms(item?.program_id)}</select></div><div class="field"><label>Datum</label><input id="fDate" type="date" value="${item?.date||selectedDate}"></div><div class="field"><label>Typ</label><select id="fKind">${["Reel","Story","Foto","Interview"].map(x=>`<option ${item?.kind===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="field"><label>Kategorie</label><select id="fCategory">${["reel","story","photo","interview"].map(x=>`<option value="${x}" ${item?.category===x?"selected":""}>${categoryLabel(x)}</option>`).join("")}</select></div><div class="field"><label>Verantwortlich</label><select id="fOwner">${optionsMembers(item?.owner)}</select></div><div class="field full"><label>Titel</label><input id="fTitle" value="${esc(item?.title||"")}"></div><div class="field"><label>Drehzeit</label><input id="fShoot" type="time" value="${item?.shoot_time||"10:00"}"></div><div class="field"><label>Uploadzeit</label><input id="fPublish" type="time" value="${item?.publish_time||"18:30"}"></div><div class="field"><label>Status</label><select id="fStatus">${["Geplant","Dreh läuft","Material fertig","Schnitt","Freigabe","Veröffentlicht"].map(x=>`<option ${item?.status===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="field full"><label>Instagram-/TikTok-Beispiel-Link</label><input id="fSocial" value="${esc(item?.social_url||"")}"></div><div class="field full"><label>Beschreibung / Shotlist</label><textarea id="fDesc">${esc(item?.description||"")}</textarea></div><div class="field full"><label>Foto hochladen</label><input id="fImage" type="file" accept="image/*"><input id="fCaption" placeholder="Bildbeschreibung" style="margin-top:7px"></div></div>`;
 if(type==="member")html=`<div class="form-grid"><div class="field"><label>Name</label><input id="fName" value="${esc(item?.name||"")}"></div><div class="field"><label>E-Mail</label><input id="fEmail" type="email" value="${esc(item?.email||"")}"></div><div class="field"><label>Rollen (Komma getrennt)</label><input id="fRoles" value="${esc((item?.roles||[]).join(", "))}"></div></div>`;
 if(type==="settings"){const s=state.settings;html=`<div class="form-grid"><div class="field"><label>Eventname</label><input id="fEvent" value="${esc(s.event_title)}"></div><div class="field"><label>Untertitel</label><input id="fSubtitle" value="${esc(s.event_subtitle)}"></div><div class="field"><label>Intro</label><input id="fIntro" value="${esc(s.intro)}"></div><div class="field"><label>Überschrift Morgen</label><input id="fMorning" value="${esc(s.heading_morning)}"></div><div class="field"><label>Überschrift Mittag</label><input id="fMidday" value="${esc(s.heading_midday)}"></div><div class="field"><label>Überschrift Abend</label><input id="fEvening" value="${esc(s.heading_evening)}"></div><div class="field"><label>Instagram-Link</label><input id="fInstagram" value="${esc(s.instagram_url)}"></div><div class="field"><label>TikTok-Link</label><input id="fTiktok" value="${esc(s.tiktok_url)}"></div></div>`}
 $("formTitle").textContent=id?"Bearbeiten":"Neu anlegen";$("formBody").innerHTML=html;$("formModal").classList.remove("hidden")
}
function closeForm(){$("formModal").classList.add("hidden");editing=null}
function val(id){return $(id)?.value||""}
async function imageData(file,caption){if(!file)return null;return await new Promise(r=>{const fr=new FileReader();fr.onload=()=>r({url:fr.result,caption});fr.readAsDataURL(file)})}
async function saveForm(){
 const {type,id}=editing;let obj,key;
 if(type==="program"){obj={id:id||uid("p"),date:val("fDate"),time:val("fTime"),daypart:val("fDaypart"),title:val("fTitle")||"Programmpunkt",speaker:val("fSpeaker")||"—",desc:val("fDesc"),photographer:val("fPhoto"),story_coordinator:val("fCoord"),story_maker:val("fStory"),reel_maker:val("fReel"),interviewer:val("fInterview")};key="program"}
 if(type==="task"){obj={id:id||uid("t"),program_id:val("fProgram"),date:val("fDate"),time:val("fTime"),category:val("fCategory"),title:val("fTitle")||"Aufgabe",owner:val("fOwner"),desc:val("fDesc")};key="tasks"}
 if(type==="content"){const prev=id?state.content.find(x=>x.id===id):null;obj={id:id||uid("c"),program_id:val("fProgram"),date:val("fDate"),kind:val("fKind"),category:val("fCategory"),title:val("fTitle")||"Content",description:val("fDesc"),owner:val("fOwner"),shoot_time:val("fShoot"),publish_time:val("fPublish"),social_url:val("fSocial"),status:val("fStatus"),images:[...(prev?.images||[])]};const file=$("fImage")?.files?.[0];if(file)obj.images.push(await imageData(file,val("fCaption")));key="content"}
 if(type==="member"){obj={id:id||uid("m"),name:val("fName")||"Neue Person",email:val("fEmail"),roles:val("fRoles").split(",").map(x=>x.trim()).filter(Boolean)};key="members"}
 if(type==="settings"){state.settings={...state.settings,event_title:val("fEvent"),event_subtitle:val("fSubtitle"),intro:val("fIntro"),heading_morning:val("fMorning"),heading_midday:val("fMidday"),heading_evening:val("fEvening"),instagram_url:val("fInstagram"),tiktok_url:val("fTiktok")};persist();closeForm();renderAll();renderAdminPanels();return}
 if(id)state[key]=state[key].map(x=>x.id===id?obj:x);else state[key].push(obj);
 persist();closeForm();renderAll();renderAdminPanels()
}
function removeItem(type,id){
 if(!confirm("Wirklich löschen?"))return;
 const key=type==="member"?"members":type==="program"?"program":type==="content"?"content":"tasks";
 state[key]=state[key].filter(x=>x.id!==id);persist();renderAll();renderAdminPanels()
}
function downloadICS(x){
 const d=(x.date||selectedDate).replaceAll("-",""),st=(x.time||x.shoot_time||"12:00").replace(":","")+"00";
 const h=String((+st.slice(0,2)+1)%24).padStart(2,"0");
 const text=`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${d}T${st}\nDTEND:${d}T${h}${st.slice(2)}\nSUMMARY:${x.title}\nDESCRIPTION:${(x.desc||x.description||"").replaceAll("\n"," ")}${x.owner?"\\nVerantwortlich: "+x.owner:""}\nEND:VEVENT\nEND:VCALENDAR`;
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/calendar"}));a.download=(x.title||"Termin").replaceAll(" ","-")+".ics";a.click()
}
document.addEventListener("DOMContentLoaded",renderAll);
