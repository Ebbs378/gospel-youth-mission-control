GOSPEL YOUTH MISSION CONTROL V7 – SUPABASE LIVE

WICHTIG: ZUERST MIGRATION AUSFÜHREN
1. Supabase > SQL Editor > New Query.
2. Inhalt von V7-MIGRATION.sql einfügen.
3. Run.
4. Es sollte "Success. No rows returned" erscheinen.

DANN GITHUB AKTUALISIEREN
Diese Dateien hochladen/ersetzen:
- index.html
- styles.css
- app.js
- config.js
- logo.webp
- README.txt

V7-MIGRATION.sql muss nicht auf GitHub Pages liegen, kann aber im Repository bleiben.

WAS V7 JETZT MACHT
- öffentliche Seite lädt Daten direkt aus Supabase
- kein Login zum Lesen
- Admin-Login nutzt echten Supabase Authentication User
- Programm hinzufügen/bearbeiten/löschen -> Supabase
- Aufgaben hinzufügen/bearbeiten/löschen -> Supabase
- Content hinzufügen/bearbeiten/löschen -> Supabase
- Team hinzufügen/bearbeiten/löschen -> Supabase
- Eventtexte + Instagram/TikTok Links -> Supabase
- Bild-Uploads -> Supabase Storage
- Kalenderexport lokal
- Kategorien Gesamt / Stories / Fotograf / Reels / Interviews
- Morgen / Mittag / Abend

SICHERHEIT
Der Publishable Key in config.js ist für Browser-Clients gedacht.
Niemals einen secret/service_role Key in GitHub hochladen.

NOCH NICHT ENTHALTEN
- automatische E-Mail-Benachrichtigungen
- Rollenbasierte Einschränkung auf bestimmte Admin-Accounts
Diese zwei Punkte kommen nach dem Live-Test.
