# Project Structure

```
honeyglow-trap/
│
├── server/                          # Express Backend
│   ├── src/
│   │   ├── index.js                # Main server entry point
│   │   ├── routes/                  # API routes with vulnerabilities
│   │   │   ├── auth.js             # Login/Register (SQLi, credential stuffing)
│   │   │   ├── cart.js             # Cart operations (price tampering)
│   │   │   ├── checkout.js         # Checkout (business logic abuse)
│   │   │   ├── coupons.js          # Coupon system (coupon abuse)
│   │   │   ├── users.js            # User endpoints (IDOR, XSS)
│   │   │   ├── admin.js            # Admin endpoints (privilege escalation, LFI)
│   │   │   ├── reviews.js          # Reviews (XSS)
│   │   │   └── dashboard.js        # Dashboard API (stats, WAF rules)
│   │   ├── models/                  # MongoDB models
│   │   │   ├── AttackLog.js        # Attack log schema
│   │   │   ├── User.js             # User schema
│   │   │   └── Coupon.js           # Coupon schema
│   │   ├── middleware/              # Express middleware
│   │   │   ├── attackLogger.js     # Logs all requests
│   │   │   └── attackDetector.js   # Detects attack patterns
│   │   └── utils/                   # Utilities
│   │       ├── logger.js           # Winston logger
│   │       └── createLogsDir.js    # Creates logs directory
│   ├── logs/                        # Log files (created at runtime)
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── client/                          # React Frontend (Fake Store)
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.jsx            # Product listing
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Register.jsx        # Registration page
│   │   │   ├── Cart.jsx            # Shopping cart (price tampering UI)
│   │   │   ├── Checkout.jsx        # Checkout page
│   │   │   ├── Reviews.jsx         # Reviews (XSS injection point)
│   │   │   ├── Coupons.jsx         # Coupon page
│   │   │   └── Admin.jsx           # Admin panel
│   │   ├── components/              # Reusable components
│   │   │   └── Navbar.jsx          # Navigation bar
│   │   ├── utils/
│   │   │   └── api.js              # Axios API client
│   │   ├── App.jsx                 # Main app component
│   │   └── main.jsx                # Entry point
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── Dockerfile
│
├── dashboard/                       # React Dashboard (Threat Intel)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx       # Main dashboard
│   │   │   ├── AttackStats.jsx     # Statistics charts
│   │   │   ├── AttackFeed.jsx      # Live attack feed
│   │   │   ├── TopIPs.jsx          # Top attacking IPs
│   │   │   ├── GeoMap.jsx          # Geographic distribution
│   │   │   ├── CouponAbuse.jsx     # Coupon abuse tracker
│   │   │   └── WAFRules.jsx        # WAF rule generator
│   │   ├── utils/
│   │   │   └── api.js              # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── Dockerfile
│
├── attacker-bot/                    # Python Attack Scripts
│   ├── brute_force.py              # Credential stuffing
│   ├── coupon_abuse.py             # Coupon enumeration
│   ├── xss_injection.py            # XSS attacks
│   ├── sqli_attack.py              # SQL injection
│   ├── price_tampering.py         # Price manipulation
│   ├── privilege_escalation.py     # Access control attacks
│   ├── run_all.py                 # Run all attacks
│   ├── requirements.txt
│   └── README.md
│
├── nginx/                           # Nginx Configuration
│   └── nginx.conf                  # Reverse proxy config
│
├── docs/                            # Documentation
│   ├── STRIDE.md                   # Threat model analysis
│   ├── ATTACK_PLAYBOOKS.md         # Attack scenarios
│   └── METRICS.md                  # Metrics and reporting
│
├── docker-compose.yml               # Docker Compose configuration
├── package.json                    # Root package.json
├── .gitignore
├── README.md                       # Main README
├── SETUP.md                        # Setup instructions
└── PROJECT_STRUCTURE.md            # This file
```

## Key Components

### Backend (server/)
- **Express.js** server with intentional vulnerabilities
- **MongoDB** for data storage
- **Winston** for logging
- **Attack detection** middleware
- **JWT** authentication (vulnerable implementation)

### Frontend (client/)
- **React + Vite** fake beauty store
- Vulnerable UI components
- No input sanitization
- Client-side price manipulation

### Dashboard (dashboard/)
- **React + Chart.js** threat intelligence dashboard
- Real-time attack visualization
- WAF rule generation
- Attack statistics and analytics

### Attacker Bot (attacker-bot/)
- **Python** scripts for attack simulation
- Multiple attack vectors
- Automated testing

### Infrastructure
- **Docker Compose** for containerization
- **Nginx** reverse proxy
- **MongoDB** database

## Vulnerabilities Implemented

1. **SQL Injection**: Login and search endpoints
2. **XSS**: Reviews and search parameters
3. **Price Tampering**: Cart and checkout
4. **Coupon Abuse**: Enumeration and reuse
5. **IDOR**: User data access
6. **Privilege Escalation**: Admin access
7. **LFI**: File inclusion in export
8. **Credential Stuffing**: Weak authentication

## Attack Detection

All attacks are:
- Logged to MongoDB
- Detected by pattern matching
- Visualized in dashboard
- Used to generate WAF rules

## Data Flow

```
Attacker → Frontend/API → Attack Detector → MongoDB
                                      ↓
                              Dashboard (Visualization)
```

## Security Notice

⚠️ **This is a honeypot with intentional vulnerabilities.**
- Do NOT deploy to production
- Use only in isolated environments
- All attacks are logged for analysis
- For educational and research purposes only
