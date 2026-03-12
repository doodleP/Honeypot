#!/usr/bin/env python3
"""
Realistic Attack Utilities
Provides human-like behavior patterns and detection evasion techniques
"""

import random
import time
import requests
from datetime import datetime
import json
from pathlib import Path

# Realistic User Agents (Chrome, Firefox, Safari, Edge)
REALISTIC_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
]

# Realistic Accept-Language values
ACCEPT_LANGUAGES = [
    "en-US,en;q=0.9",
    "en-US,en;q=0.9,de;q=0.8",
    "en-US,en;q=0.9,fr;q=0.8",
    "en;q=0.9,en-US;q=0.8",
]

# Free Proxy list (optional - use if available)
PROXY_LIST = [
    # These are placeholder - in real scenario, use actual proxy services
    # "http://proxy1.example.com:8080",
    # "http://proxy2.example.com:8080",
]


class RealisticAttacker:
    """Simulates realistic attacker behavior with detection evasion"""
    
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
        self.session = requests.Session()
        self.attack_log = []
        self.request_count = 0
        self.blocked_count = 0
        self.user_agent = random.choice(REALISTIC_USER_AGENTS)
        self.log_dir = Path(__file__).resolve().parent
        self._setup_headers()
    
    def _setup_headers(self):
        """Setup realistic HTTP headers"""
        self.session.headers.update({
            "User-Agent": self.user_agent,
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": random.choice(ACCEPT_LANGUAGES),
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
        })
    
    def rotate_user_agent(self):
        """Rotate user agent for evasion"""
        old_agent = self.user_agent
        self.user_agent = random.choice(REALISTIC_USER_AGENTS)
        self.session.headers["User-Agent"] = self.user_agent
        # Print rotation so you can see it happening
        print(f"🔄 User Agent Rotated:")
        print(f"   Old: {old_agent[:50]}...")
        print(f"   New: {self.user_agent[:50]}...")
    
    def get_realistic_referer(self, endpoint="/"):
        """Get realistic referer based on endpoint"""
        referers = [
            f"{self.base_url}/",
            f"{self.base_url}/login",
            f"{self.base_url}/products",
            f"{self.base_url}/cart",
            f"{self.base_url}/checkout",
        ]
        return random.choice(referers)
    
    def human_like_delay(self, min_delay=0.3, max_delay=2.5):
        """
        Realistic delay between requests
        Real users aren't perfectly synchronized
        """
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)
    
    def graduated_backoff_delay(self, attempt_num, base_delay=1):
        """
        Exponential backoff when detection suspected
        Simulates attacker being cautious after detection
        """
        delay = base_delay * (2 ** attempt_num) + random.uniform(0, 1)
        time.sleep(delay)
    
    def is_rate_limited(self, response):
        """Detect if we're being rate limited"""
        # Check for rate limit status codes
        if response.status_code == 429:  # Too Many Requests
            return True
        
        # Check for rate limit headers
        if "Retry-After" in response.headers:
            return True
        
        # Check for common blocking patterns
        block_indicators = [
            "too many requests",
            "rate limit",
            "try again later",
            "temporarily blocked",
            "suspended",
        ]
        
        return any(indicator in response.text.lower() for indicator in block_indicators)
    
    def is_blocked(self, response):
        """Detect if request was blocked"""
        # Check status codes
        if response.status_code in [403, 401, 429]:
            return True
        
        # Check response content
        block_patterns = [
            "access denied",
            "forbidden",
            "blocked",
            "unauthorized",
            "captcha",
            "bot",
        ]
        
        return any(pattern in response.text.lower() for pattern in block_patterns)
    
    def smart_request(self, method, endpoint, json_data=None, params=None, 
                     retries=3, backoff=True, referer=True):
        """
        Make HTTP request with intelligent retry logic and evasion
        
        Args:
            method: GET, POST, etc.
            endpoint: API endpoint (e.g., "/api/auth/login")
            json_data: JSON payload for POST
            params: Query parameters
            retries: Number of retries on failure
            backoff: Use exponential backoff
            referer: Add realistic referer
        
        Returns:
            Response object or None
        """
        url = f"{self.base_url}{endpoint}"
        
        # Add referer header for realism
        if referer:
            headers = {"Referer": self.get_realistic_referer(endpoint)}
            self.session.headers.update(headers)
        
        for attempt in range(retries):
            try:
                self.human_like_delay()  # Delay before each request
                
                # Make request
                if method.upper() == "GET":
                    response = self.session.get(url, params=params, timeout=10)
                elif method.upper() == "POST":
                    response = self.session.post(url, json=json_data, timeout=10)
                else:
                    return None
                
                self.request_count += 1
                
                # Check for blocking
                if self.is_blocked(response):
                    self.blocked_count += 1
                    if backoff and attempt < retries - 1:
                        print(f"⚠️  Blocked! Backing off... (Attempt {attempt + 1}/{retries})")
                        self.graduated_backoff_delay(attempt)
                        # Rotate user agent on retry
                        self.rotate_user_agent()
                        continue
                    else:
                        return response
                
                # Rotate user agent periodically for evasion
                if self.request_count % random.randint(5, 10) == 0:
                    print(f"   🔄 Rotating user agent for evasion...")
                    self.rotate_user_agent()
                
                return response
            
            except requests.exceptions.Timeout:
                print(f"⏱️  Timeout on attempt {attempt + 1}")
                if attempt < retries - 1:
                    self.graduated_backoff_delay(attempt)
                continue
            
            except Exception as e:
                print(f"❌ Error: {e}")
                if attempt < retries - 1:
                    self.graduated_backoff_delay(attempt)
                continue
        
        return None
    
    def log_attack(self, target, success, details=None):
        """Log attack attempt for analysis"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "target": target,
            "success": success,
            "request_count": self.request_count,
            "blocked_count": self.blocked_count,
            "user_agent": self.user_agent[:50],
            "details": details or {}
        }
        self.attack_log.append(log_entry)
    
    def save_attack_log(self, filename="attack_log.json"):
        """Save attack log to file"""
        if not self.attack_log:
            return

        try:
            log_path = self.log_dir / Path(filename).name
            with open(log_path, "a", encoding="utf-8") as f:
                for entry in self.attack_log:
                    f.write(json.dumps(entry) + "\n")
            self.attack_log.clear()
            print(f"\n📊 Attack log saved to {log_path}")
        except Exception as e:
            print(f"Error saving log: {e}")
    
    def get_attack_summary(self):
        """Get summary statistics"""
        return {
            "total_requests": self.request_count,
            "blocked_count": self.blocked_count,
            "success_rate": f"{((self.request_count - self.blocked_count) / max(1, self.request_count)) * 100:.2f}%"
        }


def add_varied_params(params, variation_count=3):
    """
    Create variations of parameters with shuffled order
    Real attackers don't send exact same request twice
    """
    variations = []
    for _ in range(variation_count):
        varied = params.copy()
        # Shuffle dict order for variation
        varied = {k: varied[k] for k in random.sample(list(varied.keys()), len(varied))}
        variations.append(varied)
    return variations


def obfuscate_payload(payload):
    """
    Simple payload obfuscation for evasion
    Add comments, change spacing, randomize case
    """
    obfuscation_techniques = [
        lambda p: p.replace("' OR '", "' /*comment*/ OR /*x*/ '"),
        lambda p: p.upper() if random.choice([True, False]) else p.lower(),
        lambda p: p.replace(" ", "/**/ "),
    ]
    
    return random.choice(obfuscation_techniques)(payload)


if __name__ == "__main__":
    # Test the utility
    attacker = RealisticAttacker()
    print(f"User Agent: {attacker.user_agent}")
    print(f"Headers set: {len(attacker.session.headers)} headers")
    print("\nUtilities ready for use in attack scripts!")
