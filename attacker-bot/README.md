# Attacker Bot Scripts

Python scripts to simulate various attack scenarios against the HoneyGlow Trap honeypot.

## Setup

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Ensure the backend is running on `http://localhost:3001`

## Available Scripts

### brute_force.py
Simulates credential stuffing and brute force login attacks.
- Tests common password combinations
- Rapid login attempts
- Credential enumeration

**Usage:**
```bash
python brute_force.py
```

### coupon_abuse.py
Tests coupon code enumeration and abuse.
- Enumerates coupon codes
- Tests coupon reuse
- Random coupon generation

**Usage:**
```bash
python coupon_abuse.py
```

### xss_injection.py
Tests Cross-Site Scripting vulnerabilities.
- XSS payload injection in reviews
- Reflected XSS in search
- Stored XSS attempts

**Usage:**
```bash
python xss_injection.py
```

### sqli_attack.py
Tests SQL injection vulnerabilities.
- SQLi in login endpoint
- SQLi in search parameters
- SQLi in user ID parameters

**Usage:**
```bash
python sqli_attack.py
```

### price_tampering.py
Tests business logic vulnerabilities.
- Price manipulation in cart
- Total tampering in checkout
- Negative price abuse

**Usage:**
```bash
python price_tampering.py
```

### privilege_escalation.py
Tests access control vulnerabilities.
- Admin access without authorization
- IDOR (Insecure Direct Object Reference)
- LFI (Local File Inclusion)

**Usage:**
```bash
python privilege_escalation.py
```

### run_all.py
Runs all attack scripts sequentially.

**Usage:**
```bash
python run_all.py
```

## Configuration

Edit the `BASE_URL` variable in each script to point to your honeypot backend:
```python
BASE_URL = "http://localhost:3001"
```

## Output

Each script outputs:
- Attack progress
- Success/failure status
- Attack summary statistics

## Viewing Results

After running attacks, view results in the threat intelligence dashboard:
- http://localhost:5174 (if running locally)
- http://localhost/dashboard (if using Docker)

## Customization

You can modify:
- Attack payloads
- Request frequency
- Target endpoints
- Attack patterns

## Notes

- These scripts are for testing the honeypot only
- Do not use against production systems
- All attacks are logged by the honeypot
- Adjust delays if needed to avoid overwhelming the server
