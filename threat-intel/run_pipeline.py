import argparse
import json
import os
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any

from llama_index.core import Document, VectorStoreIndex
from llama_index.core.embeddings.mock_embed_model import MockEmbedding
from llama_index.llms.ollama import Ollama
from pymongo import MongoClient


ATTACK_TYPES = [
    "SQL Injection",
    "XSS",
    "Brute Force",
    "Reconnaissance",
    "File Upload Attack",
    "Normal Traffic",
]

MITRE_MAPPING = {
    "SQL Injection": {"technique": "T1190", "name": "Exploit Public-Facing Application", "tactic": "Initial Access"},
    "XSS": {"technique": "T1059.007", "name": "JavaScript", "tactic": "Execution"},
    "Brute Force": {"technique": "T1110", "name": "Brute Force", "tactic": "Credential Access"},
    "Reconnaissance": {"technique": "T1595", "name": "Active Scanning", "tactic": "Reconnaissance"},
    "File Upload Attack": {"technique": "T1105", "name": "Ingress Tool Transfer", "tactic": "Command and Control"},
    "Normal Traffic": {"technique": "N/A", "name": "No Malicious Technique", "tactic": "N/A"},
}


def to_iso(ts: Any) -> str:
    if isinstance(ts, datetime):
        return ts.isoformat()
    if not ts:
        return datetime.utcnow().isoformat()
    return str(ts)


def parse_zeek_log(log_path: Path) -> list[dict[str, Any]]:
    if not log_path.exists():
        return []

    fields: list[str] = []
    logs: list[dict[str, Any]] = []

    with log_path.open("r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line:
                continue
            if line.startswith("#fields"):
                fields = line.split("\t")[1:]
                continue
            if line.startswith("#"):
                continue
            if not fields:
                continue

            values = line.split("\t")
            row = {k: values[i] if i < len(values) else "" for i, k in enumerate(fields)}
            logs.append(row)

    return logs


def parse_json_lines(log_path: Path) -> list[dict[str, Any]]:
    if not log_path.exists():
        return []

    logs: list[dict[str, Any]] = []
    with log_path.open("r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                logs.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return logs


def parse_json_array(log_path: Path) -> list[dict[str, Any]]:
    if not log_path.exists():
        return []

    try:
        with log_path.open("r", encoding="utf-8", errors="ignore") as f:
            parsed = json.load(f)
    except json.JSONDecodeError:
        return []

    if isinstance(parsed, list):
        return [item for item in parsed if isinstance(item, dict)]
    return []


def load_mongo_logs(mongo_uri: str, db_name: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
    db = client[db_name]

    attack_logs = list(db["attacklogs"].find().limit(5000))
    sessions = list(db["attackersessions"].find().limit(5000))
    return attack_logs, sessions


def normalize_zeek_http(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for row in records:
        source_ip = row.get("id.orig_h", "")
        source_port = row.get("id.orig_p", "")
        endpoint = row.get("uri", "")
        method = row.get("method", "")
        host = row.get("host", "")
        payload = row.get("user_agent", "")
        session_id = f"{source_ip}:{source_port}"
        normalized.append(
            {
                "timestamp": to_iso(row.get("ts")),
                "source_ip": source_ip,
                "endpoint": endpoint,
                "payload": payload,
                "method": method or "GET",
                "session_id": session_id,
                "source_type": "zeek_http",
                "network_context": {
                    "protocol": "HTTP",
                    "port": 80,
                    "host": host,
                },
            }
        )
    return normalized


def normalize_app_logs(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for row in records:
        message = row.get("message") or row.get("msg") or ""
        source_ip = row.get("ip") or row.get("remoteAddress") or ""
        endpoint = row.get("endpoint") or row.get("path") or ""
        method = row.get("method") or "UNKNOWN"
        payload = row.get("payload") or row.get("requestBodyRaw") or message
        session_id = row.get("sessionId") or row.get("session_id") or source_ip or "unknown"
        normalized.append(
            {
                "timestamp": to_iso(row.get("timestamp")),
                "source_ip": source_ip,
                "endpoint": endpoint,
                "payload": payload,
                "method": method,
                "session_id": str(session_id),
                "source_type": "app_log",
                "network_context": {
                    "protocol": row.get("protocol", "HTTP"),
                    "port": row.get("port", 80),
                    "level": row.get("level"),
                },
            }
        )
    return normalized


def normalize_attack_logs(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for row in records:
        source_ip = row.get("ip", "")
        endpoint = row.get("endpoint", "")
        payload = row.get("payload") or row.get("requestBodyRaw") or row.get("requestBody") or ""
        session_id = (
            row.get("sessionId")
            or row.get("session_id")
            or (row.get("cookies") or {}).get("session_id", "")
            or source_ip
            or "unknown"
        )
        normalized.append(
            {
                "timestamp": to_iso(row.get("timestamp") or row.get("createdAt")),
                "source_ip": source_ip,
                "endpoint": endpoint,
                "payload": payload,
                "method": row.get("method", "UNKNOWN"),
                "session_id": str(session_id),
                "source_type": "attack_log",
                "network_context": {
                    "protocol": "HTTP",
                    "port": 80,
                    "response_status": row.get("responseStatus"),
                    "severity": row.get("severity"),
                },
            }
        )
    return normalized


def normalize_sessions(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for row in records:
        session_id = row.get("sessionId") or str(row.get("_id"))
        metadata = row.get("metadata") or {}
        source_ip = metadata.get("ip") or metadata.get("source_ip") or ""
        normalized.append(
            {
                "timestamp": to_iso(row.get("startTime") or row.get("createdAt")),
                "source_ip": source_ip,
                "endpoint": metadata.get("endpoint", ""),
                "payload": metadata.get("payload", ""),
                "method": metadata.get("method", "SESSION"),
                "session_id": str(session_id),
                "source_type": "session_log",
                "network_context": {
                    "protocol": metadata.get("protocol", "HTTP"),
                    "port": metadata.get("port", 80),
                    "request_count": row.get("requestCount", 0),
                },
            }
        )
    return normalized


def build_index(normalized_logs: list[dict[str, Any]]) -> VectorStoreIndex:
    docs = [Document(text=json.dumps(log, ensure_ascii=True)) for log in normalized_logs]
    return VectorStoreIndex.from_documents(docs, embed_model=MockEmbedding(embed_dim=1536))


def classify_attack(llm: Ollama, log_data: dict[str, Any]) -> dict[str, str]:
    prompt = f"""You are a cybersecurity analyst.

Classify the attack type:
- SQL Injection
- XSS
- Brute Force
- Reconnaissance
- File Upload Attack
- Normal Traffic

Log:
{json.dumps(log_data, ensure_ascii=True)}

Answer:
- Attack Type:
- Confidence:
- Reason:
"""
    try:
        response = llm.complete(prompt).text
        parsed = parse_bulleted_response(response)
        attack_type = parsed.get("Attack Type", "Normal Traffic")
        if attack_type not in ATTACK_TYPES:
            attack_type = "Normal Traffic"
        return {
            "attack_type": attack_type,
            "confidence": parsed.get("Confidence", "0.50"),
            "reason": parsed.get("Reason", "No clear signal from model output."),
        }
    except Exception:
        return heuristic_classify_attack(log_data)


def infer_intent(llm: Ollama, session_logs: list[dict[str, Any]]) -> dict[str, str]:
    session_text = "\n".join(json.dumps(log, ensure_ascii=True) for log in session_logs[:50])
    prompt = f"""Given this sequence of actions:

{session_text}

Determine:
- Attacker goal (recon, exploitation, persistence, etc.)
- Skill level (low, medium, advanced)
- Automated or human?
"""
    try:
        response = llm.complete(prompt).text
        parsed = parse_bulleted_response(response)
        return {
            "goal": parsed.get("Attacker goal", parsed.get("Goal", "Unknown")),
            "skill_level": parsed.get("Skill level", "Unknown"),
            "actor_type": parsed.get("Automated or human", "Unknown"),
        }
    except Exception:
        return heuristic_infer_intent(session_logs)


def heuristic_classify_attack(log_data: dict[str, Any]) -> dict[str, str]:
    payload = json.dumps(log_data, ensure_ascii=True).lower()
    if any(token in payload for token in ("<script", "javascript:", "onerror=", "onload=")):
        return {"attack_type": "XSS", "confidence": "0.72", "reason": "Detected script injection patterns in the payload."}
    if any(token in payload for token in ("' or 1=1", '" or 1=1', "union select", "sleep(", "--", "/*")):
        return {"attack_type": "SQL Injection", "confidence": "0.78", "reason": "Detected SQL injection keywords or tautology patterns."}
    if any(token in payload for token in ("upload", ".php", ".jsp", ".aspx", ".exe")):
        return {"attack_type": "File Upload Attack", "confidence": "0.68", "reason": "Detected suspicious file upload or executable extension patterns."}
    if any(token in payload for token in ("password", "login", "signin", "auth")):
        return {"attack_type": "Brute Force", "confidence": "0.60", "reason": "Detected repeated authentication-related activity."}
    if any(token in payload for token in ("/admin", "/login", "/wp-admin", "nmap", "scan", "probe")):
        return {"attack_type": "Reconnaissance", "confidence": "0.58", "reason": "Detected scanning or discovery-oriented activity."}
    return {"attack_type": "Normal Traffic", "confidence": "0.50", "reason": "No strong malicious indicators detected."}


def heuristic_infer_intent(session_logs: list[dict[str, Any]]) -> dict[str, str]:
    session_text = " ".join(json.dumps(log, ensure_ascii=True).lower() for log in session_logs[:50])
    if any(token in session_text for token in ("<script", "union select", "sleep(", "/admin", "nmap", "scan")):
        goal = "recon/exploitation"
        skill_level = "medium"
    elif any(token in session_text for token in ("password", "login", "signin", "auth")):
        goal = "credential access"
        skill_level = "low"
    else:
        goal = "unknown"
        skill_level = "unknown"
    actor_type = "automated" if any(token in session_text for token in ("nmap", "sqlmap", "bot", "scanner")) else "human"
    return {"goal": goal, "skill_level": skill_level, "actor_type": actor_type}


def parse_bulleted_response(text: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for line in text.splitlines():
        line = line.strip().lstrip("-").strip()
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        result[key.strip()] = value.strip()
    return result


def map_to_mitre(attack_type: str) -> dict[str, str]:
    return MITRE_MAPPING.get(attack_type, MITRE_MAPPING["Normal Traffic"])


def generate_report(
    all_logs: list[dict[str, Any]],
    per_session_analysis: list[dict[str, Any]],
    output_path: Path,
) -> None:
    risk_order = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
    risk_label = "LOW"

    attack_counter: dict[str, int] = defaultdict(int)
    for session in per_session_analysis:
        for item in session["classified_logs"]:
            attack_counter[item["classification"]["attack_type"]] += 1
        if session["risk"] in risk_order and risk_order[session["risk"]] > risk_order[risk_label]:
            risk_label = session["risk"]

    timeline = sorted(all_logs, key=lambda x: x.get("timestamp", ""))

    lines: list[str] = []
    lines.append("# Threat Intelligence Report")
    lines.append("")
    lines.append("## Summary")
    lines.append(f"- Total normalized events: {len(all_logs)}")
    lines.append(f"- Sessions analyzed: {len(per_session_analysis)}")
    lines.append(f"- Overall risk level: {risk_label}")
    lines.append("- Attack type distribution:")
    for attack_type, count in sorted(attack_counter.items(), key=lambda kv: kv[1], reverse=True):
        lines.append(f"  - {attack_type}: {count}")
    lines.append("")
    lines.append("## Attack Timeline")
    for event in timeline[:200]:
        lines.append(
            f"- {event.get('timestamp')} | {event.get('source_ip')} | {event.get('method')} {event.get('endpoint')} | {event.get('source_type')}"
        )
    lines.append("")
    lines.append("## Session Analysis")
    for session in per_session_analysis:
        intent = session["intent"]
        lines.append(f"### Session {session['session_id']}")
        lines.append(f"- Risk: {session['risk']}")
        lines.append(f"- Inferred goal: {intent['goal']}")
        lines.append(f"- Skill level: {intent['skill_level']}")
        lines.append(f"- Actor type: {intent['actor_type']}")
        lines.append("- Techniques used:")
        used_techniques: set[str] = set()
        for item in session["classified_logs"]:
            mitre = item["mitre"]
            key = f"{mitre['technique']} - {mitre['name']} ({mitre['tactic']})"
            if key not in used_techniques:
                used_techniques.add(key)
                lines.append(f"  - {key}")
        lines.append("- Key observations:")
        for item in session["classified_logs"][:10]:
            classification = item["classification"]
            lines.append(
                f"  - {item['log'].get('timestamp')} {classification['attack_type']} ({classification['confidence']}): {classification['reason']}"
            )
        lines.append("")
    lines.append("## Recommendations")
    lines.append("- Add strict input validation and output encoding for user-controlled fields.")
    lines.append("- Enforce authentication hardening: rate-limits, lockouts, and MFA for high-risk routes.")
    lines.append("- Tune WAF/IDS signatures from the observed MITRE technique patterns.")
    lines.append("- Use network and app log correlation to prioritize multi-stage attacks.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines), encoding="utf-8")


def risk_from_attack_types(attack_types: list[str]) -> str:
    if any(t in {"SQL Injection", "File Upload Attack"} for t in attack_types):
        return "CRITICAL"
    if any(t in {"XSS", "Brute Force"} for t in attack_types):
        return "HIGH"
    if any(t in {"Reconnaissance"} for t in attack_types):
        return "MEDIUM"
    return "LOW"


def resolve_path(base_dir: Path, raw_path: str) -> Path:
    path = Path(raw_path)
    if path.is_absolute():
        return path
    return (base_dir / path).resolve()


def main() -> None:
    parser = argparse.ArgumentParser(description="HoneyGlow threat-intel pipeline")
    parser.add_argument("--model", default="llama3.1:8b", help="Ollama model name")
    parser.add_argument("--ollama-base-url", default=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))
    parser.add_argument("--mongo-uri", default=os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
    parser.add_argument("--mongo-db", default=os.getenv("MONGODB_DB", "honeyglow"))
    parser.add_argument("--zeek-http-log", default="../zeek/logs/http.log")
    parser.add_argument("--app-log", default="../server/logs/combined.log")
    parser.add_argument("--session-log", default="../attacker-bot/brute_force_log.json")
    parser.add_argument("--output-report", default="./output/threat_intelligence_report.md")
    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parent
    zeek_http_log = resolve_path(base_dir, args.zeek_http_log)
    app_log = resolve_path(base_dir, args.app_log)
    session_log = resolve_path(base_dir, args.session_log)
    output_report = resolve_path(base_dir, args.output_report)

    zeek_records = parse_zeek_log(zeek_http_log)
    app_records = parse_json_lines(app_log)
    attacker_session_records = parse_json_array(session_log)

    mongo_attack_logs: list[dict[str, Any]] = []
    mongo_sessions: list[dict[str, Any]] = []
    try:
        mongo_attack_logs, mongo_sessions = load_mongo_logs(args.mongo_uri, args.mongo_db)
    except Exception:
        pass

    normalized_logs: list[dict[str, Any]] = []
    normalized_logs.extend(normalize_zeek_http(zeek_records))
    normalized_logs.extend(normalize_app_logs(app_records))
    normalized_logs.extend(normalize_attack_logs(mongo_attack_logs))
    normalized_logs.extend(normalize_sessions(mongo_sessions))
    normalized_logs.extend(normalize_sessions(attacker_session_records))

    if not normalized_logs:
        generate_report([], [], output_report)
        print(f"No logs found. Empty report written to: {output_report.resolve()}")
        return

    index = build_index(normalized_logs)
    retriever = index.as_retriever(similarity_top_k=5)
    llm = Ollama(model=args.model, base_url=args.ollama_base_url, request_timeout=120.0)

    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for log in normalized_logs:
        grouped[log["session_id"]].append(log)

    per_session_analysis: list[dict[str, Any]] = []
    for session_id, session_logs in grouped.items():
        classified = []
        for log in session_logs[:30]:
            retrieved = retriever.retrieve(json.dumps(log, ensure_ascii=True))
            context_snippets = [node.get_content() for node in retrieved]
            enriched_log = dict(log)
            enriched_log["retrieved_context"] = context_snippets
            classification = classify_attack(llm, enriched_log)
            mitre = map_to_mitre(classification["attack_type"])
            classified.append({"log": log, "classification": classification, "mitre": mitre})

        intent = infer_intent(llm, session_logs)
        risk = risk_from_attack_types([item["classification"]["attack_type"] for item in classified])
        per_session_analysis.append(
            {
                "session_id": session_id,
                "classified_logs": classified,
                "intent": intent,
                "risk": risk,
            }
        )

    generate_report(normalized_logs, per_session_analysis, output_report)
    print(f"Report written to: {output_report.resolve()}")


if __name__ == "__main__":
    main()
