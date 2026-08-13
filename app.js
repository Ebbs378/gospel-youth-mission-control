
const CFG=window.MISSION_CONFIG;
const db=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey);
const $=id=>document.getElementById(id);
const esc=(s="")=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const tval=t=>(t||"").slice(0,5);
const fmt=d=>new Date(d+"T12:00:00").toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"long"});
let data={settings:{},days:[],members:[],program:[],subs:[],todos:[],todoAssign:[],programAssign:[],media:[],templates:[],finished:[]};
let selectedDate="2026-08-29",planPeriod="all",minePerson="",mineDate="",teamFilter="Alle",templateFilter="Alle",finishedFilter="Alle",adminSession=null,editing=null,galleryItems=[],galleryIndex=0,teamPass="";

function showError(msg){$("loadError").textContent=msg;$("loadError").classList.remove("hidden")}
function clearError(){$("loadError").classList.add("hidden")}
function toggleTheme(){const x=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=x;localStorage.setItem("gyThemeClean",x)}
document.documentElement.dataset.theme=localStorage.getItem("gyThemeClean")||"dark";

async function unlockTeam(){
  const code=$("teamCode").value.trim();
  $("gateError").textContent="";
  try{
    const {data:members,error}=await db.rpc("team_members_with_passcode",{passcode:code});
    if(error) throw error;
    teamPass=code;
    sessionStorage.setItem("gyTeamPass",code);
    $("teamGate").classList.add("hidden");
    $("appShell").classList.remove("hidden");
    await loadAll(members||[]);
  }catch(e){
    console.error(e);
    $("gateError").textContent=e.message.includes("invalid team passcode")?"Team-Code nicht korrekt.":e.message;
  }
}

async function safeQuery(promise,fallback=[]){
  try{
    const r=await promise;
    if(r.error) throw r.error;
    return r.data??fallback;
  }catch(e){
    console.warn(e);
    return fallback;
  }
}

async function loadAll(knownMembers=null){
  clearError();
  try{
    const [settings,days,program,subs,todos,todoAssign,programAssign,media,templates,finished]=await Promise.all([
      safeQuery(db.from("app_settings").select("*").limit(1),[]),
      safeQuery(db.from("festival_days").select("*").order("sort_order").order("event_date"),[]),
      safeQuery(db.from("program_items").select("*").order("event_date").order("start_time"),[]),
      safeQuery(db.from("program_subitems").select("*").order("sort_order"),[]),
      safeQuery(db.from("content_todos").select("*").order("sort_order"),[]),
      safeQuery(db.from("todo_assignments").select("*"),[]),
      safeQuery(db.from("program_assignments").select("*"),[]),
      safeQuery(db.from("todo_media").select("*").order("sort_order"),[]),
      safeQuery(db.from("templates").select("*").order("created_at"),[]),
      safeQuery(db.from("finished_content").select("*").order("created_at"),[])
    ]);

    let members=knownMembers;
    if(!members){
      if(teamPass){
        const r=await db.rpc("team_members_with_passcode",{passcode:teamPass});
        if(!r.error) members=r.data;
      }
      if(!members && adminSession) members=await safeQuery(db.from("team_members").select("*").order("name"),[]);
    }

    data.settings=settings[0]||{};
    data.days=days;
    data.members=members||[];
    data.program=program;
    data.subs=subs;
    data.todos=todos;
    data.todoAssign=todoAssign;
    data.programAssign=programAssign;
    data.media=media;
    data.templates=templates;
    data.finished=finished;

    if(data.days.length && !data.days.some(d=>d.event_date===selectedDate)) selectedDate=data.days[0].event_date;
    if(!mineDate) mineDate=selectedDate;

    renderAll();

    // Diagnostic: if core tables exist but UI receives zero rows, show a visible hint instead of silent emptiness.
    if(!data.days.length || !data.program.length){
      const missing=[];
      if(!data.days.length) missing.push("Tage");
      if(!data.program.length) missing.push("Programmpunkte");
      showError("Daten konnten nicht vollständig geladen werden: "+missing.join(", ")+". Bitte Seite neu laden.");
    }
  }catch(e){
    console.error(e);
    showError("Ladefehler: "+e.message);
  }
}

function header(){
  const s=data.settings,bible=s.bible_url||"https://www.bible.com/bible/157/MAT.1.SCH2000";
  $("quietTop").href=bible;$("homeBible").href=bible;
  $("igTop").href=s.instagram_url||"#";$("ttTop").href=s.tiktok_url||"#";
  $("homeDropbox").href=s.dropbox_url||"#";$("homeWhatsApp").href=s.whatsapp_url||"#";$("teamWhatsApp").href=s.whatsapp_url||"#";
  $("homeInstagram").href=s.instagram_url||"#";$("homeTikTok").href=s.tiktok_url||"#";
}
function showView(v){
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  $("view-"+v)?.classList.add("active");
  document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===v));
  if(v==="mine") renderMine();
  if(v==="team") renderTeam();
  if(v==="templates") renderTemplates();
  if(v==="finished") renderFinished();
}
function dayObj(d){return data.days.find(x=>x.event_date===d)||{event_date:d,theme:"",description:""}}
function renderDays(target,selected,fn){
  $(target).innerHTML=data.days.map(d=>`<button class="day ${d.event_date===selected?"active":""}" onclick="${fn}('${d.event_date}')"><strong>${esc(d.short_label||fmt(d.event_date))}</strong><small>${esc(d.display_date||"")}</small></button>`).join("")
}
function selectDate(d){selectedDate=d;renderAll()}function selectMineDate(d){mineDate=d;renderMine()}function selectAdminDate(d){selectedDate=d;renderAll()}
function renderHome(){
  const s=data.settings;
  $("motivationText").textContent=s.home_motivation||s.motivation_text||"Wir wollen sichtbar machen, was Gott während dieser Freizeit tut – ehrlich, aufmerksam und so, dass Menschen ermutigt werden und Jesus im Mittelpunkt bleibt.";
  const verse=s.home_verse||s.daily_verse||"",ref=s.home_verse_ref||s.daily_verse_ref||"";
  $("verseCard").innerHTML=verse?`<div class="verse-mark">„${esc(verse)}“</div>${ref?`<div class="verse-ref">${esc(ref)}</div>`:""}`:"";
  $("announcement").innerHTML=s.announcement?`<div class="quiet-card"><div></div><div><div class="eyebrow">Team-Info</div><p>${esc(s.announcement)}</p></div></div>`:"";
  const d=dayObj(selectedDate),ts=data.todos.filter(t=>t.event_date===selectedDate),done=ts.filter(t=>t.done).length;
  $("homeToday").innerHTML=`<section class="day-hero"><div class="eyebrow">Heute · ${fmt(selectedDate)}</div><h2>${esc(d.theme||"Tagesplan")}</h2>${d.description?`<p>${esc(d.description)}</p>`:""}<div class="pills"><span class="pill active">${done}/${ts.length} erledigt</span></div></section>`;
  renderLeader();
}
function renderLeader(){
  const leader=data.members.find(m=>/ebenezer\s+agonafer/i.test(m.name||""))||data.members.find(m=>/ebenezer|ebbs/i.test(m.name||""));
  if(!leader){$("leaderCard").innerHTML="";return}
  const phone=(leader.phone||"").trim();
  $("leaderCard").innerHTML=`<div class="leader-card"><div class="leader-avatar">EA</div><div><div class="eyebrow" style="color:inherit;opacity:.58">Bei Problemen oder Fragen</div><h3>Bereichsleiter · ${esc(leader.name)}</h3><p>Wenn du Unterstützung brauchst oder dir etwas zu viel wird, melde dich. Lieber einmal zu früh als einmal zu spät.</p>${phone?`<div class="leader-actions"><a href="tel:${esc(phone)}">Anrufen</a><a target="_blank" rel="noopener" href="https://wa.me/${esc(phone.replace(/\D/g,""))}">WhatsApp schreiben</a></div>`:""}</div></div>`
}
function setPlanPeriod(p,b){planPeriod=p;document.querySelectorAll("#planPeriods .pill").forEach(x=>x.classList.remove("active"));b?.classList.add("active");renderDayparts("dayparts",selectedDate,false)}
function renderDayHero(){const d=dayObj(selectedDate);$("dayHero").innerHTML=`<div class="eyebrow">${fmt(selectedDate)}</div><h2>${esc(d.theme||"Tagesplan")}</h2>${d.description?`<p>${esc(d.description)}</p>`:""}`}
function renderProgress(target,date){
  const ts=data.todos.filter(t=>t.event_date===date),cats=["Story","Reel","Foto","Interview"];
  $(target).innerHTML=`<div class="progress-grid">${cats.map(c=>{const all=ts.filter(t=>t.type===c),done=all.filter(t=>t.done).length;return `<div class="metric"><div class="metric-top"><span>${c}${c==="Story"?"s":""}</span><strong>${done} / ${all.length}</strong></div><div class="bar"><i style="width:${all.length?done/all.length*100:0}%"></i></div></div>`}).join("")}</div>`
}
function memberName(id){return data.members.find(m=>m.id===id)?.name||""}
function programRoles(pid){
  const rows=data.programAssign.filter(a=>a.program_id===pid),groups={};
  rows.forEach(a=>{const n=memberName(a.member_id);if(n)(groups[a.role]??=[]).push(n)});
  return Object.entries(groups).filter(([,names])=>names.length).map(([role,names])=>`<span class="role">${esc(role)} · <strong>${names.map(esc).join(" + ")}</strong></span>`).join("")
}
function todoPeople(id){return data.todoAssign.filter(a=>a.todo_id===id).map(a=>memberName(a.member_id)).filter(Boolean)}
function mediaFor(id){return data.media.filter(m=>m.todo_id===id)}
function embed(url){
  if(!url)return"";
  try{
    const u=new URL(url);
    if(u.hostname.includes("tiktok.com")){const m=u.pathname.match(/\/video\/(\d+)/);if(m)return `<div class="video"><iframe loading="lazy" allow="fullscreen" src="https://www.tiktok.com/player/v1/${m[1]}?autoplay=0"></iframe></div>`}
    if(u.hostname.includes("instagram.com")){const clean=url.split("?")[0].replace(/\/?$/,"/");return `<div class="video"><iframe loading="lazy" src="${esc(clean)}embed/"></iframe></div>`}
  }catch(e){}
  return""
}
function renderTodo(t,admin=false){
  const people=todoPeople(t.id),med=mediaFor(t.id),images=med.filter(m=>m.media_type==="image"),video=med.find(m=>m.media_type==="video");
  return `<div class="todo ${t.done?"done":""}"><div class="todo-top"><div><div class="todo-title">${esc(t.type)} · ${esc(t.title)}</div><div class="todo-meta">${t.due_time?esc(tval(t.due_time))+" · ":""}${esc(t.description||"")}</div></div>${t.done?"✓":""}</div>${people.length?`<div class="assignees">${people.map(n=>`<span class="assignee">${esc(n)}</span>`).join("")}</div>`:""}${t.example_url?embed(t.example_url)+`<a class="external" target="_blank" rel="noopener" href="${esc(t.example_url)}">Original öffnen ↗</a>`:""}${video?`<div class="video"><video controls preload="metadata" src="${esc(video.url)}"></video></div>`:""}${images.length?`<div class="media-strip">${images.map((m,i)=>`<div class="thumb" onclick="openTodoGallery('${t.id}',${i})"><img src="${esc(m.url)}"></div>`).join("")}</div>`:""}${admin?`<div class="edit-row"><button class="done-btn ${t.done?"is-done":""}" onclick="toggleTodo('${t.id}',${!t.done})">${t.done?"Erledigt ✓":"Erledigt"}</button><button class="edit" onclick="openForm('todo','${t.id}')">Bearbeiten</button><button class="delete" onclick="removeRow('todo','${t.id}')">Löschen</button></div>`:""}</div>`
}
function renderSub(s,i,admin=false){
  const ts=data.todos.filter(t=>t.subitem_id===s.id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  return `<div class="sub"><div class="sub-head"><div class="sub-num">${i+1}</div><div><h4>${esc(s.title)}</h4><div class="sub-meta">${[s.kind,tval(s.start_time)].filter(Boolean).map(esc).join(" · ")}</div>${s.description?`<p style="font-size:10px;margin:4px 0">${esc(s.description)}</p>`:""}</div></div><div class="todos">${ts.map(t=>renderTodo(t,admin)).join("")}</div>${admin?`<div class="edit-row"><button class="add" onclick="openForm('todo',null,'${s.id}')">+ Content-To-do</button><button class="edit" onclick="openForm('sub','${s.id}')">Bearbeiten</button><button class="delete" onclick="removeRow('sub','${s.id}')">Löschen</button></div>`:""}</div>`
}
function renderProgram(p,admin=false){
  const subs=data.subs.filter(s=>s.program_id===p.id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  return `<article class="program"><div class="program-top"><div class="program-time">${esc(tval(p.start_time))}</div><div><h3>${esc(p.title)}</h3>${p.speaker?`<div class="speaker">Sprecher: ${esc(p.speaker)}</div>`:""}${p.description?`<p class="program-desc">${esc(p.description)}</p>`:""}<div class="roles">${programRoles(p.id)}</div></div></div><div class="sub-list">${subs.map((s,i)=>renderSub(s,i,admin)).join("")}</div>${admin?`<div class="edit-row"><button class="add" onclick="openForm('sub',null,null,'${p.id}')">+ Unterpunkt</button><button class="edit" onclick="openForm('program','${p.id}')">Bearbeiten</button><button class="edit" onclick="openForm('roles','${p.id}')">Zuweisungen</button><button class="delete" onclick="removeRow('program','${p.id}')">Löschen</button></div>`:""}</article>`
}
function renderDayparts(target,date,admin=false){
  const labels={morning:data.settings.heading_morning||"Morgen",midday:data.settings.heading_midday||"Mittag",evening:data.settings.heading_evening||"Abend"};
  const entries=Object.entries(labels).filter(([k])=>planPeriod==="all"||planPeriod===k||admin);
  $(target).innerHTML=entries.map(([k,label])=>{const ps=data.program.filter(p=>p.event_date===date&&p.daypart===k);return `<section class="daypart"><div class="daypart-head"><h2>${esc(label)}</h2>${admin?`<button class="add" onclick="openForm('program',null,null,null,'${k}')">+ Programmpunkt</button>`:""}</div><div class="program-list">${ps.length?ps.map(p=>renderProgram(p,admin)).join(""):`<p style="font-size:10px">Noch keine Programmpunkte.</p>`}</div></section>`}).join("")
}
function renderPlan(){renderDays("planDays",selectedDate,"selectDate");renderDayHero();renderProgress("progress",selectedDate);renderDayparts("dayparts",selectedDate,false)}
function assignmentsFor(mid){
  const out=[];
  data.programAssign.filter(a=>a.member_id===mid).forEach(a=>{const p=data.program.find(x=>x.id===a.program_id);if(p)out.push({date:p.event_date,time:tval(p.start_time),title:p.title,role:a.role})});
  data.todoAssign.filter(a=>a.member_id===mid).forEach(a=>{const t=data.todos.find(x=>x.id===a.todo_id),s=t&&data.subs.find(x=>x.id===t.subitem_id),p=s&&data.program.find(x=>x.id===s.program_id);if(t&&p)out.push({date:t.event_date,time:tval(t.due_time)||tval(p.start_time),title:t.title,role:t.type,sub:s.title})});
  return out.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))
}
function setMinePerson(id){minePerson=id;renderMine()}
function renderMine(){
  $("minePerson").innerHTML=`<option value="">Person auswählen …</option>${data.members.map(m=>`<option value="${m.id}" ${minePerson===m.id?"selected":""}>${esc(m.name)}</option>`).join("")}`;
  renderDays("mineDays",mineDate,"selectMineDate");
  const arr=minePerson?assignmentsFor(minePerson).filter(x=>x.date===mineDate):[];
  $("calendarAll").classList.toggle("hidden",!minePerson);
  $("mineList").innerHTML=minePerson?(arr.length?arr.map(x=>`<div class="mine-item"><strong>${esc(x.time)}</strong><div><strong>${esc(x.title)}</strong><p>${esc(x.role)}${x.sub?" · "+esc(x.sub):""}</p></div></div>`).join(""):`<p style="font-size:10px">Keine Einsätze an diesem Tag.</p>`):`<p style="font-size:10px">Wähle zuerst deinen Namen aus.</p>`
}
function exportMine(){
  const arr=assignmentsFor(minePerson);let ics="BEGIN:VCALENDAR\nVERSION:2.0\n";
  arr.forEach(x=>{const d=x.date.replaceAll("-",""),s=(x.time||"12:00").replace(":","")+"00";ics+=`BEGIN:VEVENT\nDTSTART:${d}T${s}\nSUMMARY:${x.title}\nDESCRIPTION:${x.role}${x.sub?" - "+x.sub:""}\nEND:VEVENT\n`});ics+="END:VCALENDAR";
  downloadBlob(ics,(memberName(minePerson)||"Einsaetze")+".ics","text/calendar")
}
function downloadBlob(text,name,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click()}
function uniqueRoles(){return ["Alle",...new Set(data.members.flatMap(m=>m.roles||[]).map(x=>String(x).trim()).filter(Boolean))]}
function renderTeam(){
  const roles=uniqueRoles();$("teamFilters").innerHTML=roles.map(r=>`<button class="pill ${teamFilter===r?"active":""}" onclick='teamFilter=${JSON.stringify(r)};renderTeam()'>${esc(r)}</button>`).join("");
  const arr=data.members.filter(m=>teamFilter==="Alle"||(m.roles||[]).includes(teamFilter));
  $("teamGrid").innerHTML=arr.map(m=>`<div class="team-card"><h3>${esc(m.name)}</h3><p>${[...new Set(m.roles||[])].map(esc).join(" · ")}</p><div class="contact-actions">${m.phone?`<a href="tel:${esc(m.phone)}">Anrufen</a><a target="_blank" rel="noopener" href="https://wa.me/${esc(m.phone.replace(/\D/g,""))}">WhatsApp</a>`:""}${m.email?`<a href="mailto:${esc(m.email)}">E-Mail</a>`:""}</div></div>`).join("")
}
function renderTemplates(){
  const cats=["Alle",...new Set(data.templates.map(x=>x.category).filter(Boolean))];$("templateFilters").innerHTML=cats.map(c=>`<button class="pill ${templateFilter===c?"active":""}" onclick='templateFilter=${JSON.stringify(c)};renderTemplates()'>${esc(c)}</button>`).join("");
  const arr=data.templates.filter(x=>templateFilter==="Alle"||x.category===templateFilter);
  $("templateGrid").innerHTML=arr.map(x=>`<div class="asset-card"><img src="${esc(x.file_url)}" onclick="openSingleGallery('${esc(x.file_url)}',${JSON.stringify(x.description||x.title)})"><div class="asset-body"><strong>${esc(x.title)}</strong><p>${esc(x.category||"Vorlage")}</p><a class="download" href="${esc(x.file_url)}" download target="_blank">Download ↓</a></div></div>`).join("")
}
function renderFinished(){
  renderDays("finishedDays",selectedDate,"selectDate");
  const cats=["Alle",...new Set(data.finished.map(x=>x.category).filter(Boolean))];$("finishedFilters").innerHTML=cats.map(c=>`<button class="pill ${finishedFilter===c?"active":""}" onclick='finishedFilter=${JSON.stringify(c)};renderFinished()'>${esc(c)}</button>`).join("");
  const arr=data.finished.filter(x=>x.event_date===selectedDate&&(finishedFilter==="Alle"||x.category===finishedFilter));
  $("finishedGrid").innerHTML=arr.map(x=>`<div class="asset-card">${x.file_type?.startsWith("video")?`<video controls preload="metadata" src="${esc(x.file_url)}"></video>`:`<img src="${esc(x.file_url)}" onclick="openSingleGallery('${esc(x.file_url)}',${JSON.stringify(x.description||x.title)})">`}<div class="asset-body"><strong>${esc(x.title)}</strong><p>${esc(x.category||"Datei")}</p><a class="download" href="${esc(x.file_url)}" download target="_blank">Download ↓</a></div></div>`).join("")
}
function openTodoGallery(id,i=0){galleryItems=mediaFor(id).filter(x=>x.media_type==="image").map(x=>({url:x.url,caption:x.caption||""}));galleryIndex=i;showGallery()}
function openSingleGallery(url,caption=""){galleryItems=[{url,caption}];galleryIndex=0;showGallery()}function showGallery(){if(!galleryItems.length)return;const x=galleryItems[galleryIndex];$("galleryImage").src=x.url;$("galleryCaption").textContent=x.caption||"";$("gallery").classList.remove("hidden")}function galleryStep(n){galleryIndex=(galleryIndex+n+galleryItems.length)%galleryItems.length;showGallery()}function closeGallery(){$("gallery").classList.add("hidden")}
async function openAdmin(){$("adminOverlay").classList.remove("hidden");const {data:s}=await db.auth.getSession();adminSession=s.session;renderAdmin()}
function closeAdmin(){$("adminOverlay").classList.add("hidden")}
async function adminLogin(){const {data:s,error}=await db.auth.signInWithPassword({email:$("adminEmailInput").value.trim(),password:$("adminPasswordInput").value});if(error){$("adminLoginMsg").textContent=error.message;return}adminSession=s.session;await loadAll();renderAdmin()}
async function adminLogout(){await db.auth.signOut();adminSession=null;renderAdmin()}
function renderAdmin(){$("adminLogin").classList.toggle("hidden",!!adminSession);$("adminApp").classList.toggle("hidden",!adminSession);if(adminSession){$("adminEmail").textContent=adminSession.user.email;renderAdminUI()}}
function showAdminTab(n,b){document.querySelectorAll(".admin-panel").forEach(x=>x.classList.remove("active"));$("admin-"+n).classList.add("active");document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active")}
function renderAdminUI(){
  renderDays("adminDays",selectedDate,"selectAdminDate");const d=dayObj(selectedDate);$("adminDayTitle").textContent=fmt(selectedDate)+" · "+(d.theme||"Tagesplan");renderProgress("adminProgress",selectedDate);renderDayparts("adminDayparts",selectedDate,true);
  $("adminHomePreview").innerHTML=`<div class="team-card"><h3>${esc(data.settings.home_verse||data.settings.daily_verse||"Home")}</h3><p>${esc(data.settings.home_verse_ref||data.settings.daily_verse_ref||"")}</p><p>${esc(data.settings.home_motivation||data.settings.motivation_text||"")}</p></div>`;
  $("adminTemplates").innerHTML=data.templates.map(x=>`<div class="asset-card"><img src="${esc(x.file_url)}"><div class="asset-body"><strong>${esc(x.title)}</strong><div class="edit-row"><button class="edit" onclick="openForm('template','${x.id}')">Bearbeiten</button><button class="delete" onclick="removeRow('template','${x.id}')">Löschen</button></div></div></div>`).join("");
  $("adminFinished").innerHTML=data.finished.map(x=>`<div class="asset-card">${x.file_type?.startsWith("video")?`<video controls src="${esc(x.file_url)}"></video>`:`<img src="${esc(x.file_url)}">`}<div class="asset-body"><strong>${esc(x.title)}</strong><div class="edit-row"><button class="edit" onclick="openForm('finished','${x.id}')">Bearbeiten</button><button class="delete" onclick="removeRow('finished','${x.id}')">Löschen</button></div></div></div>`).join("");
  $("adminTeam").innerHTML=data.members.map(m=>`<div class="team-card"><h3>${esc(m.name)}</h3><p>${[...new Set(m.roles||[])].map(esc).join(" · ")}</p><div class="edit-row"><button class="edit" onclick="openForm('member','${m.id}')">Bearbeiten</button><button class="delete" onclick="removeRow('member','${m.id}')">Löschen</button></div></div>`).join("")
}
function renderAll(){header();renderHome();renderPlan();renderMine();renderTeam();renderTemplates();renderFinished();if(adminSession)renderAdminUI()}

/* Admin forms intentionally keep V10/V11 data model and use only existing tables. */
function memberOptions(selected=[]){return data.members.map(m=>`<option value="${m.id}" ${selected.includes(m.id)?"selected":""}>${esc(m.name)}</option>`).join("")}
function responsibleRows(selected=[]){return `<div id="responsibleRows" class="responsibles">${(selected.length?selected:[""]).map(v=>`<div class="responsible-row"><select class="responsible-select"><option value="">Person auswählen …</option>${memberOptions(v?[v]:[])}</select><button type="button" class="responsible-remove" onclick="this.parentElement.remove()">×</button></div>`).join("")}</div><button type="button" class="responsible-add" onclick="addResponsible()">+ weitere Person</button>`}
function addResponsible(){$("responsibleRows").insertAdjacentHTML("beforeend",`<div class="responsible-row"><select class="responsible-select"><option value="">Person auswählen …</option>${memberOptions([])}</select><button type="button" class="responsible-remove" onclick="this.parentElement.remove()">×</button></div>`)}
function selectedResponsibles(){return [...document.querySelectorAll(".responsible-select")].map(x=>x.value).filter(Boolean)}
function programOptions(sel=""){return data.program.filter(p=>p.event_date===selectedDate).map(p=>`<option value="${p.id}" ${p.id===sel?"selected":""}>${esc(tval(p.start_time))} · ${esc(p.title)}</option>`).join("")}
function openForm(type,id=null,subId=null,programId=null,part=null){
  editing={type,id,subId,programId,part};let x,h="";
  if(type==="day"){x=dayObj(id);h=`<div class="form-grid"><div class="field"><label>Thema</label><input id="fTheme" value="${esc(x.theme||"")}"></div><div class="field"><label>Beschreibung</label><textarea id="fDesc">${esc(x.description||"")}</textarea></div><div class="field"><label>Kurzes Label</label><input id="fShort" value="${esc(x.short_label||"")}"></div><div class="field"><label>Datumsanzeige</label><input id="fDisplay" value="${esc(x.display_date||"")}"></div></div>`}
  if(type==="program"){x=data.program.find(a=>a.id===id);h=`<div class="form-grid two"><div class="field"><label>Uhrzeit</label><input id="fTime" type="time" value="${tval(x?.start_time)||"10:00"}"></div><div class="field"><label>Tageszeit</label><select id="fPart">${["morning","midday","evening"].map(v=>`<option value="${v}" ${(x?.daypart||part)===v?"selected":""}>${v==="morning"?"Morgen":v==="midday"?"Mittag":"Abend"}</option>`).join("")}</select></div><div class="field full"><label>Titel</label><input id="fTitle" value="${esc(x?.title)}"></div><div class="field"><label>Sprecher optional</label><input id="fSpeaker" value="${esc(x?.speaker||"")}"></div><div class="field full"><label>Beschreibung</label><textarea id="fDesc">${esc(x?.description||"")}</textarea></div></div>`}
  if(type==="sub"){x=data.subs.find(a=>a.id===id);h=`<div class="form-grid two"><div class="field full"><label>Programmpunkt</label><select id="fProgram">${programOptions(x?.program_id||programId)}</select></div><div class="field"><label>Art</label><select id="fKind">${["Worship","Predigt","Games","Gebet","Kleingruppe","Freizeit","Sonstiges"].map(v=>`<option ${x?.kind===v?"selected":""}>${v}</option>`).join("")}</select></div><div class="field"><label>Reihenfolge</label><input id="fOrder" type="number" value="${x?.sort_order||1}"></div><div class="field"><label>Uhrzeit optional</label><input id="fTime" type="time" value="${tval(x?.start_time)}"></div><div class="field full"><label>Titel</label><input id="fTitle" value="${esc(x?.title||"")}"></div><div class="field full"><label>Beschreibung</label><textarea id="fDesc">${esc(x?.description||"")}</textarea></div></div>`}
  if(type==="todo"){x=data.todos.find(a=>a.id===id);const ass=x?data.todoAssign.filter(a=>a.todo_id===x.id).map(a=>a.member_id):[];h=`<div class="form-grid two"><div class="field"><label>Typ</label><select id="fType">${["Story","Reel","Foto","Interview"].map(v=>`<option ${x?.type===v?"selected":""}>${v}</option>`).join("")}</select></div><div class="field"><label>Reihenfolge</label><input id="fOrder" type="number" value="${x?.sort_order||1}"></div><div class="field full"><label>Titel</label><input id="fTitle" value="${esc(x?.title||"")}"></div><div class="field full"><label>Beschreibung</label><textarea id="fDesc">${esc(x?.description||"")}</textarea></div><div class="field"><label>Uhrzeit/Deadline</label><input id="fTime" type="time" value="${tval(x?.due_time)}"></div><div class="field full"><label>TikTok-/Instagram-Beispiel</label><input id="fURL" value="${esc(x?.example_url||"")}"></div><div class="field full"><label>Verantwortliche</label>${responsibleRows(ass)}</div><div class="field full"><label>Bilder / MP4</label><input id="fFiles" type="file" accept="image/*,video/mp4" multiple></div><div class="field full"><label>Beschreibungen – eine Zeile pro Datei</label><textarea id="fCaptions"></textarea></div></div>`}
  if(type==="member"){x=data.members.find(a=>a.id===id);h=`<div class="form-grid"><div class="field"><label>Name</label><input id="fName" value="${esc(x?.name||"")}"></div><div class="field"><label>E-Mail</label><input id="fEmail" type="email" value="${esc(x?.email||"")}"></div><div class="field"><label>Telefon</label><input id="fPhone" value="${esc(x?.phone||"")}"></div><div class="field"><label>Rollen, Komma getrennt</label><input id="fRoles" value="${esc((x?.roles||[]).join(", "))}"></div></div>`}
  if(type==="settings"){const s=data.settings;h=`<div class="form-grid"><div class="field"><label>Ermutigung</label><textarea id="fMotivation">${esc(s.home_motivation||s.motivation_text||"")}</textarea></div><div class="field"><label>Bibelvers</label><textarea id="fVerse">${esc(s.home_verse||s.daily_verse||"")}</textarea></div><div class="field"><label>Bibelstelle</label><input id="fVerseRef" value="${esc(s.home_verse_ref||s.daily_verse_ref||"")}"></div><div class="field"><label>Bibel-Link</label><input id="fBible" value="${esc(s.bible_url||"")}"></div><div class="field"><label>WhatsApp-Gruppe</label><input id="fWhatsapp" value="${esc(s.whatsapp_url||"")}"></div><div class="field"><label>Dropbox</label><input id="fDropbox" value="${esc(s.dropbox_url||"")}"></div><div class="field"><label>Instagram</label><input id="fInstagram" value="${esc(s.instagram_url||"")}"></div><div class="field"><label>TikTok</label><input id="fTiktok" value="${esc(s.tiktok_url||"")}"></div><div class="field"><label>Ankündigung</label><textarea id="fAnnouncement">${esc(s.announcement||"")}</textarea></div></div>`}
  if(type==="template"){x=data.templates.find(a=>a.id===id);h=`<div class="form-grid"><div class="field"><label>Titel</label><input id="fTitle" value="${esc(x?.title||"")}"></div><div class="field"><label>Kategorie</label><input id="fCategory" value="${esc(x?.category||"")}"></div><div class="field"><label>Beschreibung</label><textarea id="fDesc">${esc(x?.description||"")}</textarea></div><div class="field"><label>Bild</label><input id="fFile" type="file" accept="image/*"></div></div>`}
  if(type==="finished"){x=data.finished.find(a=>a.id===id);h=`<div class="form-grid"><div class="field"><label>Datum</label><input id="fDate" type="date" value="${x?.event_date||selectedDate}"></div><div class="field"><label>Titel</label><input id="fTitle" value="${esc(x?.title||"")}"></div><div class="field"><label>Kategorie</label><input id="fCategory" value="${esc(x?.category||"")}"></div><div class="field"><label>Beschreibung</label><textarea id="fDesc">${esc(x?.description||"")}</textarea></div><div class="field"><label>Datei</label><input id="fFile" type="file" accept="image/*,video/mp4,application/pdf"></div></div>`}
  if(type==="roles"){const current=data.programAssign.filter(a=>a.program_id===id),roles=["Bereichsleiter","Fotograf","Story-Koordinator","Story-Maker","Reel-Maker","Interview"];h=`<div class="form-grid">${roles.map(role=>`<div class="field"><label>${role}</label>${responsibleRows(current.filter(a=>a.role===role).map(a=>a.member_id)).replaceAll('responsibleRows','responsibleRows')}</div>`).join("")}</div>`}
  $("formTitle").textContent=id?"Bearbeiten":"Neu hinzufügen";$("formBody").innerHTML=h;$("formError").classList.add("hidden");$("formOverlay").classList.remove("hidden")
}
function closeForm(){$("formOverlay").classList.add("hidden");editing=null}
const val=id=>$(id)?.value||"";
async function upload(file,folder){const path=`${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;const r=await db.storage.from(CFG.storageBucket).upload(path,file);if(r.error)throw r.error;return db.storage.from(CFG.storageBucket).getPublicUrl(path).data.publicUrl}
async function saveForm(){
  const {type,id,subId}=editing,b=$("saveFormBtn");b.disabled=true;
  try{
    if(type==="day"){let r=await db.from("festival_days").update({theme:val("fTheme"),description:val("fDesc"),short_label:val("fShort"),display_date:val("fDisplay")}).eq("event_date",id);if(r.error)throw r.error}
    if(type==="program"){const row={event_date:selectedDate,start_time:val("fTime"),daypart:val("fPart"),title:val("fTitle")||"Programmpunkt",speaker:val("fSpeaker")||null,description:val("fDesc"),published:true};let r=id?await db.from("program_items").update(row).eq("id",id):await db.from("program_items").insert(row);if(r.error)throw r.error}
    if(type==="sub"){const row={program_id:val("fProgram"),kind:val("fKind"),sort_order:+val("fOrder")||1,start_time:val("fTime")||null,title:val("fTitle")||"Unterpunkt",description:val("fDesc")};let r=id?await db.from("program_subitems").update(row).eq("id",id):await db.from("program_subitems").insert(row);if(r.error)throw r.error}
    if(type==="todo"){const sid=id?data.todos.find(x=>x.id===id)?.subitem_id:subId,row={subitem_id:sid,event_date:selectedDate,type:val("fType"),title:val("fTitle")||val("fType"),description:val("fDesc"),due_time:val("fTime")||null,example_url:val("fURL")||null,sort_order:+val("fOrder")||1};let tid=id;if(id){let r=await db.from("content_todos").update(row).eq("id",id);if(r.error)throw r.error}else{let r=await db.from("content_todos").insert(row).select("id").single();if(r.error)throw r.error;tid=r.data.id}await db.from("todo_assignments").delete().eq("todo_id",tid);const mids=selectedResponsibles();if(mids.length){let r=await db.from("todo_assignments").insert(mids.map(member_id=>({todo_id:tid,member_id})));if(r.error)throw r.error}const files=[...$("fFiles").files],caps=val("fCaptions").split("\n");for(let i=0;i<files.length;i++){const url=await upload(files[i],"todo-media/"+tid);let r=await db.from("todo_media").insert({todo_id:tid,media_type:files[i].type.startsWith("video")?"video":"image",url,caption:(caps[i]||"").trim(),sort_order:i+1});if(r.error)throw r.error}}
    if(type==="member"){const row={name:val("fName")||"Person",email:val("fEmail")||null,phone:val("fPhone")||null,roles:val("fRoles").split(",").map(x=>x.trim()).filter(Boolean)};let r=id?await db.from("team_members").update(row).eq("id",id):await db.from("team_members").insert(row);if(r.error)throw r.error}
    if(type==="settings"){const row={home_motivation:val("fMotivation"),home_verse:val("fVerse"),home_verse_ref:val("fVerseRef"),bible_url:val("fBible"),whatsapp_url:val("fWhatsapp"),dropbox_url:val("fDropbox"),instagram_url:val("fInstagram"),tiktok_url:val("fTiktok"),announcement:val("fAnnouncement")};let r=data.settings.id?await db.from("app_settings").update(row).eq("id",data.settings.id):await db.from("app_settings").insert(row);if(r.error)throw r.error}
    if(type==="template"){let old=data.templates.find(x=>x.id===id),url=old?.file_url||null,file=$("fFile").files[0];if(file)url=await upload(file,"templates");if(!url)throw Error("Bitte Bild auswählen.");const row={title:val("fTitle")||"Vorlage",category:val("fCategory"),description:val("fDesc"),file_url:url};let r=id?await db.from("templates").update(row).eq("id",id):await db.from("templates").insert(row);if(r.error)throw r.error}
    if(type==="finished"){let old=data.finished.find(x=>x.id===id),url=old?.file_url||null,file=$("fFile").files[0],typeName=old?.file_type||"";if(file){url=await upload(file,"finished");typeName=file.type}if(!url)throw Error("Bitte Datei auswählen.");const row={event_date:val("fDate"),title:val("fTitle")||"Datei",category:val("fCategory"),description:val("fDesc"),file_url:url,file_type:typeName};let r=id?await db.from("finished_content").update(row).eq("id",id):await db.from("finished_content").insert(row);if(r.error)throw r.error}
    closeForm();await loadAll()
  }catch(e){console.error(e);$("formError").textContent=e.message;$("formError").classList.remove("hidden")}finally{b.disabled=false}
}
async function toggleTodo(id,done){const r=await db.from("content_todos").update({done}).eq("id",id);if(r.error)return alert(r.error.message);await loadAll()}
async function removeRow(type,id){if(!confirm("Wirklich löschen?"))return;const table={program:"program_items",sub:"program_subitems",todo:"content_todos",member:"team_members",template:"templates",finished:"finished_content"}[type];const r=await db.from(table).delete().eq("id",id);if(r.error)return alert(r.error.message);await loadAll()}
db.auth.onAuthStateChange((_e,s)=>{adminSession=s;if(!$("adminOverlay").classList.contains("hidden"))renderAdmin()});
window.addEventListener("DOMContentLoaded",async()=>{
  // Remove old PWA/service-worker cache registrations from previous versions.
  if("serviceWorker" in navigator){try{const regs=await navigator.serviceWorker.getRegistrations();for(const r of regs)await r.unregister()}catch(e){}}
  const saved=sessionStorage.getItem("gyTeamPass")||"";
  if(saved){
    teamPass=saved;
    const r=await db.rpc("team_members_with_passcode",{passcode:saved});
    if(!r.error){
      $("teamGate").classList.add("hidden");$("appShell").classList.remove("hidden");await loadAll(r.data||[]);return
    }
    sessionStorage.removeItem("gyTeamPass")
  }
});
