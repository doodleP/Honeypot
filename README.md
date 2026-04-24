# HoneyGlow Trap 🍯✨

A sophisticated honeypot web application designed to mimic a beauty product shopping platform, attracting attackers and collecting threat intelligence.

## 🎯 Purpose

HoneyGlow Trap is a cybersecurity honeypot that:
- Mimics a real beauty e-commerce platform
- Contains deliberate vulnerabilities to attract attackers
- Logs and analyzes attack patterns
- Provides threat intelligence through a dashboard
- Generates defense rules for production applications

## ⚠️ WARNING

**This application contains intentional security vulnerabilities. DO NOT deploy this in production or expose it to untrusted networks without proper isolation.**

## 🏗️ Architecture

```
┌─────────────┐
│   Nginx     │ (Reverse Proxy)
└──────┬──────┘
       │
   ┌───┴───┬──────────────┐
   │       │              │
┌──▼──┐ ┌──▼──┐      ┌───▼────┐
│Front│ │Dash │      │Backend │
│end  │ │board│      │Express │
└─────┘ └─────┘      └───┬────┘
                          │
                     ┌────▼────┐
                     │ MongoDB │
                     └─────────┘
```


### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for attacker bot)

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🧾 Zeek Network Logging (Docker)

This stack includes a Zeek container that passively logs network traffic.

- **How it works**: the `zeek` service shares the `nginx` container network namespace (`network_mode: "service:nginx"`), so it can observe:
  - attacker ↔ nginx
  - nginx ↔ backend/frontend/dashboard
- **Logs output**: `./zeek/logs/` (e.g. `conn.log`, `http.log`)

### Local Development

```bash
# Install dependencies
npm install
cd .
cd ../client && npm install
cd ../dashboard && npm install

# Start MongoDB (or use Docker)
docker run -d -p 27017:27017 mongo:7

# Start backend
cd server && npm run dev

# Start frontend (in new terminal)
cd client && npm run dev

# Start dashboard (in new terminal)
cd dashboard && npm run dev
```

## 📁 Project Structure

```
honeyglow-trap/
├── server/              # Express backend
│   ├── src/
│   │   ├── routes/      # API routes with vulnerabilities
│   │   ├── models/      # MongoDB models
│   │   ├── middleware/  # Logging & detection middleware
│   │   ├── detection/   # Attack detection engine
│   │   └── utils/       # Utilities
│   └── Dockerfile
├── client/              # React frontend (fake store)
│   ├── src/
│   │   ├── pages/       # Fake store pages
│   │   ├── components/  # UI components
│   │   └── App.jsx
│   └── Dockerfile
├── dashboard/           # React dashboard (threat intel)
│   ├── src/
│   │   ├── components/  # Charts, tables, maps
│   │   └── App.jsx
│   └── Dockerfile
├── attacker-bot/        # Python attack scripts
│   ├── brute_force.py
│   ├── coupon_abuse.py
│   ├── xss_injection.py
│   └── sqli_attack.py
├── nginx/               # Nginx configuration
│   └── nginx.conf
├── docs/                # Documentation
│   ├── STRIDE.md
│   ├── ATTACK_PLAYBOOKS.md
│   └── METRICS.md
└── docker-compose.yml
```

## 🎣 Vulnerable Endpoints

### Authentication
- `POST /api/auth/login` - SQLi-style injection, credential stuffing
- `POST /api/auth/register` - Weak validation

### Shopping
- `POST /api/cart/add` - Price tampering
- `POST /api/cart/update` - Price manipulation
- `POST /api/checkout` - Business logic abuse
- `GET /api/coupons/apply?code=XXX` - Coupon abuse

### User Management
- `GET /api/users?id=123` - Broken access control, IDOR
- `GET /api/users/search?q=XXX` - Reflected XSS

### Admin
- `GET /api/admin/users` - Privilege escalation
- `GET /api/admin/export` - LFI vulnerability

### Reviews
- `POST /api/reviews` - XSS injection point

## 🔍 Attack Detection

The system detects:
- SQL Injection attempts
- XSS (Cross-Site Scripting)
- LFI (Local File Inclusion)
- Credential Stuffing
- Business Logic Abuse (price tampering, coupon abuse)
- Privilege Escalation
- IDOR (Insecure Direct Object Reference)

## 📊 Dashboard Features

- Live attack feed
- Top attacking IPs
- Attack type distribution (pie chart)
- Geographic heatmap
- Payload explorer
- Coupon abuse tracker
- Defense rule generator

## 🤖 Attacker Bot

Run Python scripts to simulate attacks:

```bash
cd attacker-bot
python brute_force.py
python coupon_abuse.py
python xss_injection.py
python sqli_attack.py
```

## 📚 Documentation

See `docs/` directory for:
- STRIDE threat model analysis
- Attack playbooks
- Metrics and reporting guidelines

## 🔒 Security Notice

This is a **honeypot** with intentional vulnerabilities. Use only in:
- Isolated lab environments
- Controlled test networks
- Security research contexts

Never expose to production or public networks without proper isolation.

## 📝 License

MIT License - For educational and research purposes only.
