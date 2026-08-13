GOSPEL YOUTH · MISSION CONTROL V10 PRODUCTION

REIHENFOLGE
1. Supabase → SQL Editor → New Query.
2. V10-MIGRATION.sql KOMPLETT einfügen → Run.
3. Bei Erfolg die Website-Dateien aus dieser ZIP in GitHub hochladen und die alten ersetzen.
4. GitHub Pages kurz deployen lassen.
5. Website hart neu laden: Cmd+Shift+R / Ctrl+F5.

V10-KONZEPT
- Mobile First.
- Plan / Meine Einsätze / Team / Vorlagen.
- Kein separater Contentplan mehr.
- Programmpunkt → Unterpunkt (Worship/Predigt/Games/...) → Content-To-dos.
- Story, Reel, Foto, Interview direkt im Unterpunkt.
- Beispiel-Link + mehrere Beispielbilder + MP4 direkt am To-do.
- TikTok wird als eingebetteter Player versucht.
- Bilder öffnen in einer großen Galerie.
- Mehrere Verantwortliche pro To-do.
- Mehrere Personen pro Rolle am Programmpunkt.
- Unbesetzte Rollen werden öffentlich NICHT angezeigt.
- Tagesziele werden automatisch aus den To-dos berechnet.
- Admin markiert To-dos als erledigt → Fortschritt aktualisiert sich automatisch.
- Admin arbeitet in einer Vorschau, die der späteren öffentlichen Ansicht entspricht.
- Tage/Themen im Admin editierbar.
- Meine Einsätze: Person + separate Tagesauswahl + Kalenderexport.
- Vorlagen: eigene PNG/JPG-Galerie.

WICHTIG
Die publishable Supabase-ID in config.js darf bei einer öffentlichen Website im Browser stehen.
Der Schutz des Admin-Schreibzugriffs erfolgt über Supabase Auth + Row Level Security.
