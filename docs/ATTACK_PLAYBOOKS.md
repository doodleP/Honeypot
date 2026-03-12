# Attack Playbooks

This document describes common attack scenarios and how the honeypot detects and logs them.

## 1. SQL Injection Attack

### Attack Vector
- **Endpoint**: `/api/auth/login`, `/api/users?search=PAYLOAD`
- **Method**: POST/GET with SQLi payloads in parameters
- **Payload Examples**:
  - `' OR '1'='1`
  - `admin' --`
  - `' UNION SELECT NULL--`

### Detection
- Pattern matching against SQL injection signatures
- Logged as `SQL_INJECTION` attack type
- Severity: HIGH

### Logged Information
- IP address
- User-Agent
- Full request payload
- Attack type and severity
- Timestamp

### Example Log Entry
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "ip": "192.168.1.100",
  "attackType": "SQL_INJECTION",
  "endpoint": "/api/auth/login",
  "payload": "' OR '1'='1",
  "severity": "HIGH"
}
```

---

## 2. XSS (Cross-Site Scripting) Attack

### Attack Vector
- **Endpoint**: `/api/reviews`, `/api/users?search=PAYLOAD`
- **Method**: POST/GET with XSS payloads
- **Payload Examples**:
  - `<script>alert('XSS')</script>`
  - `<img src=x onerror=alert('XSS')>`
  - `javascript:alert('XSS')`

### Detection
- Pattern matching against XSS signatures
- Logged as `XSS` attack type
- Severity: MEDIUM

### Logged Information
- IP address
- Reflected payload
- Endpoint accessed
- Attack type

---

## 3. Price Tampering Attack

### Attack Vector
- **Endpoint**: `/api/cart/add`, `/api/cart/update`, `/api/checkout`
- **Method**: POST with manipulated price values
- **Payload Examples**:
  - `{"productId": 1, "price": 0.01}`
  - `{"total": -10.00, "discount": 50.00}`

### Detection
- Business logic abuse detection
- Logged as `PRICE_TAMPERING` attack type
- Severity: MEDIUM

### Logged Information
- Original vs. tampered price
- User session (if available)
- Attack type
- Request body

---

## 4. Coupon Abuse Attack

### Attack Vector
- **Endpoint**: `/api/coupons/apply?code=XXX`
- **Method**: GET with coupon enumeration
- **Attack Patterns**:
  - Brute force coupon codes
  - Multiple uses of same coupon
  - Enumeration of valid codes

### Detection
- Multiple requests to coupon endpoint
- Suspicious coupon code patterns
- Logged as `COUPON_ABUSE` attack type
- Severity: LOW

### Logged Information
- Coupon codes attempted
- Usage frequency
- IP address
- Attack type

---

## 5. Privilege Escalation Attack

### Attack Vector
- **Endpoint**: `/api/admin/*`
- **Method**: GET/POST without proper authorization
- **Attack Patterns**:
  - Accessing admin endpoints without admin role
  - Token manipulation
  - Direct URL access

### Detection
- Broken access control detection
- Logged as `PRIVILEGE_ESCALATION` attack type
- Severity: CRITICAL

### Logged Information
- Endpoint accessed
- User role (if available)
- Attack type
- IP address

---

## 6. IDOR (Insecure Direct Object Reference) Attack

### Attack Vector
- **Endpoint**: `/api/users?id=XXX`
- **Method**: GET with different user IDs
- **Attack Patterns**:
  - Accessing other users' data by ID
  - Enumeration of user IDs
  - Unauthorized data access

### Detection
- Access control violation detection
- Logged as `IDOR` attack type
- Severity: HIGH

### Logged Information
- User ID accessed
- Requesting user (if available)
- Attack type
- IP address

---

## 7. LFI (Local File Inclusion) Attack

### Attack Vector
- **Endpoint**: `/api/admin/export?file=XXX`
- **Method**: GET with file path manipulation
- **Payload Examples**:
  - `../../../etc/passwd`
  - `..\\..\\..\\windows\\system32\\config\\sam`
  - `%2e%2e%2f%2e%2e%2fetc%2fpasswd`

### Detection
- Path traversal pattern detection
- Logged as `LFI` attack type
- Severity: HIGH

### Logged Information
- File path attempted
- Attack type
- IP address
- Payload

---

## 8. Brute Force Attack

### Attack Vector
- **Endpoint**: `/api/auth/login`
- **Method**: POST with multiple credential combinations
- **Attack Patterns**:
  - Rapid login attempts
  - Common password lists
  - Email enumeration

### Detection
- Rate-based detection
- Multiple failed login attempts
- Logged as `BRUTE_FORCE` attack type
- Severity: MEDIUM

### Logged Information
- Email addresses attempted
- Number of attempts
- IP address
- Attack type

---

## Attack Response Workflow

1. **Detection**: Attack detected by detection engine
2. **Logging**: Attack logged to MongoDB
3. **Analysis**: Dashboard displays attack in real-time
4. **Alerting**: (Optional) Send alerts for critical attacks
5. **Defense**: Generate WAF rules based on attack patterns
6. **Reporting**: Export attack data for analysis

## Metrics to Track

- Total attacks per hour/day
- Attack type distribution
- Top attacking IPs
- Geographic distribution
- Attack success rate
- Payload patterns
- Time-based attack trends

## Dashboard Views

1. **Live Feed**: Real-time attack stream
2. **Statistics**: Attack type pie charts, severity distribution
3. **Top IPs**: Most active attacking IPs
4. **Geo Map**: Geographic attack distribution
5. **Coupon Abuse**: Coupon usage tracking
6. **WAF Rules**: Generated defense rules
