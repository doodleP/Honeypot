# Threat Intelligence Agent Pipeline (Ollama + LlamaIndex)

This module adds a local AI pipeline for:

1. Log normalization
2. Attack classification
3. Intent inference
4. MITRE ATT&CK mapping
5. Human-readable report generation

## Architecture

```
[ Zeek Logs ]   [ App Logs ]   [ Session/Mongo Logs ]
       \            |               /
          [ Python Log Normalizer ]
                     |
               [ LlamaIndex ]
                     |
             [ Ollama LLM Agent ]
   (classification + intent + MITRE mapping)
                     |
      [ output/threat_intelligence_report.pdf ]
```

## Install

From this directory:

```bash
pip install -r requirements.txt
```

If an older environment already installed the full `llama-index` bundle, the cleanest reset is:

```bash
deactivate
rm -rf .venv311
py -3.11 -m venv .venv311
```

## Run

```bash
python run_pipeline.py \
  --model llama3.1:8b \
  --mongo-uri mongodb://localhost:27017 \
  --mongo-db honeyglow \
  --zeek-http-log ../zeek/logs/http.log \
  --app-log ../server/logs/combined.log \
  --session-log ../attacker-bot/brute_force_log.json \
  --output-report ./output/threat_intelligence_report.pdf
```

## Normalized Event Schema

Each source is normalized into:

```json
{
  "timestamp": "...",
  "source_ip": "...",
  "endpoint": "/login",
  "payload": "' OR 1=1 --",
  "method": "POST",
  "session_id": "xyz",
  "source_type": "app_log",
  "network_context": {
    "protocol": "HTTP",
    "port": 80
  }
}
```

## Prompt Stages

- **Attack classification**
  - SQL Injection, XSS, Brute Force, Reconnaissance, File Upload Attack, Normal Traffic
- **Intent inference**
  - Goal, skill level, automated vs human
- **Mapping**
  - MITRE ATT&CK technique/tactic lookup

## Notes

- The pipeline gracefully continues if MongoDB is unavailable.
- Report includes summary, timeline, per-session analysis, techniques, risk, and recommendations.
- Each run writes both a Markdown report and a PDF report.
