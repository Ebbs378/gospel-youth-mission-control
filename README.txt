GOSPEL YOUTH MISSION CONTROL V9

WICHTIG – ZUERST SUPABASE:
1. Supabase > SQL Editor > New Query.
2. V9-MIGRATION.sql komplett einfügen.
3. Run.
4. Bei Success die Website-Dateien auf GitHub ersetzen.
5. Danach hart neu laden (Cmd+Shift+R / Ctrl+F5).

NEU IN V9:
- kompletter Design-Umbau: weniger Boxen, mehr Abstand, strukturierter
- kleine Instagram-/TikTok-Icons ohne Hintergrund
- technischer "Live verbunden"-Hinweis entfernt; nur echte Fehler werden angezeigt
- eigene Ansichten: Plan / Content / Team / Meine Einsätze
- Meine Einsätze ist eine separate Ansicht, kein Anhängsel unter dem Plan
- Programm-Unterpunkte: Worship, Predigt, Games, Gebet, Kleingruppe usw.
- Unterpunkte sind sortierbar und können optional eigene Uhrzeiten haben
- nummerierte Story-Punkte pro Programmpunkt: 1. Story, 2. Story, 3. Story ...
- Story-Punkte haben Verantwortliche + Beschreibung
- separate Content-Seite
- separate Team-Seite mit Anrufen, WhatsApp und E-Mail
- persönlicher Kalenderexport ohne Team-Login
- Tagesziele
- Mehrfach-Bildupload + Beschreibung pro Bild
- TikTok/Instagram Embed-Versuch + Original-Link
- einfache Doppelbelegungswarnung im Admin-Dashboard

DATEIEN FÜR GITHUB:
index.html
styles.css
app.js
config.js
logo.webp
instagram.jpg
tiktok.webp

SQL:
V9-MIGRATION.sql wird nur im Supabase SQL Editor ausgeführt. Sie kann im Repository bleiben, ist aber für GitHub Pages nicht nötig.
