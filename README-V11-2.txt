V11.2 DATA SAFE FIX

Diese Version behebt nur den Frontend-/Renderfehler von V11.1.
Keine neue SQL-Migration nötig, wenn V11/V11.1 bereits ausgeführt wurde.

WICHTIG:
- Nichts in Supabase löschen.
- Keine Tabellen zurücksetzen.
- V11.2 Dateien auf GitHub hochladen und alte Website-Dateien ersetzen.
- Danach Browsercache hart neu laden.
- Team-Code weiterhin 7777.

Der Fehler in V11.1: neue HTML-IDs und der Team-Code wurden nicht konsistent an den bestehenden Daten-Lader weitergegeben. Dadurch wurden vorhandene Supabase-Daten nicht angezeigt.
