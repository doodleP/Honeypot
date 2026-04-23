# HoneyGlow Trap

HoneyGlow Trap is a deliberately vulnerable e-commerce-style honeypot built for cybersecurity learning, attack simulation, and threat intelligence collection. It presents a beauty-product storefront to attract attacker behavior, logs both application and network activity, and exposes that data through a dashboard and an AI-assisted analysis pipeline.

## Warning

This project contains intentional security weaknesses.

Use it only in:
- isolated lab environments
- controlled test networks
- security research setups

Do not deploy it to production or expose it to untrusted public infrastructure without proper isolation.

## What The Project Includes

- A fake beauty storefront built with React
- An Express backend with intentionally weak validation and vulnerable routes
- MongoDB for storing users, attack logs, and related data
- A React dashboard for viewing attack statistics and intelligence
- Zeek network logging running alongside the reverse proxy
- Python attacker scripts for generating realistic attack traffic
- A local Ollama + LlamaIndex threat-intelligence pipeline for normalization, classification, intent inference, MITRE mapping, and report generation

## Runtime Architecture

```text
Attacker Traffic
      |
      v
    Nginx
      |
      +-- Frontend (React / Vite)
      +-- Backend (Express / MongoDB)
      +-- Dashboard (React / Vite)
      |
      +-- Zeek (shared network namespace for passive logging)

Backend Logs + Mongo Data + Zeek Logs
      |
      v
Threat-Intel Python Pipeline
      |
      v
Ollama + LlamaIndex
      |
      v
Markdown Threat Report
```

## Main Services

Current `docker-compose.yml` starts:

- `mongodb`
- `backend`
- `frontend`
- `dashboard`
- `nginx`
- `zeek`

Important: the Ollama-based AI pipeline is currently separate from Docker. The honeypot stack runs in Docker, while Ollama and the `threat-intel` Python script run on the host machine unless you containerize them separately.

## Key Features

### Honeypot Web App

- Mimics a real shopping site to attract malicious traffic
- Includes login, registration, cart, checkout, reviews, coupons, admin, and profile UI
- Tracks token-based login state in the frontend
- Includes searchable and filterable product listing

### Intentional Attack Surface

The project includes endpoints designed to attract and log attacker behavior:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/cart/add`
- `POST /api/cart/update`
- `POST /api/checkout`
- `GET /api/coupons/apply`
- `GET /api/users`
- `GET /api/users/search`
- `GET /api/admin/users`
- `GET /api/admin/export`
- `POST /api/reviews`

These routes are intentionally weak in areas such as:

- brute force and credential stuffing exposure
- SQLi-style or injection-style payload collection
- reflected XSS
- IDOR
- privilege escalation logging
- coupon abuse and price tampering
- LFI-style probing

### Logging And Detection

The application currently collects:

- application request and attack logs in `server/logs/`
- MongoDB attack records through `AttackLog`
- Zeek HTTP and connection logs in `zeek/logs/`
- attacker activity artifacts from `attacker-bot/*.json`

The backend includes middleware for:

- request-level attack logging
- attack classification metadata
- payload capture
- geo-IP enrichment

### Dashboard

The dashboard surfaces:

- live attack feed
- attack type distribution
- top attacking IPs
- geographic distribution
- coupon abuse signals
- WAF / defensive rule generation

### Threat Intelligence Pipeline

The `threat-intel/` module adds:

- log normalization across Zeek, app logs, and session-style data
- LLM-based attack classification
- session-level intent inference
- MITRE ATT&CK mapping
- human-readable report generation

The current implementation uses:

- Ollama for local model serving
- LlamaIndex for ingestion and retrieval
- Python for orchestration

## Project Structure

```text
Honeypot/
|-- client/          React storefront
|-- dashboard/       React threat dashboard
|-- server/          Express API, models, middleware, logs
|-- nginx/           Reverse proxy configuration
|-- zeek/            Network log output and Zeek notes
|-- attacker-bot/    Python scripts to simulate attacks
|-- threat-intel/    Ollama + LlamaIndex threat analysis pipeline
|-- docs/            STRIDE, playbooks, metrics
|-- docker-compose.yml
```

## Prerequisites

For the full stack:

- Docker Desktop or Docker Engine with Compose support
- Node.js 18+ for local development outside Docker
- Python 3.9+ for attacker scripts and threat-intel pipeline

For AI analysis:

- Ollama installed on the host machine
- A local model such as `llama3.1:8b`

## Quick Start: Full Honeypot

From the repository root:

```bash
docker compose up -d --build
```

This starts:

- MongoDB on `localhost:27017`
- backend on `localhost:3001`
- frontend on `localhost:5173`
- dashboard on `localhost:5174`
- Nginx on `localhost:80`
- Zeek attached to Nginx traffic

Useful checks:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f zeek
```

Health endpoint:

```bash
http://localhost:3001/health
```

## Zeek Network Logging

The `zeek` service shares the `nginx` network namespace using:

```text
network_mode: "service:nginx"
```

That lets Zeek observe:

- attacker -> nginx
- nginx -> backend
- nginx -> frontend
- nginx -> dashboard

Logs are written to:

- `zeek/logs/conn.log`
- `zeek/logs/http.log`

## Running The Attacker Bot

To generate sample malicious traffic:

```bash
cd attacker-bot
pip install -r requirements.txt
python brute_force.py
python sqli_attack.py
python xss_injection.py
python coupon_abuse.py
```

These scripts help populate:

- backend attack logs
- Zeek network logs
- session-style JSON artifacts

## Running The Threat-Intel Pipeline

Start the honeypot stack first so logs and Mongo data exist.

Then start Ollama on the host machine:

```bash
ollama serve
```

In another terminal, pull a model if needed:

```bash
ollama pull llama3.1:8b
```

Then run the pipeline:

```bash
cd threat-intel
pip install -r requirements.txt
python run_pipeline.py --model llama3.1:8b --mongo-uri mongodb://localhost:27017 --mongo-db honeyglow --zeek-http-log ../zeek/logs/http.log --app-log ../server/logs/combined.log --session-log ../attacker-bot/brute_force_log.json --output-report ./output/threat_intelligence_report.md
```

Generated report:

- `threat-intel/output/threat_intelligence_report.md`

## Local Development

If you want to run parts of the stack outside Docker:

```bash
npm install
cd server && npm install
cd ../client && npm install
cd ../dashboard && npm install
```

Start MongoDB separately, then:

```bash
cd server && npm run dev
cd client && npm run dev
cd dashboard && npm run dev
```

Root-level helper scripts:

- `npm run dev`
- `npm run server`
- `npm run client`
- `npm run build`
- `npm run docker:build`
- `npm run docker:up`
- `npm run docker:down`

## Documentation

Additional project notes live in:

- `docs/STRIDE.md`
- `docs/ATTACK_PLAYBOOKS.md`
- `docs/METRICS.md`
- `SETUP.md`
- `PROJECT_STRUCTURE.md`
- `zeek/README.md`
- `threat-intel/README.md`

## Current Notes

- The AI pipeline is not yet part of `docker-compose.yml`
- Ollama is expected to run on the host right now
- The threat-intel script gracefully continues if MongoDB is unavailable
- Zeek logs depend on traffic actually reaching Nginx

## License

MIT License. Provided for educational and research use.
