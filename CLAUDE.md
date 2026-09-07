# booking

Internal booking tool (frontend + backend + Postgres). Siehe `readme.md` für
Architektur/lokales Setup - hier nur Details, die für automatisiertes
Arbeiten am Repo relevant sind und nicht schon dort stehen.

## Frontend: konfigurierbarer Backend-Hostname

`frontend/nginx.conf` proxied `/api` nicht mehr hart kodiert auf den
Hostnamen `backend`, sondern auf den Platzhalter `__BACKEND_HOST__`.

- `frontend/docker-entrypoint.d/10-backend-host-config.sh` ersetzt diesen
  Platzhalter beim Container-Start per `sed -i` in
  `/etc/nginx/conf.d/default.conf` durch den Wert der Umgebungsvariable
  `BACKEND_HOST` (Default `backend`, falls nicht gesetzt).
- Lokales Dev/CI (`docker-compose.yml` im Repo-Root) setzt `BACKEND_HOST`
  bewusst nicht - der Service heißt dort weiterhin `backend`, der Default
  greift unverändert.
- Deployments mit abweichendem Service-Namen setzen `BACKEND_HOST`
  entsprechend in ihrer eigenen `docker-compose.yml`.
- Skript-Nummer `10-` läuft bewusst vor `40-locale-config.sh`/
  `41-mode-config.sh` (Reihenfolge ist hier aber nicht funktional relevant,
  nur Konvention: kleinere Nummer = grundlegendere Config zuerst).

Ohne diese Konfigurierbarkeit bräuchte eine Deployment-Umgebung mit
abweichendem Service-Namen einen Netzwerk-Alias-Hack (Backend-Container
aliast sich selbst als `backend`), um `frontend/nginx.conf` unverändert
nutzen zu können.
