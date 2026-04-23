## Zeek logging (Docker)

This project includes a `zeek` container in `docker-compose.yml`.

### What it does

- Zeek **shares the `nginx` container's network namespace** (`network_mode: "service:nginx"`).
- This lets Zeek observe traffic flowing through Nginx, including:
  - attacker \u2194 nginx
  - nginx \u2194 backend/frontend/dashboard

### Where logs go

Zeek writes logs to the host folder:

- `./zeek/logs/`

### Start

Run:

```bash
docker compose up -d
```

Then check:

- `./zeek/logs/conn.log`
- `./zeek/logs/http.log`
