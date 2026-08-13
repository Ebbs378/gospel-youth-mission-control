GOSPEL YOUTH V11.4 CLEAN PRODUCTION

WICHTIG:
- KEINE neue SQL-Migration.
- Bestehende Supabase-Daten werden NICHT verändert.
- Diese Version ist ein sauberer Frontend-Neubau und ersetzt die Patch-Kette aus V11.1–V11.3.
- Alte Service Worker werden beim Laden automatisch abgemeldet, damit kein veraltetes JavaScript hängen bleibt.

Datenstruktur:
festival_days
program_items
program_subitems
content_todos
todo_assignments
program_assignments
todo_media
team_members (über team_members_with_passcode)
templates
finished_content (optional; falls Tabelle fehlt, bleibt nur dieser Bereich leer – der Plan lädt trotzdem)

Warum die Programmpunkte jetzt wieder laden sollten:
Jede Tabelle wird separat geladen. Ein Fehler bei Vorlagen oder fertigem Content kann Plan/Tage/Programmpunkte nicht mehr blockieren.

Home:
1. große Ermutigung "Warum wir das machen"
2. Bibelvers mittig in eigener Serif-/Monospace-Typografie
3. helle Stille-Zeit-Kachel
4. Datei-Upload-Hinweis + Dropbox-Kachel
5. Bereichsleiter Ebenezer Agonafer + Anrufen/WhatsApp
6. Schnellzugriff

Bibel-Icon:
gleich groß wie Instagram/TikTok (19 px), transparent, Light schwarz / Dark weiß.

GitHub:
index.html
styles.css
app.js
config.js
logo.webp
instagram.png
tiktok.webp
bible-icon.png

Keine SQL-Datei ausführen.
