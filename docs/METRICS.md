# Metrics and Reporting

## Key Performance Indicators (KPIs)

### Attack Volume Metrics
- **Total Attacks**: Count of all detected attacks
- **Attacks per Hour**: Rate of attack detection
- **Unique Attackers**: Number of distinct IP addresses
- **Attack Sessions**: Grouped attacks from same IP

### Attack Type Distribution
- SQL Injection attempts
- XSS attempts
- LFI attempts
- Business Logic Abuse
- Privilege Escalation
- IDOR attempts
- Credential Stuffing
- Coupon Abuse

### Severity Metrics
- **Critical**: Privilege escalation, LFI
- **High**: SQL Injection, IDOR
- **Medium**: XSS, Price Tampering
- **Low**: Coupon Abuse

### Geographic Metrics
- Attacks by country
- Attacks by region
- Top attacking countries
- Geographic heatmap data

### Time-Based Metrics
- Attacks by hour of day
- Attacks by day of week
- Attack trends over time
- Peak attack periods

## Dashboard Metrics

### Real-Time Metrics
- Live attack feed (last 50 attacks)
- Current attack rate (attacks/minute)
- Active attacking IPs
- Recent attack types

### Historical Metrics
- 24-hour attack summary
- 7-day attack trends
- 30-day attack patterns
- Monthly reports

## Reporting Format

### Daily Report
```
Date: YYYY-MM-DD
Total Attacks: XXX
Top Attack Types:
  1. SQL_INJECTION: XX
  2. XSS: XX
  3. PRICE_TAMPERING: XX

Top Attacking IPs:
  1. XXX.XXX.XXX.XXX (XX attacks)
  2. XXX.XXX.XXX.XXX (XX attacks)

Geographic Distribution:
  Country A: XX attacks
  Country B: XX attacks

Severity Breakdown:
  CRITICAL: XX
  HIGH: XX
  MEDIUM: XX
  LOW: XX
```

### Weekly Report
- Summary of daily reports
- Trend analysis
- Top attack patterns
- Recommendations

### Monthly Report
- Comprehensive attack analysis
- Threat intelligence summary
- Defense rule effectiveness
- Recommendations for improvements

## Export Formats

### JSON Export
```json
{
  "period": "2024-01-01 to 2024-01-31",
  "totalAttacks": 1234,
  "attackTypes": {...},
  "topIPs": [...],
  "geoDistribution": [...]
}
```

### CSV Export
- Attack logs in CSV format
- Suitable for analysis in Excel/Google Sheets
- Includes all attack details

### WAF Rules Export
- ModSecurity rules
- Nginx deny rules
- Rate limiting configurations
- IP blacklists

## Metrics Collection

### Data Sources
1. **Attack Logs**: MongoDB collection `attacklogs`
2. **User Activity**: User interaction logs
3. **System Metrics**: Server performance data
4. **Network Metrics**: Request/response statistics

### Collection Frequency
- Real-time: Attack detection and logging
- Every 5 seconds: Dashboard feed refresh
- Every 30 seconds: Statistics update
- Daily: Report generation

## Visualization

### Charts
- **Pie Chart**: Attack type distribution
- **Bar Chart**: Top attacking IPs
- **Line Chart**: Attack trends over time
- **Heatmap**: Geographic distribution
- **Doughnut Chart**: Severity distribution

### Tables
- Attack feed table
- Top IPs table
- Coupon abuse table
- Geographic distribution table

## Alerting Thresholds

### Critical Alerts
- Privilege escalation attempts: Immediate
- LFI attempts: Immediate
- Multiple critical attacks from same IP: Immediate

### High Priority Alerts
- SQL Injection attempts: Within 5 minutes
- IDOR attempts: Within 5 minutes
- Rapid attack rate (>10/min): Within 1 minute

### Medium Priority Alerts
- XSS attempts: Within 15 minutes
- Price tampering: Within 15 minutes
- Coupon abuse: Daily summary

## Performance Metrics

### System Performance
- Response time per endpoint
- Database query performance
- Memory usage
- CPU usage

### Detection Performance
- Detection accuracy
- False positive rate
- Detection latency
- Coverage rate

## Compliance Metrics

### Data Retention
- Attack logs: 90 days
- User data: 30 days
- Aggregated metrics: 1 year

### Privacy
- IP anonymization options
- GDPR compliance
- Data export capabilities

## Custom Metrics

### Business-Specific Metrics
- Coupon abuse rate
- Price tampering success rate
- Admin access attempts
- User enumeration success

### Security Metrics
- Attack detection rate
- Mean time to detect (MTTD)
- Attack mitigation effectiveness
- Threat intelligence quality
