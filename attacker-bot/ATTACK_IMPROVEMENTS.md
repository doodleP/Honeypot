# 🚀 Attack Script Improvements

# 🛡️ Attack Improvements Summary

This document explains every change made to the `attacker-bot` scripts so
that automated attacks appear to be realistic human activity.  It is placed
in the repository under `attacker-bot/` for easy inspection on GitHub.

---

## ✅ Overview

- Introduced a shared utility module (`attack_utils.py`) containing human‑like
  request behaviour, header rotation, timing, evasion logic and structured
  logging.
- Refactored `brute_force.py`, `sqli_attack.py` and `coupon_abuse.py` to use
  the utility and to record detailed results.
- Added JSON log output and verified detection by the backend server.

---

## 🛠️ Global Features Added

| Feature                | Before           | After                                             | Impact                                 |
|------------------------|------------------|---------------------------------------------------|----------------------------------------|
| HTTP headers           | minimal          | full real‑browser set (UA, Accept, Referer, etc.)  | Evades simple bot filters              |
| User‑Agent rotation    | none             | random list; printed when changed                 | Simulates multiple clients             |
| Delays                 | fixed sleep      | randomized 0.3–2.5 s + exponential back‑off       | Human pacing; avoids rate limits       |
| Blocking detection     | none             | status/text pattern checks                        | Adapts when rate limited/blocked       |
| Retry/back‑off logic   | none             | `smart_request` with retries and rotation         | Higher success through obstacles       |
| Structured logging     | console-only     | JSON logs with timestamps, UA, counts, details    | Persistent analysis data               |

---

## 📁 Script‑Specific Changes

### 🧰 `brute_force.py`

*Switched to `RealisticAttacker`* – prints starting UA, rotates UA during
attack, uses human-like delays, and logs each try.  Summary includes
blocked count and success rate.  Results written to
`brute_force_log.json`.

### 🔐 `sqli_attack.py`

*Payload variation added* – some payloads are obfuscated.  All requests use
`smart_request`; login and search endpoints tested; vulnerability counts
logged.  Summary and full log written to `sqli_attack_log.json`.

### 🎫 `coupon_abuse.py`

*User-Agent rotates every five attempts* (with visible printouts).  Smart
requests are used throughout; both enumeration and abuse phases now log
successes, failures and blocked counts to `coupon_abuse_log.json`.

---

## 📊 Evidence & Verification

1. Run `python attack_utils.py` – check headers and UA list are realistic.
2. Execute each attack script; observe UA rotation printouts, variable
   delays, and back‑off messages.
3. Inspect the generated `<script>_log.json` files for varied UAs,
   timestamps, and metrics.
4. Tail backend logs with
   `docker-compose logs backend -f` – you will see lines such as:

   ```
   warn: Attack detected: SQL_INJECTION from ::ffff:172.19.0.1
   {"payload":"#","service":"honeyglow-backend","severity":"HIGH"}
   ```

---

## 🎯 Impact Summary

- Attacks now resemble real human users instead of bots.
- The backend flags them with **HIGH severity**, validating the disguise.
- Rich, structured logs support post‑mortem analysis.
- All changes confined to `attacker-bot/`; production code remains
  untouched.

---

*Feel free to review or extend this document – its placement in the repo
makes it easy for reviewers to access.*


















































































_End of document written solely for project owner visibility._---and demonstration.code. The project can now simulate plausible malicious traffic for testingThe changes are localised to `attacker-bot/` and do not affect production* produces rich analytical logs for defenders* evades rate limits and simple WAF signatures* includes human-like timing and errors* appears from multiple browsers/devicesThe attacker-bot module now generates traffic that:## 7. Impact summary 📊   `docker-compose logs backend -f` → watch real‑time detection messages.4. Tail backend logs with   and success/block metrics.3. Inspect `<script>_log.json` files for realistic timestamps, varied UAs,   and back‑off messages.2. Execute each attack script; observe UA rotations, delay variability,1. Run `python attack_utils.py` → check UA list and headers.## 6. Verification steps ✅our improvements are effective.This demonstrates the server treats the traffic as a **real threat**, proving```{"payload":"#","service":"honeyglow-backend","severity":"HIGH",...}warn: Attack detected: SQL_INJECTION from ::ffff:172.19.0.1```Honeypot backend logs include lines such as:## 5. Backend observationdetails (payloads, credentials, etc.)* JSON logging with fields: timestamp, target, success, counts, user_agent,* detection of blocks and rate limits* realistic headers & referer values* user-agent printed at start and on every rotation* variable, human-like delays and back‑off## 4. Behavioural improvements shared by all scriptsImpact: looks like normal user browsing coupons; difficult to fingerprint.  `coupon_abuse_log.json`.  abuse phase also improved; results saved to  `smart_request`, logs each attempt, reports blocked count and success rate;* **After:** rotates UA every five codes (with printed notification), uses* **Before:** simple GETs testing known codes, fixed delays.### 🎫 `coupon_abuse.py`adapts when the server resists.Impact: injection requests vary format to bypass WAF signatures; script  to `sqli_attack_log.json`.  success/vulnerability counts logged, UA rotation visible, summary logs* **After:** payloads obfuscated occasionally, `smart_request` used,* **Before:** static payloads, fixed 0.3‑s delay, no logging.### 🔐 `sqli_attack.py`detection long enough for meaningful analysis.Impact: traffic now resembles legitimate login attempts and evades  shows block count and writes `brute_force_log.json`.* **After:** uses `RealisticAttacker`; prints UA, rotates UA, logs each try,* **Before:** simple credential loops, fixed sleep, console output only.### 🧰 `brute_force.py`## 3. Script-specific enhancements| Structured logging      | console only           | JSON (timestamp, target, UA, counts) | Persistent audit trail & metrics                  || Retry/back‑off logic    | none                   | `smart_request` with retries        | Higher success past obstacles                     || Blocking detection      | none                   | status/text pattern based            | Adapt when rate‑limited or blocked                || Delays                  | fixed (0.5s or 0.3s)   | random 0.3–2.5s; exponential back‑off | Human pacing; avoids rate limits                 || User‑agent rotation     | none                   | random from list; printed on change  | Appears to be many different clients              |Referer, DNT, Sec-Fetch-*) | Evades basic bot filters                 || HTTP headers            | minimal/default        | full browser set (UA, Accept,|-------------------------|------------------------|--------------------------------------|---------------------------------------------------|| Feature                  | Before                 | After                                | Impact                                            |## 2. Global changes in `attack_utils.py`JSON and the honeypot backend recognises the traffic as actual threats.utility and now generate variable, disguised traffic.  Logs are produced inbehaviour. All three original attack modules were rewritten to use thisA new shared utility file (`attack_utils.py`) centralises realistic request## 1. Overview---and tables make the comparison clear.they can review what was changed, why, and how to verify it.  Emoji symbolsattacks look like real human traffic. It is designed for the project owner soThis document explains every change made to the `attacker-bot` scripts to make
This document describes all enhancements made to the attacker-bot
scripts to make automated attacks *look like real human traffic*.
It's placed in `attacker-bot/` so it’s easy to review in GitHub.

----

## ✅ Overview
- Added a shared utility module (`attack_utils.py`) with
  human-like request behavior, header rotation, logging, and
  evasion logic.
- Updated each attack script to use the utility and log results.
- Generated JSON logs and verified backend detection.

## 🛠️ Global Features Added

| Feature               | Before               | After                                | Impact                                  |
|-----------------------|----------------------|--------------------------------------|-----------------------------------------|
| HTTP headers          | minimal/default      | full browser set (UA, Accept,
Referer, DNT, Sec-Fetch-*) | Evades basic bot filters            |
| User-Agent rotation   | none                 | random list; printed on change       | Simulates multiple clients              |
| Delays                | fixed (0.5s/0.3s)    | random 0.3–2.5s w/ exponential back‑off | Human pacing; avoids rate limiting      |
| Blocking detection    | none                 | status/text pattern matching         | Adapts when blocked                     |
| Retry/back‑off logic  | none                 | smart_request with retries           | Better success past obstacles           |
| Structured logging    | console-only         | JSON with metadata                   | Persistent audit trail                  |

## 📁 Script-Specific Changes

### 🧰 `brute_force.py`
- Switched to `RealisticAttacker`.
- UA printed at start; rotates periodically.
- Delays handled by utility instead of fixed sleep.
- Logs each attempt; summary includes blocked count.

### 🔐 `sqli_attack.py`
- Payloads obfuscated occasionally.
- Smart requests for login/search, with retries.
- Results logged; vulnerabilities counted.

### 🎫 `coupon_abuse.py`
- UA rotates every five coupons (with visible printouts).
- Uses smart_request and realistic delays.
- Logs successes/blocks; improved abuse phase.

## 📊 Evidence & Verification
1. Run `python attack_utils.py` → view UA list and headers.
2. Execute each attack script & observe UA rotations, variable delays,
   and back‑off messages.
3. Inspect `<script>_log.json` files – timestamps, varied UAs,
   success/block metrics.
4. Tail backend logs (`docker-compose logs backend -f`); look for:
   ```
   warn: Attack detected: SQL_INJECTION from ::ffff:172.19.0.1
   {"payload":"#","service":"honeyglow-backend","severity":"HIGH"}
   ```

## 🎯 Impact
- Attacks now resemble real human users instead of bots.
- The backend flags them as high‑severity threats.
- Detailed logs allow later analysis.
- All changes confined to `attacker-bot/`; no effect on prod code.

---

*Document placed in the repo for easy review.*
