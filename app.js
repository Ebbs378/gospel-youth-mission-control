
const C=window.MISSION_CONFIG,S=window.supabase.createClient(C.supabaseUrl,C.supabaseKey),$=x=>document.getElementById(x);
let D={settings:{},days:[],members:[],program:[],subs:[],todos:[],assign:[],programAssign:[],media:[],templates:[],finished:[]}; let date="2026-08-29",mine="",mineDate="",finishedDate="",teamFilter="Alle",templateFilter="Alle",finishedFilter="Alle",planPart="all",session=null,editing=null,galleryItems=[],galleryIndex=0,teamPass=sessionStorage.getItem("gyTeamPass")||"";
const esc=(s="")=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const tval=t=>(t||"").slice(0,5), fmt=d=>new Date(d+"T12:00").toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"long"});
function err(m){$("error").textContent=m;$("error").classList.remove("hidden")}function clearErr(){$("error").classList.add("hidden")}
function toggleTheme(){let x=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=x;localStorage.setItem("gyV10Theme",x)}document.documentElement.dataset.theme=localStorage.getItem("gyV10Theme")||"dark";
async function unlockTeam(){teamPass=$("teamPassword").value.trim();let {data,error}=await S.rpc("team_members_with_passcode",{passcode:teamPass});if(error){$("gateMsg").textContent="Passwort nicht korrekt.";return}sessionStorage.setItem("gyTeamPass",teamPass);$("teamGate").classList.add("hidden");$("appRoot").classList.remove("hidden");await load(data)}
async function load(prefetchedMembers=null){
 clearErr();try{
  let qs=await Promise.all([S.from("app_settings").select("*").limit(1),S.from("festival_days").select("*").order("event_date"),S.from("program_items").select("*").order("event_date").order("start_time"),S.from("program_subitems").select("*").order("sort_order"),S.from("content_todos").select("*").order("sort_order"),S.from("todo_assignments").select("*"),S.from("program_assignments").select("*"),S.from("todo_media").select("*").order("sort_order"),S.from("templates").select("*").order("created_at"),S.from("finished_content").select("*").order("created_at",{ascending:false})]);qs.forEach(q=>{if(q.error)throw q.error});
  let members=prefetchedMembers;if(!members){let r=await S.rpc("team_members_with_passcode",{passcode:teamPass||""});if(r.error)throw r.error;members=r.data}
  [D.settings,D.days,D.members,D.program,D.subs,D.todos,D.assign,D.programAssign,D.media,D.templates,D.finished]=[qs[0].data[0]||{},qs[1].data,members||[],qs[2].data,qs[3].data,qs[4].data,qs[5].data,qs[6].data,qs[7].data,qs[8].data,qs[9].data];
  if(D.days.length&&!D.days.some(x=>x.event_date===date))date=D.days[0].event_date;if(!mineDate)mineDate=date;if(!finishedDate)finishedDate=date;render()
 }catch(e){console.error(e);err("Supabase: "+e.message)}
}
function render(){header();home();days("days",date,"selectDate");planFilters();dayHero();progress("progress",date);dayparts("dayparts",date,false);mineUI();team();templates();finished();if(session)adminUI()}
function header(){let st=D.settings, bible=st.bible_url||"https://www.bible.com/bible/157/MAT.1.SCH2000";$("title").textContent=st.event_title||"Sommerfestival 2026";$("subtitle").textContent=st.event_subtitle||"Heaven Now";["ig","igHome"].forEach(i=>$(i).href=st.instagram_url||"#");["tt","ttHome"].forEach(i=>$(i).href=st.tiktok_url||"#");["quiet","homeBible"].forEach(i=>$(i).href=bible);["waHome","waTeam"].forEach(i=>$(i).href=st.whatsapp_url||"#");["dropboxHome","dropboxFinished"].forEach(i=>$(i).href=st.dropbox_url||"#")}
function home(){let st=D.settings,d=dayObj(date);$("homeVerse").textContent=st.daily_verse||"Alles, was ihr tut, geschehe in Liebe.";$("homeVerseRef").textContent=st.daily_verse_ref||"1. Korinther 16,14";$("motivationTitle").textContent=st.motivation_title||"Wir halten fest, was Gott hier tut.";$("motivationText").textContent=st.motivation_text||"Unser Content ist kein Selbstzweck. Wir dienen Menschen, erzählen Geschichten und machen sichtbar, was Gott bewegt.";$("announcement").innerHTML=st.announcement?`<div class="announcement"><b>Team-Info</b><span>${esc(st.announcement)}</span></div>`:"";let a=dayTodos(date),done=a.filter(x=>x.done).length;$("homeToday").innerHTML=`<div><div class="kicker">Heute · ${fmt(date)}</div><h3>${esc(d.theme||"Tagesplan")}</h3><p>${esc(d.briefing||d.description||"")}</p></div><strong>${done}/${a.length}</strong>`}
function showView(v){document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));$("view-"+v).classList.add("active");document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===v));if(v==="mine")mineUI();if(v==="finished")finished();window.scrollTo({top:0,behavior:"smooth"})}
function days(id,selected,fn){$(id).innerHTML=D.days.map(d=>`<button class="day ${d.event_date===selected?"active":""}" onclick="${fn}('${d.event_date}')"><strong>${esc(d.short_label||fmt(d.event_date).slice(0,2))}</strong><small>${esc(d.display_date||fmt(d.event_date).replace(/^[^,]+, /,""))}</small></button>`).join("")}
function selectDate(x){date=x;render()}function selectAdminDate(x){date=x;render()}function selectMineDate(x){mineDate=x;mineUI()}

function planFilters(){let a=[["all","Ganzer Tag"],["morning","Morgen"],["midday","Mittag"],["evening","Abend"]];$("planPartFilters").innerHTML=a.map(([k,l])=>`<button class="pill ${planPart===k?"active":""}" onclick="planPart='${k}';planFilters();dayparts('dayparts',date,false)">${l}</button>`).join("")}
function dayObj(d){return D.days.find(x=>x.event_date===d)||{event_date:d,theme:"",description:""}}
function dayHero(){let d=dayObj(date);$("dayHero").innerHTML=`<div class="dateLine">${fmt(date)}</div><h2>${esc(d.theme||"Tagesplan")}</h2>${d.description?`<p>${esc(d.description)}</p>`:""}`}
function todoCat(x){return x.type||"Story"}function dayTodos(d){return D.todos.filter(x=>x.event_date===d)}
function progress(id,d){let a=dayTodos(d),cats=["Story","Reel","Foto","Interview"];$(id).innerHTML=`<div class="progressGrid">${cats.map(c=>{let z=a.filter(x=>x.type===c),done=z.filter(x=>x.done).length;return `<div class="metric"><div class="metricTop"><span>${c}${c==="Story"?"s":c==="Foto"?"s":""}</span><strong>${done} / ${z.length}</strong></div><div class="bar"><i style="width:${z.length?done/z.length*100:0}%"></i></div></div>`}).join("")}</div>`}
function programRoles(p){let rows=D.programAssign.filter(a=>a.program_id===p.id), groups={};rows.forEach(a=>{(groups[a.role]??=[]).push(memberName(a.member_id))});return Object.entries(groups).filter(([,n])=>n.length).map(([r,n])=>`<span class="role">${esc(r)} · <strong>${n.map(esc).join(" + ")}</strong></span>`).join("")}
function memberName(id){return D.members.find(m=>m.id===id)?.name||"?"}
function todoAssignees(id){return D.assign.filter(a=>a.todo_id===id).map(a=>memberName(a.member_id))}
function mediaFor(id){return D.media.filter(m=>m.todo_id===id)}
function embed(url){if(!url)return"";try{let u=new URL(url);if(u.hostname.includes("tiktok.com")){let m=u.pathname.match(/\/video\/(\d+)/);if(m)return `<div class="videoBox"><iframe loading="lazy" allow="fullscreen; autoplay" src="https://www.tiktok.com/player/v1/${m[1]}?autoplay=0"></iframe></div>`}if(u.hostname.includes("instagram.com")){let clean=url.split("?")[0].replace(/\/?$/,"/");return `<div class="videoBox"><iframe loading="lazy" src="${esc(clean)}embed/"></iframe></div>`}}catch(e){}return""}
function todoHTML(x,admin=false){let people=todoAssignees(x.id),med=mediaFor(x.id),images=med.filter(m=>m.media_type==="image"),vid=med.find(m=>m.media_type==="video"||m.media_type==="link");return `<div class="todo ${x.done?"done":""}"><div class="todoTop"><div><div class="todoTitle">${esc(x.type)} · ${esc(x.title)}</div><div class="todoMeta">${x.due_time?esc(tval(x.due_time))+" · ":""}${esc(x.description||"")}</div></div>${x.done?`<span>✓</span>`:""}</div>${people.length?`<div class="assignees">${people.map(n=>`<span class="person">${esc(n)}</span>`).join("")}</div>`:""}${x.example_url?embed(x.example_url)+`<a class="external" target="_blank" href="${esc(x.example_url)}">Original öffnen ↗</a>`:""}${vid&&vid.url&&!x.example_url?embed(vid.url):""}${images.length?`<div class="mediaStrip">${images.map((m,i)=>`<div class="thumb" onclick="openTodoGallery('${x.id}',${i})"><img src="${esc(m.url)}"><small>${esc(m.caption||"")}</small></div>`).join("")}</div>`:""}${admin?`<div class="editRow"><button class="checkBtn ${x.done?"done":""}" onclick="toggleTodo('${x.id}',${!x.done})">${x.done?"Erledigt ✓":"Erledigt"}</button><button class="moreBtn" onclick="openActions('todo','${x.id}')">•••</button></div>`:""}</div>`}
function subHTML(s,idx,admin=false){let ts=D.todos.filter(t=>t.subitem_id===s.id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));return `<div class="sub"><div class="subHead"><div class="num">${idx+1}</div><div><h4>${esc(s.title)}</h4><div class="subMeta">${[s.kind,tval(s.start_time)].filter(Boolean).map(esc).join(" · ")}</div>${s.description?`<p style="margin:5px 0">${esc(s.description)}</p>`:""}</div></div><div class="todos">${ts.map(t=>todoHTML(t,admin)).join("")}</div>${admin?`<div class="editRow"><button class="addBtn" onclick="openForm('todo',null,'${s.id}')">+ Content</button><button class="moreBtn" onclick="openActions('sub','${s.id}')">•••</button></div>`:""}</div>`}
function programHTML(p,admin=false){let ss=D.subs.filter(s=>s.program_id===p.id).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));return `<article class="program"><div class="programTop"><div class="programTime">${esc(tval(p.start_time))}</div><div><h3>${esc(p.title)}</h3>${p.speaker&&p.speaker!=="—"?`<div class="speaker">Sprecher: ${esc(p.speaker)}</div>`:""}${p.description?`<p class="programDesc">${esc(p.description)}</p>`:""}<div class="roles">${programRoles(p)}</div></div></div><div class="sublist">${ss.map((s,i)=>subHTML(s,i,admin)).join("")}</div>${admin?`<div class="editRow"><button class="addBtn" onclick="openForm('sub',null,null,'${p.id}')">+ Unterpunkt</button><button class="moreBtn" onclick="openActions('program','${p.id}')">•••</button></div>`:""}</article>`}
function dayparts(id,d,admin){let labels={morning:D.settings.heading_morning||"Morgen",midday:D.settings.heading_midday||"Mittag",evening:D.settings.heading_evening||"Abend"};$(id).innerHTML=Object.entries(labels).filter(([k])=>admin||planPart==="all"||planPart===k).map(([k,l])=>{let ps=D.program.filter(p=>p.event_date===d&&p.daypart===k);return `<section class="daypart"><div class="daypartHead"><h2>${esc(l)}</h2>${admin?`<button class="addBtn" onclick="openForm('program',null,null,null,'${k}')">+ Programmpunkt</button>`:""}</div><div class="programList">${ps.length?ps.map(p=>programHTML(p,admin)).join(""):`<p>Noch keine Programmpunkte.</p>`}</div></section>`}).join("")}
function mineUI(){let sel=$("minePerson");sel.innerHTML=`<option value="">Person auswählen …</option>${D.members.map(m=>`<option value="${m.id}" ${mine===m.id?"selected":""}>${esc(m.name)}</option>`).join("")}`;days("mineDays",mineDate,"selectMineDate");let today=mine?assignmentsFor(mine).filter(x=>x.date===mineDate):[];$("calendarAll").classList.toggle("hidden",!mine);$("mineList").innerHTML=mine?(today.length?(["morning","midday","evening"].map(part=>{let rows=today.filter(x=>x.part===part);if(!rows.length)return"";let label={morning:"Morgen",midday:"Mittag",evening:"Abend"}[part];return `<section class="minePart"><h3>${label}</h3>${rows.map(x=>`<div class="mineItem"><strong>${esc(x.time)}</strong><div><strong>${esc(x.title)}</strong><p>${esc(x.role)}${x.sub?" · "+esc(x.sub):""}</p><div class="actions"><a href="${esc(x.file_url)}" download target="_blank">Download ↓</a></div></div></div>`).join("")}</section>`}).join("")):`<p>Keine Einsätze an diesem Tag.</p>`):`<p>Wähle zuerst deinen Namen aus.</p>`}
function setMinePerson(x){mine=x;mineUI()}
function assignmentsFor(mid){let out=[];D.programAssign.filter(a=>a.member_id===mid).forEach(a=>{let p=D.program.find(x=>x.id===a.program_id);if(p)out.push({date:p.event_date,time:tval(p.start_time),title:p.title,role:a.role,part:p.daypart})});D.assign.filter(a=>a.member_id===mid).forEach(a=>{let t=D.todos.find(x=>x.id===a.todo_id),s=t&&D.subs.find(x=>x.id===t.subitem_id),p=s&&D.program.find(x=>x.id===s.program_id);if(t&&p)out.push({date:t.event_date,time:tval(t.due_time)||tval(p.start_time),title:t.title,role:t.type,sub:s.title,part:p.daypart})});return out.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))}
function exportMine(){let a=assignmentsFor(mine),ics="BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Gospel Youth//V10//DE\n";a.forEach(x=>{let d=x.date.replaceAll("-",""),s=(x.time||"12:00").replace(":","")+"00";ics+=`BEGIN:VEVENT\nDTSTART:${d}T${s}\nSUMMARY:${x.title}\nDESCRIPTION:${x.role}${x.sub?" - "+x.sub:""}\nEND:VEVENT\n`});ics+="END:VCALENDAR";blob(ics,(memberName(mine)||"Einsaetze")+".ics","text/calendar")}
function blob(t,n,type){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type}));a.download=n;a.click()}
function team(){let preferred=["Alle","Bereichsleiter","Fotograf","Story-Koordinator","Story-Maker","Reel-Maker","Interview"],extras=[...new Set(D.members.flatMap(m=>m.roles||[]))].filter(x=>!preferred.includes(x)),roles=[...preferred,...extras];$("teamFilters").innerHTML=roles.map(r=>`<button class="pill ${teamFilter===r?"active":""}" onclick="teamFilter=${JSON.stringify(r)};team()">${esc(r)}</button>`).join("");let a=D.members.filter(m=>teamFilter==="Alle"||(m.roles||[]).includes(teamFilter));a.sort((a,b)=>((b.roles||[]).includes("Bereichsleiter")?1:0)-((a.roles||[]).includes("Bereichsleiter")?1:0)||a.name.localeCompare(b.name));$("teamGrid").innerHTML=a.map(m=>`<div class="teamCard"><h3>${esc(m.name)}</h3><p>${(m.roles||[]).map(esc).join(" · ")}</p><div class="actions">${m.phone?`<a href="tel:${esc(m.phone)}">Anrufen</a><a target="_blank" href="https://wa.me/${esc(m.phone.replace(/\D/g,""))}">WhatsApp</a>`:""}${m.email?`<a href="mailto:${esc(m.email)}">E-Mail</a>`:""}</div></div>`).join("")}
function templates(){let cats=["Alle",...new Set(D.templates.map(x=>x.category).filter(Boolean))];$("templateFilters").innerHTML=cats.map(r=>`<button class="pill ${templateFilter===r?"active":""}" onclick="templateFilter=${JSON.stringify(r)};templates()">${esc(r)}</button>`).join("");let a=D.templates.filter(x=>templateFilter==="Alle"||x.category===templateFilter);$("templateGrid").innerHTML=a.map(x=>`<div class="templateCard"><img src="${esc(x.file_url)}" onclick="openTemplateGallery('${x.id}')"><div class="templateBody"><strong>${esc(x.title)}</strong><p>${esc(x.category||"Vorlage")}${x.description?" · "+esc(x.description):""}</p><div class="actions"><a href="${esc(x.file_url)}" download target="_blank">Download ↓</a></div></div></div>`).join("")}
function finished(){days("finishedDays",finishedDate,"selectFinishedDate");let cats=["Alle",...new Set(D.finished.map(x=>x.category).filter(Boolean))];$("finishedFilters").innerHTML=cats.map(r=>`<button class="pill ${finishedFilter===r?"active":""}" onclick="finishedFilter=${JSON.stringify(r)};finished()">${esc(r)}</button>`).join("");let a=D.finished.filter(x=>x.event_date===finishedDate&&(finishedFilter==="Alle"||x.category===finishedFilter));$("finishedGrid").innerHTML=a.length?a.map(x=>`<div class="templateCard">${x.file_type?.startsWith("video")?`<video controls preload="metadata" src="${esc(x.file_url)}"></video>`:`<img src="${esc(x.file_url)}" onclick="openFinishedGallery('${x.id}')">`}<div class="templateBody"><strong>${esc(x.title)}</strong><p>${esc(x.category||"Content")}${x.description?" · "+esc(x.description):""}</p><div class="actions"><a href="${esc(x.file_url)}" download target="_blank">Download ↓</a></div></div></div>`).join(""):`<p>Noch kein fertiger Content für diesen Tag.</p>`}function selectFinishedDate(x){finishedDate=x;finished()}function openFinishedGallery(id){let x=D.finished.find(t=>t.id===id);galleryItems=x?[{url:x.file_url,caption:x.description||x.title}]:[];galleryIndex=0;showGallery()}
function openTodoGallery(id,i=0){galleryItems=mediaFor(id).filter(x=>x.media_type==="image");galleryIndex=i;showGallery()}function openTemplateGallery(id){let x=D.templates.find(t=>t.id===id);galleryItems=x?[{url:x.file_url,caption:x.description||x.title}]:[];galleryIndex=0;showGallery()}function showGallery(){if(!galleryItems.length)return;let x=galleryItems[galleryIndex];$("galleryImg").src=x.url;$("galleryCaption").textContent=x.caption||"";$("gallery").classList.remove("hidden")}function galleryStep(n){galleryIndex=(galleryIndex+n+galleryItems.length)%galleryItems.length;showGallery()}function closeGallery(){$("gallery").classList.add("hidden")}
async function openAdmin(){$("admin").classList.remove("hidden");let {data}=await S.auth.getSession();session=data.session;adminRender()}function closeAdmin(){$("admin").classList.add("hidden")}async function login(){let {data,error}=await S.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error){$("loginMsg").textContent=error.message;return}session=data.session;$("teamGate").classList.add("hidden");$("appRoot").classList.remove("hidden");await load();adminRender()}async function logout(){await S.auth.signOut();session=null;adminRender();if(!teamPass){$("appRoot").classList.add("hidden");$("teamGate").classList.remove("hidden")}}
function adminRender(){$("login").classList.toggle("hidden",!!session);$("adminApp").classList.toggle("hidden",!session);if(session){$("adminEmail").textContent=session.user.email;adminUI()}}
function adminTab(x){document.querySelectorAll(".adminPane").forEach(e=>e.classList.add("hidden"));$("admin-"+x).classList.remove("hidden");document.querySelectorAll("[data-atab]").forEach(e=>e.classList.toggle("active",e.dataset.atab===x))}
function adminUI(){days("adminDays",date,"selectAdminDate");let d=dayObj(date);$("adminDayTitle").textContent=fmt(date)+" · "+(d.theme||"Tagesplan");progress("adminProgress",date);dayparts("adminDayparts",date,true);let st=D.settings;$("adminSettingsPreview").innerHTML=`<div class="settingsPreview"><b>${esc(st.daily_verse||"Kein Vers")}</b><p>${esc(st.daily_verse_ref||"")}</p><p>${esc(st.motivation_text||"")}</p><small>WhatsApp · Dropbox · Instagram · TikTok · Bibel-Link zentral editierbar</small></div>`;$("adminFinished").innerHTML=D.finished.map(x=>`<div class="templateCard"><img src="${esc(x.file_url)}"><div class="templateBody"><strong>${esc(x.title)}</strong><div class="editRow"><button class="editBtn" onclick="openForm('finished','${x.id}')">Bearbeiten</button><button class="deleteBtn" onclick="removeRow('finished','${x.id}')">Löschen</button></div></div></div>`).join("");$("adminTemplates").innerHTML=D.templates.map(x=>`<div class="templateCard"><img src="${esc(x.file_url)}"><div class="templateBody"><strong>${esc(x.title)}</strong><div class="editRow"><button class="editBtn" onclick="openForm('template','${x.id}')">Bearbeiten</button><button class="deleteBtn" onclick="removeRow('template','${x.id}')">Löschen</button></div></div></div>`).join("");$("adminTeam").innerHTML=D.members.map(m=>`<div class="teamCard"><h3>${esc(m.name)}</h3><p>${(m.roles||[]).map(esc).join(" · ")}</p><div class="editRow"><button class="editBtn" onclick="openForm('member','${m.id}')">Bearbeiten</button><button class="deleteBtn" onclick="removeRow('member','${m.id}')">Löschen</button></div></div>`).join("")}
function editDay(){openForm("day",date)}
function optionsMembers(sel=[]){return D.members.map(m=>`<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" class="memberCheck" value="${m.id}" ${sel.includes(m.id)?"checked":""}> ${esc(m.name)}</label>`).join("")}
function optionsProgram(sel=""){return D.program.filter(p=>p.event_date===date).map(p=>`<option value="${p.id}" ${p.id===sel?"selected":""}>${esc(tval(p.start_time))} · ${esc(p.title)}</option>`).join("")}
function openForm(type,id=null,subId=null,programId=null,daypart=null){editing={type,id,subId,programId,daypart};let x=null,h="";if(type==="day"){x=dayObj(id);h=`<div class="formGrid"><div class="field"><label>Thema des Tages</label><input id="fTheme" value="${esc(x.theme)}"></div><div class="field"><label>Beschreibung</label><textarea id="fDesc">${esc(x.description||"")}</textarea></div><div class="field"><label>Briefing des Tages</label><textarea id="fBrief">${esc(x.briefing||"")}</textarea></div><div class="field"><label>Kurzes Label</label><input id="fShort" value="${esc(x.short_label||"")}"></div><div class="field"><label>Datumsanzeige</label><input id="fDisplay" value="${esc(x.display_date||"")}"></div></div>`}
if(type==="program"){x=D.program.find(a=>a.id===id);h=`<div class="formGrid two"><div class="field"><label>Uhrzeit</label><input id="fTime" type="time" value="${tval(x?.start_time)||"10:00"}"></div><div class="field"><label>Tageszeit</label><select id="fPart">${["morning","midday","evening"].map(v=>`<option value="${v}" ${(x?.daypart||daypart)===v?"selected":""}>${v==="morning"?"Morgen":v==="midday"?"Mittag":"Abend"}</option>`).join("")}</select></div><div class="field full"><label>Titel</label><input id="fTitle" value="${esc(x?.title)}"></div><div class="field"><label>Sprecher</label><input id="fSpeaker" value="${esc(x?.speaker)}"></div><div class="field full"><label>Beschreibung</label><textarea id="fDesc">${esc(x?.description)}</textarea></div></div>`}
if(type==="sub"){x=D.subs.find(a=>a.id===id);h=`<div class="formGrid two"><div class="field full"><label>Programmpunkt</label><select id="fProgram">${optionsProgram(x?.program_id||programId)}</select></div><div class="field"><label>Art</label><select id="fKind">${["Worship","Predigt","Games","Gebet","Kleingruppe","Freizeit","Sonstiges"].map(v=>`<option ${x?.kind===v?"selected":""}>${v}</option>`).join("")}</select></div><div class="field"><label>Reihenfolge</label><input id="fOrder" type="number" value="${x?.sort_order||1}"></div><div class="field"><label>Uhrzeit optional</label><input id="fTime" type="time" value="${tval(x?.start_time)}"></div><div class="field full"><label>Titel</label><input id="fTitle" value="${esc(x?.title)}"></div><div class="field full"><label>Beschreibung</label><textarea id="fDesc">${esc(x?.description)}</textarea></div></div>`}
if(type==="todo"){x=D.todos.find(a=>a.id===id);let ass=x?D.assign.filter(a=>a.todo_id===x.id).map(a=>a.member_id):[];h=`<div class="formGrid two"><div class="field"><label>Typ</label><select id="fType">${["Story","Reel","Foto","Interview"].map(v=>`<option ${x?.type===v?"selected":""}>${v}</option>`).join("")}</select></div><div class="field"><label>Reihenfolge</label><input id="fOrder" type="number" value="${x?.sort_order||1}"></div><div class="field full"><label>Titel</label><input id="fTitle" value="${esc(x?.title)}"></div><div class="field full"><label>Beschreibung / Shotlist</label><textarea id="fDesc">${esc(x?.description)}</textarea></div><div class="field"><label>Deadline / Uhrzeit</label><input id="fTime" type="time" value="${tval(x?.due_time)}"></div><div class="field full"><label>TikTok-/Instagram-Beispiel-Link</label><input id="fURL" value="${esc(x?.example_url)}"><div class="help">TikTok-Videos werden direkt als Player angezeigt, wenn der Beitrag Embedding erlaubt.</div></div><div class="field full"><label>Verantwortliche Person(en)</label>${responsibleRows(ass)}</div><div class="field full"><label>Beispielbilder / eigene MP4-Datei</label><input id="fFiles" type="file" accept="image/png,image/jpeg,image/webp,video/mp4" multiple><div class="help">Mehrere Bilder möglich. MP4 wird direkt im Browser abgespielt.</div></div><div class="field full"><label>Beschreibungen zu Uploads</label><textarea id="fCaptions" placeholder="Eine Zeile pro Datei"></textarea></div></div>`}
if(type==="proles"){let cur=D.programAssign.filter(a=>a.program_id===id),roles=["Fotograf","Story-Koordinator","Story-Maker","Reel-Maker","Interview"];h=`<div class="formGrid">${roles.map(r=>`<div class="field"><label>${r} – mehrere möglich</label><div data-role="${r}" class="roleChecks">${optionsMembers(cur.filter(a=>a.role===r).map(a=>a.member_id))}</div></div>`).join("")}</div>`}
if(type==="member"){x=D.members.find(a=>a.id===id);h=`<div class="formGrid"><div class="field"><label>Name</label><input id="fName" value="${esc(x?.name)}"></div><div class="field"><label>E-Mail</label><input id="fEmail" type="email" value="${esc(x?.email)}"></div><div class="field"><label>Telefon</label><input id="fPhone" value="${esc(x?.phone)}"></div><div class="field"><label>Rollen, Komma getrennt</label><input id="fRoles" value="${esc((x?.roles||[]).join(", "))}"></div></div>`}
if(type==="settings"){x=D.settings;h=`<div class="formGrid"><div class="field"><label>Vers des Tages</label><textarea id="fVerse">${esc(x.daily_verse||"")}</textarea></div><div class="field"><label>Bibelstelle</label><input id="fVerseRef" value="${esc(x.daily_verse_ref||"")}"></div><div class="field"><label>Motivations-Überschrift</label><input id="fMotTitle" value="${esc(x.motivation_title||"")}"></div><div class="field"><label>Ermutigung / Motivation</label><textarea id="fMotText">${esc(x.motivation_text||"")}</textarea></div><div class="field"><label>Aktuelle Team-Ankündigung</label><textarea id="fAnnouncement">${esc(x.announcement||"")}</textarea></div><div class="field"><label>WhatsApp-Gruppenlink</label><input id="fWA" value="${esc(x.whatsapp_url||"")}"></div><div class="field"><label>Dropbox-Link</label><input id="fDropbox" value="${esc(x.dropbox_url||"")}"></div><div class="field"><label>Instagram-Link</label><input id="fIG" value="${esc(x.instagram_url||"")}"></div><div class="field"><label>WhatsApp-Gruppe</label><input id="fWhatsapp" value="${esc(D.settings.whatsapp_url||"")}"></div><div class="field"><label>Dropbox</label><input id="fDropbox" value="${esc(D.settings.dropbox_url||"")}"></div><div class="field"><label>Bibel-Link</label><input id="fBible" value="${esc(D.settings.bible_url||"https://www.bible.com/bible/157/MAT.1.SCH2000")}"></div><div class="field"><label>Begrüßung / Motivation</label><textarea id="fMotivation">${esc(D.settings.home_motivation||"")}</textarea></div><div class="field"><label>Vers</label><textarea id="fVerse">${esc(D.settings.home_verse||"")}</textarea></div><div class="field"><label>Bibelstelle</label><input id="fVerseRef" value="${esc(D.settings.home_verse_ref||"")}"></div><div class="field"><label>TikTok-Link</label><input id="fTT" value="${esc(x.tiktok_url||"")}"></div><div class="field"><label>Stille-Zeit / Bibel-Link</label><input id="fBible" value="${esc(x.bible_url||"")}"></div></div>`}
if(type==="finished"){x=D.finished.find(a=>a.id===id);h=`<div class="formGrid"><div class="field"><label>Tag</label><select id="fDate">${D.days.map(d=>`<option value="${d.event_date}" ${(x?.event_date||date)===d.event_date?"selected":""}>${esc(d.display_date||d.event_date)}</option>`).join("")}</select></div><div class="field"><label>Kategorie</label><select id="fCategory">${["Fotos","Predigtnotizen","Bibelvers","Grafiken","Video","Sonstiges"].map(v=>`<option ${x?.category===v?"selected":""}>${v}</option>`).join("")}</select></div><div class="field"><label>Titel</label><input id="fTitle" value="${esc(x?.title)}"></div><div class="field"><label>Beschreibung</label><textarea id="fDesc">${esc(x?.description)}</textarea></div><div class="field"><label>Datei</label><input id="fFiles" type="file" accept="image/*,video/mp4,application/pdf"></div></div>`}
if(type==="template"){x=D.templates.find(a=>a.id===id);h=`<div class="formGrid"><div class="field"><label>Titel</label><input id="fTitle" value="${esc(x?.title)}"></div><div class="field"><label>Kategorie</label><select id="fCategory">${["Story","Post","Reel Cover","Speaker","Verse","Sonstiges"].map(v=>`<option ${x?.category===v?"selected":""}>${v}</option>`).join("")}</select></div><div class="field"><label>Beschreibung</label><textarea id="fDesc">${esc(x?.description)}</textarea></div><div class="field"><label>PNG/JPG</label><input id="fFiles" type="file" accept="image/png,image/jpeg,image/webp"></div></div>`}
$("formTitle").textContent=id?"Bearbeiten":"Neu hinzufügen";$("formBody").innerHTML=h;$("formError").classList.add("hidden");$("formModal").classList.remove("hidden")}
function closeForm(){$("formModal").classList.add("hidden");editing=null}const val=id=>$(id)?.value||"";
async function upload(file,folder){let path=`${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`,r=await S.storage.from(C.storageBucket).upload(path,file);if(r.error)throw r.error;return S.storage.from(C.storageBucket).getPublicUrl(path).data.publicUrl}
async function saveForm(){let {type,id,subId}=editing,b=$("save");b.disabled=true;try{
 if(type==="day"){let r=await S.from("festival_days").update({theme:val("fTheme"),description:val("fDesc"),briefing:val("fBrief"),short_label:val("fShort"),display_date:val("fDisplay")}).eq("event_date",id);if(r.error)throw r.error}
 if(type==="program"){let row={event_date:date,start_time:val("fTime"),daypart:val("fPart"),title:val("fTitle")||"Programmpunkt",speaker:val("fSpeaker")||null,description:val("fDesc"),published:true},r=id?await S.from("program_items").update(row).eq("id",id):await S.from("program_items").insert(row);if(r.error)throw r.error}
 if(type==="sub"){let row={program_id:val("fProgram"),kind:val("fKind"),sort_order:+val("fOrder")||1,start_time:val("fTime")||null,title:val("fTitle")||"Unterpunkt",description:val("fDesc")},r=id?await S.from("program_subitems").update(row).eq("id",id):await S.from("program_subitems").insert(row);if(r.error)throw r.error}
 if(type==="todo"){let sid=id?D.todos.find(x=>x.id===id)?.subitem_id:subId, row={subitem_id:sid,event_date:date,type:val("fType"),title:val("fTitle")||val("fType"),description:val("fDesc"),due_time:val("fTime")||null,example_url:val("fURL")||null,sort_order:+val("fOrder")||1};let tid=id;if(id){let r=await S.from("content_todos").update(row).eq("id",id);if(r.error)throw r.error}else{let r=await S.from("content_todos").insert(row).select("id").single();if(r.error)throw r.error;tid=r.data.id}await S.from("todo_assignments").delete().eq("todo_id",tid);let mids=selectedResponsibles();if(mids.length){let r=await S.from("todo_assignments").insert(mids.map(member_id=>({todo_id:tid,member_id})));if(r.error)throw r.error}let files=[...$("fFiles").files],caps=val("fCaptions").split("\n");for(let i=0;i<files.length;i++){let url=await upload(files[i],"todo-media/"+tid),r=await S.from("todo_media").insert({todo_id:tid,media_type:files[i].type.startsWith("video")?"video":"image",url,caption:(caps[i]||"").trim(),sort_order:i+1});if(r.error)throw r.error}}
 if(type==="proles"){let rows=[];document.querySelectorAll(".roleChecks").forEach(box=>box.querySelectorAll("input:checked").forEach(ch=>rows.push({program_id:id,member_id:ch.value,role:box.dataset.role})));let p=D.program.find(x=>x.id===id),conf=[];for(let row of rows){for(let a of D.programAssign.filter(a=>a.member_id===row.member_id&&a.program_id!==id)){let other=D.program.find(x=>x.id===a.program_id);if(other&&p&&other.event_date===p.event_date&&tval(other.start_time)===tval(p.start_time))conf.push(memberName(row.member_id)+" ist gleichzeitig bei „"+other.title+"“ eingeteilt.")}}if(conf.length&&!confirm("Doppelbelegung gefunden:\n\n"+[...new Set(conf)].join("\n")+"\n\nTrotzdem speichern?")){b.disabled=false;return}await S.from("program_assignments").delete().eq("program_id",id);if(rows.length){let r=await S.from("program_assignments").insert(rows);if(r.error)throw r.error}}
 if(type==="member"){let row={name:val("fName")||"Person",email:val("fEmail")||null,phone:val("fPhone")||null,roles:val("fRoles").split(",").map(x=>x.trim()).filter(Boolean)},r=id?await S.from("team_members").update(row).eq("id",id):await S.from("team_members").insert(row);if(r.error)throw r.error}
 if(type==="settings"){let row={daily_verse:val("fVerse"),daily_verse_ref:val("fVerseRef"),motivation_title:val("fMotTitle"),motivation_text:val("fMotText"),announcement:val("fAnnouncement"),whatsapp_url:val("fWA"),dropbox_url:val("fDropbox"),instagram_url:val("fIG"),tiktok_url:val("fTT"),bible_url:val("fBible")};let r=await S.from("app_settings").update(row).eq("id",D.settings.id);if(r.error)throw r.error}
 if(type==="finished"){let old=D.finished.find(x=>x.id===id),url=old?.file_url||null,ft=old?.file_type||null,file=$("fFiles").files[0];if(file){url=await upload(file,"finished-content/"+val("fDate"));ft=file.type}if(!url)throw Error("Bitte eine Datei auswählen.");let row={event_date:val("fDate"),category:val("fCategory"),title:val("fTitle")||"Content",description:val("fDesc"),file_url:url,file_type:ft},r=id?await S.from("finished_content").update(row).eq("id",id):await S.from("finished_content").insert(row);if(r.error)throw r.error}
 if(type==="template"){let old=D.templates.find(x=>x.id===id),url=old?.file_url||null,file=$("fFiles").files[0];if(file)url=await upload(file,"templates");if(!url)throw Error("Bitte ein Bild auswählen.");let row={title:val("fTitle")||"Vorlage",category:val("fCategory"),description:val("fDesc"),file_url:url},r=id?await S.from("templates").update(row).eq("id",id):await S.from("templates").insert(row);if(r.error)throw r.error}
 closeForm();await load()
}catch(e){$("formError").textContent=e.message;$("formError").classList.remove("hidden");console.error(e)}finally{b.disabled=false}}
async function toggleTodo(id,done){let r=await S.from("content_todos").update({done}).eq("id",id);if(r.error)return alert(r.error.message);await load()}
async function removeRow(type,id){if(!confirm("Wirklich löschen?"))return;let table={program:"program_items",sub:"program_subitems",todo:"content_todos",member:"team_members",template:"templates",finished:"finished_content"}[type],r=await S.from(table).delete().eq("id",id);if(r.error)return alert(r.error.message);await load()}
function openActions(type,id){let h="";if(type==="program")h=`<button onclick="closeActionMenu();openForm('program','${id}')">Bearbeiten</button><button onclick="closeActionMenu();openForm('proles','${id}')">Zuweisungen</button><button onclick="duplicateProgram('${id}')">Duplizieren</button><button class="danger" onclick="closeActionMenu();removeRow('program','${id}')">Löschen</button>`;if(type==="sub")h=`<button onclick="closeActionMenu();openForm('sub','${id}')">Bearbeiten</button><button onclick="duplicateSub('${id}')">Duplizieren</button><button class="danger" onclick="closeActionMenu();removeRow('sub','${id}')">Löschen</button>`;if(type==="todo")h=`<button onclick="closeActionMenu();openForm('todo','${id}')">Bearbeiten</button><button class="danger" onclick="closeActionMenu();removeRow('todo','${id}')">Löschen</button>`;$("actionBody").innerHTML=h;$("actionMenu").classList.remove("hidden")}function closeActionMenu(){$("actionMenu").classList.add("hidden")}
async function duplicateProgram(id){let p=D.program.find(x=>x.id===id);if(!p)return;let row={...p};delete row.id;delete row.created_at;let r=await S.from("program_items").insert({...row,title:row.title+" · Kopie"}).select("id").single();if(r.error)return alert(r.error.message);for(let sub of D.subs.filter(x=>x.program_id===id)){let sr={...sub,program_id:r.data.id};delete sr.id;delete sr.created_at;let q=await S.from("program_subitems").insert(sr).select("id").single();if(q.error)continue;for(let t of D.todos.filter(x=>x.subitem_id===sub.id)){let tr={...t,subitem_id:q.data.id,done:false};delete tr.id;delete tr.created_at;delete tr.updated_at;await S.from("content_todos").insert(tr)}}closeActionMenu();await load()}
async function duplicateSub(id){let sub=D.subs.find(x=>x.id===id);if(!sub)return;let sr={...sub,title:sub.title+" · Kopie"};delete sr.id;delete sr.created_at;let q=await S.from("program_subitems").insert(sr).select("id").single();if(q.error)return alert(q.error.message);for(let t of D.todos.filter(x=>x.subitem_id===id)){let tr={...t,subitem_id:q.data.id,done:false};delete tr.id;delete tr.created_at;delete tr.updated_at;await S.from("content_todos").insert(tr)}closeActionMenu();await load()}
S.auth.onAuthStateChange((_e,s)=>{session=s;if(!$("admin").classList.contains("hidden"))adminRender()});document.addEventListener("DOMContentLoaded",async()=>{let {data}=await S.auth.getSession();session=data.session;if(teamPass){$("teamGate").classList.add("hidden");$("appRoot").classList.remove("hidden");await load()}else if(session){$("teamGate").classList.add("hidden");$("appRoot").classList.remove("hidden");await load()}});


/* === V11.1 FIXES / UI OVERRIDES === */
window.__gy_team_unlocked = sessionStorage.getItem("gyTeamUnlocked")==="1";

async function unlockTeam(){
  const code=$("teamCode").value.trim();
  $("gateError").textContent="";
  try{
    const {data,error}=await S.rpc("team_members_with_passcode",{passcode:code});
    if(error) throw error;
    if(code!=="7777" && !data){ throw new Error("Falscher Team-Code."); }
    sessionStorage.setItem("gyTeamUnlocked","1");
    window.__gy_team_unlocked=true;
    if(Array.isArray(data) && data.length) D.members=data;
    $("teamGate").classList.add("hidden");
    $("appShell").classList.remove("hidden");
    await load();
  }catch(e){
    console.error(e);
    $("gateError").textContent=e.message.includes("invalid team passcode")?"Team-Code nicht korrekt.":e.message;
  }
}

const _oldShowView = typeof showView==="function"?showView:null;
showView=function(v){
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  const target=$("view-"+v); if(target) target.classList.add("active");
  document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===v));
  if(v==="mine") mineUI();
  if(v==="team") team();
  if(v==="templates") templates();
  if(v==="finished" && typeof finished==="function") finished();
};

function showAdminMain(name,btn){
  document.querySelectorAll(".admin-main-panel").forEach(x=>x.classList.remove("active"));
  const p=$("admin-main-"+name); if(p) p.classList.add("active");
  document.querySelectorAll(".admin-main").forEach(x=>x.classList.remove("active"));
  if(btn) btn.classList.add("active");
}

function uniqueRoles(){
  const preferred=["Bereichsleiter","Fotograf","Story-Koordinator","Story-Maker","Reel-Maker","Interview"];
  const all=[...new Set(D.members.flatMap(m=>m.roles||[]).map(r=>String(r).trim()).filter(Boolean))];
  const normalized=[];
  all.forEach(r=>{
    const k=r.toLowerCase().replace(/\s+/g," ").trim();
    if(k==="story koordinator") r="Story-Koordinator";
    if(k==="story maker") r="Story-Maker";
    if(k==="reel maker") r="Reel-Maker";
    if(k==="interviews") r="Interview";
    if(!normalized.some(x=>x.toLowerCase()===r.toLowerCase())) normalized.push(r);
  });
  return ["Alle",...preferred.filter(r=>normalized.some(x=>x.toLowerCase()===r.toLowerCase())),...normalized.filter(r=>!preferred.some(p=>p.toLowerCase()===r.toLowerCase()))];
}

team=function(){
  const roles=uniqueRoles();
  $("teamFilters").innerHTML=roles.map(r=>`<button class="pill ${teamFilter===r?"active":""}" onclick='teamFilter=${JSON.stringify(r)};team()'>${esc(r)}</button>`).join("");
  const arr=D.members.filter(m=>teamFilter==="Alle"||(m.roles||[]).some(r=>String(r).trim().toLowerCase()===teamFilter.toLowerCase()));
  $("teamGrid").innerHTML=arr.length?arr.map(m=>`<div class="teamCard"><h3>${esc(m.name)}</h3><p>${[...new Set((m.roles||[]).map(r=>String(r).trim()))].map(esc).join(" · ")}</p><div class="actions">${m.phone?`<a href="tel:${esc(m.phone)}">Anrufen</a><a target="_blank" href="https://wa.me/${esc(m.phone.replace(/\D/g,""))}">WhatsApp</a>`:""}${m.email?`<a href="mailto:${esc(m.email)}">E-Mail</a>`:""}</div></div>`).join(""):`<p>Keine Personen in diesem Bereich.</p>`;
  if($("teamWhatsapp")) $("teamWhatsapp").href=D.settings.whatsapp_url||"#";
};

function responsibleRows(selected=[]){
  const vals=selected.length?selected:[""];
  return `<div id="responsibleRows" class="responsible-editor">${vals.map((v,i)=>responsibleRow(v,i)).join("")}</div><button type="button" class="responsible-add" onclick="addResponsible()">+ weitere Person</button>`;
}
function responsibleRow(value="",i=0){
  const opts=`<option value="">Person auswählen …</option>`+D.members.map(m=>`<option value="${m.id}" ${m.id===value?"selected":""}>${esc(m.name)}</option>`).join("");
  return `<div class="responsible-row"><select class="responsibleSelect">${opts}</select><button type="button" class="responsible-remove" onclick="this.parentElement.remove()">×</button></div>`;
}
function addResponsible(){
  const wrap=$("responsibleRows");
  wrap.insertAdjacentHTML("beforeend",responsibleRow("",wrap.children.length));
}
function selectedResponsibles(){return [...document.querySelectorAll(".responsibleSelect")].map(x=>x.value).filter(Boolean)}

function downloadFile(url,name="download"){
  const a=document.createElement("a");a.href=url;a.download=name;a.target="_blank";a.rel="noopener";a.click();
}

templates=function(){
  const cats=["Alle",...new Set(D.templates.map(x=>x.category).filter(Boolean))];
  $("templateFilters").innerHTML=cats.map(r=>`<button class="pill ${templateFilter===r?"active":""}" onclick='templateFilter=${JSON.stringify(r)};templates()'>${esc(r)}</button>`).join("");
  const arr=D.templates.filter(x=>templateFilter==="Alle"||x.category===templateFilter);
  $("templateGrid").innerHTML=arr.length?arr.map(x=>`<div class="templateCard"><img src="${esc(x.file_url)}" onclick="openTemplateGallery('${x.id}')"><div class="templateBody"><strong>${esc(x.title)}</strong><p>${esc(x.category||"Vorlage")}${x.description?" · "+esc(x.description):""}</p><a class="downloadBtn" href="${esc(x.file_url)}" download target="_blank">Download ↓</a></div></div>`).join(""):`<p>Noch keine Vorlagen.</p>`;
};

function renderHomeV111(){
  if($("homeBibleLink")) $("homeBibleLink").href=D.settings.bible_url||"https://www.bible.com/bible/157/MAT.1.SCH2000";
  if($("quietTop")) $("quietTop").href=D.settings.bible_url||"https://www.bible.com/bible/157/MAT.1.SCH2000";
  if($("homeWhatsapp")) $("homeWhatsapp").href=D.settings.whatsapp_url||"#";
  if($("homeDropbox")) $("homeDropbox").href=D.settings.dropbox_url||"#";
  if($("homeInstagram")) $("homeInstagram").href=D.settings.instagram_url||"#";
  if($("homeTikTok")) $("homeTikTok").href=D.settings.tiktok_url||"#";
  if($("homeWelcome") && D.settings.home_motivation) $("homeWelcome").textContent=D.settings.home_motivation;
  if($("homeVerse")){
    const verse=D.settings.home_verse||"";
    const ref=D.settings.home_verse_ref||"";
    $("homeVerse").innerHTML=verse?`<blockquote>${esc(verse)}</blockquote>${ref?`<small>${esc(ref)}</small>`:""}`:"";
  }
}

const __oldRender = typeof render==="function"?render:null;
render= function(){
  if(__oldRender) __oldRender();
  renderHomeV111();
  if($("teamWhatsapp")) $("teamWhatsapp").href=D.settings.whatsapp_url||"#";
};

const __oldMineUI = typeof mineUI==="function"?mineUI:null;
mineUI=function(){
  // ordered by selected day; intentionally no "Nächster Einsatz" card
  let sel=$("minePerson");
  sel.innerHTML=`<option value="">Person auswählen …</option>${D.members.map(m=>`<option value="${m.id}" ${mine===m.id?"selected":""}>${esc(m.name)}</option>`).join("")}`;
  days("mineDays",mineDate,"selectMineDate");
  let all=mine?assignmentsFor(mine):[], today=all.filter(x=>x.date===mineDate);
  $("calendarAll").classList.toggle("hidden",!mine);
  $("mineList").innerHTML=mine?(today.length?today.map(x=>`<div class="mineItem"><strong>${esc(x.time)}</strong><div><strong>${esc(x.title)}</strong><p>${esc(x.role)}${x.sub?" · "+esc(x.sub):""}</p></div></div>`).join(""):`<p>Keine Einsätze an diesem Tag.</p>`):`<p>Wähle zuerst deinen Namen aus.</p>`;
};

window.addEventListener("DOMContentLoaded",()=>{
  if(window.__gy_team_unlocked){
    $("teamGate").classList.add("hidden");$("appShell").classList.remove("hidden");
  }else{
    $("teamGate").classList.remove("hidden");$("appShell").classList.add("hidden");
  }
});


/* === V11.2 DATA-SAFE RENDER FIX ===
   This block intentionally overrides only UI rendering/session wiring.
   It does NOT delete, migrate, reset or rewrite existing content data. */

unlockTeam = async function(){
  const code=$("teamCode").value.trim();
  $("gateError").textContent="";
  try{
    const {data,error}=await S.rpc("team_members_with_passcode",{passcode:code});
    if(error) throw error;
    teamPass=code; // critical: keep passcode for all subsequent RPC reloads
    sessionStorage.setItem("gyTeamPass",code);
    sessionStorage.setItem("gyTeamUnlocked","1");
    window.__gy_team_unlocked=true;
    $("teamGate").classList.add("hidden");
    $("appShell").classList.remove("hidden");
    await load(data||[]);
  }catch(e){
    console.error(e);
    $("gateError").textContent=e.message.includes("invalid team passcode")?"Team-Code nicht korrekt.":e.message;
  }
};

header = function(){
  const st=D.settings||{};
  const bible=st.bible_url||"https://www.bible.com/bible/157/MAT.1.SCH2000";
  if($("igTop")) $("igTop").href=st.instagram_url||"#";
  if($("ttTop")) $("ttTop").href=st.tiktok_url||"#";
  if($("quietTop")) $("quietTop").href=bible;
  if($("homeBibleLink")) $("homeBibleLink").href=bible;
  if($("homeWhatsapp")) $("homeWhatsapp").href=st.whatsapp_url||"#";
  if($("teamWhatsapp")) $("teamWhatsapp").href=st.whatsapp_url||"#";
  if($("homeDropbox")) $("homeDropbox").href=st.dropbox_url||"#";
  if($("homeInstagram")) $("homeInstagram").href=st.instagram_url||"#";
  if($("homeTikTok")) $("homeTikTok").href=st.tiktok_url||"#";
};

home = function(){
  const st=D.settings||{}, d=dayObj(date);
  if($("homeWelcome")) $("homeWelcome").textContent=
    st.home_motivation||st.motivation_text||
    "Schön, dass du dabei bist. Wir wollen festhalten, was Gott tut – aufmerksam, kreativ und mit einem dienenden Herzen.";
  const verse=st.home_verse||st.daily_verse||"";
  const ref=st.home_verse_ref||st.daily_verse_ref||"";
  if($("homeVerse")) $("homeVerse").innerHTML=verse?`<blockquote>${esc(verse)}</blockquote>${ref?`<small>${esc(ref)}</small>`:""}`:"";
  if($("homeAnnouncement")) $("homeAnnouncement").innerHTML=st.announcement?`<div class="refuel-card" style="margin-top:12px"><div></div><div><div class="kicker">Team-Info</div><p>${esc(st.announcement)}</p></div></div>`:"";
  if($("homeToday")){
    const todos=dayTodos(date), done=todos.filter(x=>x.done).length;
    $("homeToday").innerHTML=`<section class="dayHero"><div class="kicker">Heute · ${fmt(date)}</div><h2>${esc(d.theme||"Tagesplan")}</h2><p>${esc(d.briefing||d.description||"")}</p><div class="pills"><span class="pill active">${done}/${todos.length} erledigt</span></div></section>`;
  }
};

planFilters=function(){
  document.querySelectorAll("#planPeriods .pill").forEach(btn=>{
    const txt=btn.textContent.trim();
    const map={"Ganzer Tag":"all","Morgen":"morning","Mittag":"midday","Abend":"evening"};
    btn.classList.toggle("active",map[txt]===planPart);
  });
};

setPlanPeriod=function(part,btn){
  planPart=part;
  document.querySelectorAll("#planPeriods .pill").forEach(x=>x.classList.remove("active"));
  if(btn) btn.classList.add("active");
  dayparts("dayparts",date,false);
};

render=function(){
  header();
  home();
  days("planDays",date,"selectDate");
  planFilters();
  dayHero();
  progress("progress",date);
  dayparts("dayparts",date,false);
  mineUI();
  team();
  templates();
  finished();
  if(session) adminUI();
};

adminUI=function(){
  days("adminDays",date,"selectAdminDate");
  const d=dayObj(date);
  if($("adminDayTitle")) $("adminDayTitle").textContent=fmt(date)+" · "+(d.theme||"Tagesplan");
  progress("adminProgress",date);
  dayparts("adminDayparts",date,true);

  if($("adminHomePreview")){
    const st=D.settings||{};
    $("adminHomePreview").innerHTML=`<div class="teamCard"><h3>${esc(st.home_verse||st.daily_verse||"Home & Links")}</h3><p>${esc(st.home_verse_ref||st.daily_verse_ref||"")}</p><p>${esc(st.home_motivation||st.motivation_text||"")}</p></div>`;
  }
  if($("adminFinished")) $("adminFinished").innerHTML=D.finished.map(x=>`<div class="templateCard">${x.file_type?.startsWith("video")?`<video controls preload="metadata" src="${esc(x.file_url)}" style="width:100%"></video>`:`<img src="${esc(x.file_url)}">`}<div class="templateBody"><strong>${esc(x.title)}</strong><div class="editRow"><button class="editBtn" onclick="openForm('finished','${x.id}')">Bearbeiten</button><button class="deleteBtn" onclick="removeRow('finished','${x.id}')">Löschen</button></div></div></div>`).join("");
  if($("adminTemplates")) $("adminTemplates").innerHTML=D.templates.map(x=>`<div class="templateCard"><img src="${esc(x.file_url)}"><div class="templateBody"><strong>${esc(x.title)}</strong><div class="editRow"><button class="editBtn" onclick="openForm('template','${x.id}')">Bearbeiten</button><button class="deleteBtn" onclick="removeRow('template','${x.id}')">Löschen</button></div></div></div>`).join("");
  if($("adminTeam")) $("adminTeam").innerHTML=D.members.map(m=>`<div class="teamCard"><h3>${esc(m.name)}</h3><p>${[...new Set(m.roles||[])].map(esc).join(" · ")}</p><div class="editRow"><button class="editBtn" onclick="openForm('member','${m.id}')">Bearbeiten</button><button class="deleteBtn" onclick="removeRow('member','${m.id}')">Löschen</button></div></div>`).join("");
};

showAdminMain=function(name,btn){
  document.querySelectorAll(".admin-main-panel").forEach(x=>x.classList.remove("active"));
  const panel=$("admin-main-"+name); if(panel) panel.classList.add("active");
  document.querySelectorAll(".admin-main").forEach(x=>x.classList.remove("active"));
  if(btn) btn.classList.add("active");
};

/* safer startup: use the same passcode value everywhere */
document.addEventListener("DOMContentLoaded",async()=>{
  const saved=sessionStorage.getItem("gyTeamPass")||"";
  if(saved){
    teamPass=saved;
    try{
      const {data,error}=await S.rpc("team_members_with_passcode",{passcode:saved});
      if(!error){
        $("teamGate").classList.add("hidden");
        $("appShell").classList.remove("hidden");
        await load(data||[]);
      }else{
        sessionStorage.removeItem("gyTeamPass");
      }
    }catch(e){ console.error(e); }
  }
});

/* === V11.3 HOME POLISH === */
function renderLeaderCardV113(){
  const target=$("leaderCard");
  if(!target) return;
  const leader=D.members.find(m=>/ebenezer\s+agonafer/i.test(m.name||"")) ||
               D.members.find(m=>/ebenezer|ebbs/i.test(m.name||""));
  if(!leader){ target.innerHTML=""; return; }
  const phone=(leader.phone||"").trim();
  target.innerHTML=`<div class="leader-inner">
    <div class="leader-avatar">EA</div>
    <div>
      <div class="kicker" style="color:inherit;opacity:.58">Bei Problemen oder Fragen</div>
      <h3>Bereichsleiter · ${esc(leader.name)}</h3>
      <p>Wenn du Unterstützung brauchst oder dir etwas zu viel wird, melde dich. Lieber einmal zu früh als einmal zu spät.</p>
      ${phone?`<div class="leader-actions"><a href="tel:${esc(phone)}">Anrufen</a><a target="_blank" rel="noopener" href="https://wa.me/${esc(phone.replace(/\D/g,""))}">WhatsApp schreiben</a></div>`:""}
    </div>
  </div>`;
}

const __renderV113=render;
render=function(){
  __renderV113();
  renderLeaderCardV113();
  const st=D.settings||{};
  if($("homeDropbox")) $("homeDropbox").href=st.dropbox_url||"#";
  if($("homeWelcome")&&(st.home_motivation||st.motivation_text)){
    $("homeWelcome").textContent=st.home_motivation||st.motivation_text;
  }
};

const __homeV113=home;
home=function(){
  __homeV113();
  renderLeaderCardV113();
  const st=D.settings||{};
  if($("homeDropbox")) $("homeDropbox").href=st.dropbox_url||"#";
};
