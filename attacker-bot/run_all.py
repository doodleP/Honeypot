#!/usr/bin/env python3
"""
Run all attack simulations
"""

import subprocess
import sys
import time
from pathlib import Path

ATTACKS = [
    ("brute_force.py", "Brute Force Login"),
    ("coupon_abuse.py", "Coupon Abuse"),
    ("xss_injection.py", "XSS Injection"),
    ("sqli_attack.py", "SQL Injection"),
    ("price_tampering.py", "Price Tampering"),
    ("privilege_escalation.py", "Privilege Escalation")
]

def run_attack(script_name, description):
    """Run a single attack script"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"{'='*60}\n")
    
    try:
        script_dir = Path(__file__).resolve().parent
        result = subprocess.run(
            [sys.executable, str(script_dir / script_name)],
            cwd=str(script_dir),
            capture_output=False,
            text=True
        )
        return result.returncode == 0
    except Exception as e:
        print(f"Error running {script_name}: {e}")
        return False

def main():
    print("🍯 HoneyGlow Trap - Attack Simulation Suite")
    print("=" * 60)
    print("This will run all attack simulations against the honeypot")
    print("Make sure the backend is running on http://localhost:3001")
    print("=" * 60)
    
    input("\nPress Enter to start attacks...")
    
    results = []
    
    for script, description in ATTACKS:
        success = run_attack(script, description)
        results.append((description, success))
        time.sleep(2)  # Brief pause between attacks
    
    print(f"\n{'='*60}")
    print("Attack Simulation Summary")
    print(f"{'='*60}\n")
    
    for description, success in results:
        status = "✅ Completed" if success else "❌ Failed"
        print(f"{status}: {description}")
    
    print("\nAll attacks completed. Check the dashboard for results!")

if __name__ == "__main__":
    main()
