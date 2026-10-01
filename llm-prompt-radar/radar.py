"""Daily, evidence-based discovery of useful public LLM prompts."""

from __future__ import annotations

import base64
import difflib
import hashlib
import json
import math
import os
import re
import statistics
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen


API = "https://api.github.com"
NOW = datetime.now(timezone.utc)
WEIGHTS = {"engagement": .30, "trending": .25, "positive": .20, "recency": .15, "usefulness": .10}
try:
    _minimum = float(os.getenv("RADAR_MIN_SCORE", ".48"))
    MIN_SCORE = max(0.0, min(1.0, _minimum)) if math.isfinite(_minimum) else .48
except ValueError:
    MIN_SCORE = .48
try:
    MAX_PROMPTS = max(1, min(10, int(os.getenv("RADAR_MAX_PROMPTS", "5"))))
except ValueError:
    MAX_PROMPTS = 5
MAX_PROMPT_CHARS = 10000
HISTORY_PATH = Path(__file__).with_name("history.json")
HISTORY_DAYS = 365
SNAPSHOT_DAYS = 90
HISTORY_NORMALIZED_CHARS = 3000
UA = "Den-Lab-LLM-Prompt-Radar/1.0 (daily personal digest)"


@dataclass
class Candidate:
    source: str
    title: str
    url: str
    author: str
    published: datetime
    prompt: str
    engagement: float
    velocity: float
    positive_ratio: float | None
    rating_count: int
    usefulness: float
    category: str
    model: str = "Not specified"
    license_name: str = ""
    signals: dict = field(default_factory=dict)
    scores: dict = field(default_factory=dict)
    score: float = 0.0
    confidence: str = "Low"
    unique_id: str = ""
    cluster_id: str = ""
    normalized: str = ""
    sighting_sources: list[str] = field(default_factory=list)
    sighting_urls: list[str] = field(default_factory=list)
    quality_score: float = 0.0
    resurface_reason: str = ""


class SourceAdapter:
    name = "source"

    def fetch(self) -> list[Candidate]:
        raise NotImplementedError


def request_json(url: str, headers: dict[str, str] | None = None) -> dict:
    request_headers = {"User-Agent": UA, "Accept": "application/vnd.github+json, application/json"}
    request_headers.update(headers or {})
    request = Request(url, headers=request_headers)
    try:
        with urlopen(request, timeout=25) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        retry = exc.headers.get("Retry-After", "")
        raise RuntimeError(f"HTTP {exc.code}" + (f" (retry after {retry}s)" if retry else "")) from None
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(type(exc).__name__) from None


def post_form_json(url: str, values: dict[str, str], headers: dict[str, str]) -> dict:
    body = urlencode(values).encode()
    request_headers = {"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded"}
    request_headers.update(headers)
    request = Request(url, data=body, headers=request_headers, method="POST")
    try:
        with urlopen(request, timeout=25) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        retry = exc.headers.get("Retry-After", "")
        raise RuntimeError(f"HTTP {exc.code}" + (f" (retry after {retry}s)" if retry else "")) from None
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(type(exc).__name__) from None


def parse_time(value: str | None) -> datetime:
    if not value:
        return NOW
    try:
        result = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return result if result.tzinfo else result.replace(tzinfo=timezone.utc)
    except ValueError:
        return NOW


def category_for(text: str) -> str:
    lowered = text.lower()
    tags = (("Coding", ("code", "coding", "programming", "debugging")),
            ("Software Engineering", ("developer", "software", "architecture", "testing", "devops")),
            ("Research", ("research", "paper", "academic", "literature")),
            ("Data Analysis", ("data analysis", "data science", "visualization", "statistics", "sql")),
            ("Writing", ("writing", "writer", "editor", "copywriting")),
            ("Learning", ("learn", "tutor", "education", "study")),
            ("AI Agents", ("agent", "tool use", "function call", "multi-agent")),
            ("Automation", ("automation", "workflow", "automate")),
            ("Productivity", ("productivity", "planning", "meeting", "time management")),
            ("Business", ("business", "marketing", "sales", "strategy", "customer")),
            ("Image Generation", ("image", "visual", "art", "midjourney", "stable diffusion")),
            ("Creative Work", ("creative", "story", "fiction", "poem", "brainstorm")))
    return next((label for label, words in tags if any(word in lowered for word in words)), "Reasoning & general")


def model_for(text: str) -> str:
    matches = re.findall(r"\b(GPT[- ]?[34](?:\.\d)?|GPT-4o|o[1-4](?:-mini)?|Claude(?: 3(?:\.5|\.7)?)?|Gemini(?: 1\.5| 2(?:\.5)?)?|Llama ?[23](?:\.\d)?|Mistral(?: Large)?)\b", text, re.I)
    return ", ".join(dict.fromkeys(match.strip() for match in matches)) or "Not specified"


def useful_score(title: str, prompt: str, readme: str) -> float:
    text = f"{title} {prompt} {readme}".lower()
    score = .25
    for words, points in [(("step by step", "step-by-step", "structured", "format", "template", "rubric"), .13),
                          (("example", "few-shot", "example output", "worked example"), .12),
                          (("constraint", "criteria", "checklist", "verify", "validation"), .13),
                          (("code", "research", "analysis", "workflow", "automation", "tutor"), .12),
                          (("role", "you are", "act as"), .07)]:
        if any(word in text for word in words):
            score += points
    words = len(prompt.split())
    if 60 <= words <= 700:
        score += .12
    elif 35 <= words <= 1200:
        score += .06
    return min(1.0, score)


SECRET_PATTERNS = (
    r"\bsk-[A-Za-z0-9_-]{16,}\b", r"\bgh[pousr]_[A-Za-z0-9]{20,}\b",
    r"\bgithub_pat_[A-Za-z0-9_]{20,}\b", r"\bxox[baprs]-[A-Za-z0-9-]{15,}\b",
    r"\bAKIA[0-9A-Z]{16}\b", r"\bAIza[0-9A-Za-z_-]{30,}\b", r"\bglpat-[A-Za-z0-9_-]{20,}\b",
    r"\b\d{8,12}:[A-Za-z0-9_-]{30,}\b", r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    r"(?i)\b(?:password|passwd|api[_ -]?key|secret|token)\s*[:=]\s*['\"]?\S{8,}",
    r"(?:APIキー|パスワード|アクセストークン)\s*[:=：]\s*\S{8,}",
)
PII_PATTERNS = (
    r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
    r"(?<!\d)(?:\+?\d[ .()-]?){9,15}(?!\d)",
    r"\b\d{3}-\d{2}-\d{4}\b",
    r"〒?\d{3}-\d{4}",
)
HARMFUL_PATTERNS = (
    r"\b(?:jailbreak|DAN mode|ignore (?:all )?(?:previous|safety) instructions|bypass (?:the )?(?:safety|safeguards|policy)|disable (?:safety|guardrails)|reveal (?:the )?system prompt)\b",
    r"\b(?:steal credentials|exfiltrate secrets|deploy ransomware|write a keylogger|phishing kit|evade antivirus|bypass endpoint detection)\b",
    r"(?:前の指示を無視|すべての指示を無視|安全対策を回避|制限を解除|システムプロンプトを表示|内部指示を開示|認証情報を盗|秘密を流出)",
)
SPAM_PATTERNS = (
    r"\b(?:affiliate link|use my (?:link|code)|buy my prompt|limited time offer|guaranteed passive income)\b",
    r"\b(?:like and subscribe|smash that like|follow me for more prompts|giveaway)\b",
    r"https?://[^\s]*(?:aff(?:iliate)?|ref=|partner=)[^\s]*",
    r"(?:アフィリエイトリンク|今すぐ購入|限定オファー|フォローして.*(?:いいね|登録))",
)
GENERIC_ROLE = re.compile(r"\b(?:act as|you are)\s+(?:an?\s+)?(?:expert|professional|specialist|consultant|assistant)\b", re.I)
TECHNIQUE = re.compile(r"\b(?:step[- ]by[- ]step|few[- ]shot|chain of thought|tree of thought|rubric|schema|JSON|checklist|counterexample|verify|constraints?|assumptions?|evaluation criteria|ask me clarifying questions|cite sources)\b", re.I)


def quality_gate(candidate: Candidate) -> tuple[bool, float, str]:
    """Reject risky content without executing it; score useful structure with simple heuristics."""
    content = candidate.title + "\n" + candidate.prompt
    if any(re.search(pattern, content) for pattern in SECRET_PATTERNS):
        return False, 0.0, "credential-like content"
    if any(re.search(pattern, content) for pattern in PII_PATTERNS):
        return False, 0.0, "possible personal information"
    if any(re.search(pattern, content, re.I) for pattern in HARMFUL_PATTERNS):
        return False, 0.0, "jailbreak or safety bypass content"
    if any(re.search(pattern, content, re.I) for pattern in SPAM_PATTERNS):
        return False, 0.0, "promotional or engagement-bait content"
    normalized = " ".join(candidate.prompt.split())
    if GENERIC_ROLE.search(normalized) and not TECHNIQUE.search(normalized):
        return False, 0.0, "generic role prompt without a meaningful technique"
    text = (candidate.title + " " + candidate.prompt).lower()
    spam_signals = sum(term in text for term in ("1000 prompts", "ultimate prompt list", "best prompts ever", "viral prompt", "secret prompt hack"))
    if spam_signals >= 2:
        return False, 0.0, "prompt-list SEO spam"
    score = useful_score(candidate.title, candidate.prompt, "")
    if score < .40:
        return False, score, "insufficient usefulness signals"
    return True, score, "passed heuristic quality filters"


def extract_prompt(readme: str) -> str:
    # Prefer a fenced prompt block beneath a prompt-related heading.
    chunks = re.split(r"(?m)^#{1,4}\s+(.+?)\s*$", readme)
    candidates: list[str] = []
    for i in range(1, len(chunks), 2):
        heading, body = chunks[i], chunks[i + 1]
        if re.search(r"prompt|system message|instruction", heading, re.I):
            candidates.extend(re.findall(r"```[^\n]*\n(.*?)```", body, re.S))
            plain = re.sub(r"```.*?```", "", body, flags=re.S).strip()
            if len(plain.split()) >= 35:
                candidates.append(plain)
    for candidate in candidates:
        candidate = candidate.strip()
        if 35 <= len(candidate.split()) <= 1800:
            return candidate[:MAX_PROMPT_CHARS]
    # Fallback to a substantive fenced block, common in prompt collections.
    for candidate in re.findall(r"```[^\n]*\n(.*?)```", readme, re.S):
        candidate = candidate.strip()
        if 50 <= len(candidate.split()) <= 1000:
            return candidate[:MAX_PROMPT_CHARS]
    return ""


class GitHubAdapter(SourceAdapter):
    name = "GitHub"

    def fetch(self) -> list[Candidate]:
        headers = {}
        token = os.getenv("GITHUB_TOKEN", "").strip()
        if token:
            headers["Authorization"] = f"Bearer {token}"
        repos: dict[str, dict] = {}
        for query in ('"prompt engineering" LLM prompts', 'LLM prompt collection'):
            url = f"{API}/search/repositories?{urlencode({'q': query, 'sort': 'stars', 'order': 'desc', 'per_page': 25})}"
            for repo in request_json(url, headers).get("items", []):
                repos[repo["full_name"]] = repo

        results = []
        for repo in repos.values():
            full_name = repo.get("full_name", "")
            if not full_name:
                continue
            owner = repo.get("owner", {}).get("login", full_name.split("/")[0])
            try:
                data = request_json(f"{API}/repos/{full_name}/readme", headers)
                readme = base64.b64decode(data.get("content", "")).decode("utf-8", errors="replace")
            except (RuntimeError, ValueError):
                continue
            prompt = extract_prompt(readme)
            if not prompt:
                continue
            title = repo.get("description") or full_name
            stars = int(repo.get("stargazers_count", 0))
            created = parse_time(repo.get("created_at"))
            age_days = max(1.0, (NOW - created).total_seconds() / 86400)
            license_name = (repo.get("license") or {}).get("spdx_id", "")
            results.append(Candidate(
                source=self.name, title=title[:180], url=repo.get("html_url", ""), author=owner,
                published=parse_time(repo.get("updated_at")), prompt=prompt, engagement=stars,
                velocity=stars / max(24.0, age_days * 24), positive_ratio=None, rating_count=0,
                usefulness=useful_score(title, prompt, readme), category=category_for(title + " " + prompt),
                model=model_for(title + " " + prompt), license_name=license_name,
                signals={"stars": stars, "stars_per_day_since_repo_creation": round(stars / age_days, 3),
                         "engagement_components": {"stars": stars},
                         "repository": full_name, "license": license_name or "not declared",
                         "age_hours": round(age_days * 24, 1),
                         "date_basis": "repository last updated; exact prompt publication date unavailable"},
            ))
        return results


class RedditAdapter(SourceAdapter):
    """Official Reddit OAuth adapter; skipped unless registered API credentials are configured."""
    name = "Reddit"

    def fetch(self) -> list[Candidate]:
        client, secret = os.getenv("REDDIT_CLIENT_ID", "").strip(), os.getenv("REDDIT_CLIENT_SECRET", "").strip()
        if not client or not secret:
            print("SOURCE Reddit skipped: set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET for official API access.", file=sys.stderr)
            return []
        credentials = base64.b64encode(f"{client}:{secret}".encode()).decode()
        token_data = post_form_json("https://www.reddit.com/api/v1/access_token", {"grant_type": "client_credentials"},
                                    {"Authorization": f"Basic {credentials}"})
        access_token = token_data.get("access_token")
        if not access_token:
            raise RuntimeError("OAuth token was not returned")
        headers = {"Authorization": f"Bearer {access_token}"}
        candidates = []
        for community in ("ChatGPTPromptGenius", "PromptEngineering", "ChatGPT"):
            query = urlencode({"q": "prompt", "restrict_sr": "on", "sort": "top", "t": "week", "limit": 25})
            data = request_json(f"https://oauth.reddit.com/r/{community}/search?{query}", headers)
            for child in data.get("data", {}).get("children", []):
                post = child.get("data", {})
                body = (post.get("selftext") or "").strip()
                if len(body.split()) < 35 or post.get("over_18") or post.get("removed_by_category"):
                    continue
                created = datetime.fromtimestamp(float(post.get("created_utc", NOW.timestamp())), timezone.utc)
                age_hours = max(1.0, (NOW - created).total_seconds() / 3600)
                age_days = age_hours / 24
                up_ratio = post.get("upvote_ratio")
                score = int(post.get("score", 0))
                comments = int(post.get("num_comments", 0))
                suspicious_engagement = ((score >= 5000 and (comments < 2 or up_ratio == 1.0))
                                         or (age_hours <= 1 and score >= 1000))
                results_url = "https://www.reddit.com" + post.get("permalink", "")
                title = post.get("title", "Untitled prompt")
                candidates.append(Candidate(
                    source=self.name, title=title[:180], url=results_url,
                    author=post.get("author", "Unknown"), published=created, prompt=body[:MAX_PROMPT_CHARS],
                    engagement=max(0, score) + comments * 2,
                    velocity=max(0, score + comments * 2) / age_hours,
                    positive_ratio=float(up_ratio) if up_ratio is not None else None,
                    rating_count=int(post.get("ups", 0)) + int(post.get("downs", 0)), usefulness=useful_score(title, body, ""),
                    category=category_for(title + " " + body), model=model_for(title + " " + body),
                    signals={"upvotes_score": score, "comments": comments,
                             "upvote_ratio": up_ratio, "age_hours": round(age_hours, 1),
                             "engagement_components": {"post_score": score, "comments": comments},
                             "suspicious_engagement_pattern": suspicious_engagement},
                ))
        return candidates


STOP_WORDS = set("a an and are as at be by for from in is it of on or that the this to was with you your act following".split())


def normalized_prompt(text: str) -> str:
    words = re.findall(r"[^\W_]+", text.casefold(), flags=re.UNICODE)
    words = [word for word in words if word not in STOP_WORDS and len(word) > 1]
    return " ".join(words)


def prompt_similarity(left: str, right: str) -> float:
    if not left or not right:
        return 0.0
    if left == right:
        return 1.0
    a, b = left.split(), right.split()
    if min(len(a), len(b)) < 3:
        left_chars, right_chars = left.replace(" ", ""), right.replace(" ", "")
        if min(len(left_chars), len(right_chars)) < 4:
            return 0.0
        a_shingles = {left_chars[i:i + 2] for i in range(len(left_chars) - 1)}
        b_shingles = {right_chars[i:i + 2] for i in range(len(right_chars) - 1)}
        union = a_shingles | b_shingles
        return len(a_shingles & b_shingles) / len(union) if union else 0.0
    a_set, b_set = set(a), set(b)
    containment = len(a_set & b_set) / min(len(a_set), len(b_set))
    sequence = difflib.SequenceMatcher(None, a, b, autojunk=False).ratio()
    # Token containment catches reordered and lightly rewritten prompts; sequence similarity
    # protects against unrelated short texts that happen to share a few common words.
    return max(sequence, containment * .88 + sequence * .12)


def empty_history() -> dict:
    return {"version": 1, "records": {}, "notified_clusters": {}}


def load_history() -> dict:
    try:
        history = json.loads(HISTORY_PATH.read_text(encoding="utf-8"))
        if not isinstance(history, dict) or history.get("version") != 1:
            raise RuntimeError("Prompt history has an unsupported schema; refusing to overwrite it.")
        records, notified = history.get("records", {}), history.get("notified_clusters", {})
        if not isinstance(records, dict) or not isinstance(notified, dict):
            raise RuntimeError("Prompt history has an invalid schema; refusing to overwrite it.")
        return {"version": 1, "records": records, "notified_clusters": notified}
    except FileNotFoundError:
        return empty_history()
    except (json.JSONDecodeError, OSError):
        raise RuntimeError("Prompt history is unreadable; refusing to overwrite it.") from None


def apply_historical_velocity(candidate: Candidate, history: dict) -> None:
    candidate.unique_id = hashlib.sha256((candidate.source + "\0" + normalized_prompt(candidate.prompt)).encode()).hexdigest()
    record = history["records"].get(candidate.unique_id, {})
    observations = record.get("observations", [])
    current_time = NOW.timestamp()
    previous = next((item for item in reversed(observations)
                     if 0 < (current_time - float(item.get("timestamp", 0))) <= SNAPSHOT_DAYS * 86400), None)
    current_engagement = max(0.0, candidate.engagement)
    age_hours = max(1.0, float(candidate.signals.get("age_hours", 24)))
    components = candidate.signals.get("engagement_components", {})
    component_rates = {}
    previous_components = previous.get("components", {}) if previous else {}
    if previous and previous_components:
        elapsed_hours = max(1.0, (current_time - float(previous["timestamp"])) / 3600)
        for key, current_value in components.items():
            if key in previous_components:
                component_rates[key] = max(0.0, float(current_value) - float(previous_components[key])) / elapsed_hours
    if not component_rates:
        component_rates = {key: max(0.0, float(value)) / age_hours for key, value in components.items()}
    candidate.signals["component_velocity_per_hour"] = {key: round(value, 4) for key, value in component_rates.items()}
    if previous and previous_components:
        elapsed_hours = max(1.0, (current_time - float(previous["timestamp"])) / 3600)
        delta = max(0.0, current_engagement - float(previous.get("engagement", 0)))
        candidate.velocity = delta / elapsed_hours
        candidate.signals["velocity_basis"] = f"observed {delta:g} additional source interactions over {elapsed_hours:.1f}h"
    else:
        candidate.velocity = current_engagement / age_hours
        candidate.signals["velocity_basis"] = "first observation; total source interactions divided by item age in hours"
    if component_rates:
        candidate.velocity = sum(component_rates.values()) if candidate.source == "GitHub" else component_rates.get("post_score", 0.0) + 2 * component_rates.get("comments", 0.0)
    if candidate.positive_ratio is not None and previous and previous.get("positive_ratio") is not None:
        candidate.signals["rating_change_percentage_points"] = round((candidate.positive_ratio - float(previous["positive_ratio"])) * 100, 2)
    candidate.signals["source_velocity_per_hour"] = round(candidate.velocity, 4)
    previous_rates = [max(0.0, float(item.get("velocity_per_hour", 0))) for item in observations
                      if item.get("velocity_per_hour") is not None]
    if len(previous_rates) >= 2:
        normal_rate = statistics.median(previous_rates)
        if normal_rate > 0:
            candidate.signals["velocity_multiple"] = round(candidate.velocity / normal_rate, 2)
            candidate.signals["normal_velocity_per_hour"] = round(normal_rate, 4)


def deduplicate(candidates: list[Candidate], history: dict) -> list[Candidate]:
    """Cluster exact and near-copies, including cross-source reposts, without counting them twice."""
    historical = []
    seen_cluster_text = set()
    for record in history["records"].values():
        cluster_id = record.get("cluster_id", "")
        normalized = record.get("normalized_prompt", "")
        if cluster_id and normalized and (cluster_id, normalized) not in seen_cluster_text:
            historical.append((cluster_id, normalized))
            seen_cluster_text.add((cluster_id, normalized))
    groups: dict[str, list[Candidate]] = {}
    for candidate in candidates:
        normalized = normalized_prompt(candidate.prompt)
        candidate.unique_id = hashlib.sha256((candidate.source + "\0" + normalized).encode()).hexdigest()
        candidate.normalized = normalized
        matches = [(prompt_similarity(normalized, old_text), old_cluster) for old_cluster, old_text in historical]
        best_score, old_cluster = max(matches, default=(0.0, ""))
        if best_score >= .78:
            cluster_id = old_cluster
        else:
            match_cluster = next((cluster for cluster, members in groups.items()
                                  if any(prompt_similarity(normalized, member.normalized) >= .78 for member in members)), None)
            cluster_id = match_cluster or hashlib.sha256(normalized.encode()).hexdigest()[:24]
        candidate.cluster_id = cluster_id
        groups.setdefault(cluster_id, []).append(candidate)

    leaders = []
    for cluster_id, group in groups.items():
        # Prefer a candidate with a useful extracted body; engagement is only a tie-break.
        group.sort(key=lambda item: (item.quality_score, math.log1p(item.engagement)), reverse=True)
        leader = group[0]
        leader.sighting_sources = sorted({item.source for item in group})
        leader.sighting_urls = list(dict.fromkeys(item.url for item in group if item.url))
        leader.signals["source_sightings"] = len(leader.sighting_sources)
        leader.signals["duplicate_cluster_size"] = len(group)
        leaders.append(leader)
    return leaders


def update_history(history: dict, candidates: list[Candidate], selected: list[Candidate],
                   representatives: list[Candidate]) -> None:
    selected_clusters = {item.cluster_id: item for item in selected}
    representative_by_cluster = {item.cluster_id: item for item in representatives}
    records = history["records"]
    for candidate in candidates:
        if not candidate.unique_id:
            continue
        representative = representative_by_cluster.get(candidate.cluster_id, candidate)
        record = records.setdefault(candidate.unique_id, {
            "normalized_prompt": getattr(candidate, "normalized", normalized_prompt(candidate.prompt))[:HISTORY_NORMALIZED_CHARS],
            "source": candidate.source, "original_url": candidate.url, "author": candidate.author,
            "discovery_date": NOW.date().isoformat(), "publication_date": candidate.published.date().isoformat(),
            "category": candidate.category, "model": candidate.model, "observations": [],
        })
        record.update({"cluster_id": candidate.cluster_id, "normalized_prompt": getattr(candidate, "normalized", normalized_prompt(candidate.prompt))[:HISTORY_NORMALIZED_CHARS],
                       "source": candidate.source, "original_url": candidate.url, "author": candidate.author,
                       "publication_date": candidate.published.date().isoformat(), "category": candidate.category,
                       "model": candidate.model, "engagement_metrics": candidate.signals,
                       "rating": candidate.positive_ratio, "rating_count": candidate.rating_count,
                       "calculated_score": representative.score, "trending_score": representative.scores.get("trending", 0),
                       "quality_score": candidate.quality_score})
        record["last_seen"] = NOW.date().isoformat()
        observations = record.setdefault("observations", [])
        if not observations or (NOW.timestamp() - float(observations[-1].get("timestamp", 0))) >= 20 * 3600:
            observations.append({"timestamp": NOW.timestamp(), "date": NOW.date().isoformat(),
                                 "engagement": candidate.engagement, "velocity_per_hour": candidate.velocity,
                                 "components": candidate.signals.get("engagement_components", {}),
                                 "positive_ratio": candidate.positive_ratio, "rating_count": candidate.rating_count})
        record["observations"] = [item for item in observations
                                  if NOW.timestamp() - float(item.get("timestamp", 0)) <= SNAPSHOT_DAYS * 86400]
        if candidate.cluster_id in selected_clusters:
            record["notification_date"] = NOW.date().isoformat()
    for item in selected:
        previous_notice = history["notified_clusters"].get(item.cluster_id)
        if isinstance(previous_notice, dict):
            previous_notice["notified_at"] = NOW.isoformat(timespec="seconds")
            previous_notice["resurface_count"] = int(previous_notice.get("resurface_count", 0)) + (1 if item.resurface_reason else 0)
            previous_notice["resurface_reason"] = item.resurface_reason or previous_notice.get("resurface_reason", "")
            previous_notice.setdefault("source_baselines", {})[item.source] = item.engagement
            previous_notice["last_velocity_multiple"] = item.signals.get("velocity_multiple")
        else:
            history["notified_clusters"][item.cluster_id] = {
                "notified_at": NOW.isoformat(timespec="seconds"), "source_baselines": {item.source: item.engagement},
                "resurface_count": 0, "resurface_reason": "",
                "last_velocity_multiple": item.signals.get("velocity_multiple"),
            }
    cutoff = NOW.timestamp() - HISTORY_DAYS * 86400
    history["records"] = {key: record for key, record in records.items()
                           if record.get("cluster_id") in history["notified_clusters"]
                           or parse_time(record.get("last_seen", record.get("publication_date"))).timestamp() >= cutoff}


def save_history(history: dict) -> None:
    HISTORY_PATH.write_text(json.dumps(history, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def percentile(values: list[float]) -> list[float]:
    if len(values) <= 1:
        return [0.5] * len(values)
    ordered = sorted(enumerate(values), key=lambda pair: pair[1])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(ordered):
        j = i + 1
        while j < len(ordered) and ordered[j][1] == ordered[i][1]:
            j += 1
        rank = (i + j - 1) / 2 / (len(ordered) - 1)
        for k in range(i, j):
            ranks[ordered[k][0]] = rank
        i = j
    return ranks


def rank(candidates: list[Candidate]) -> list[Candidate]:
    # Normalize each source independently; logarithms reduce the effect of extreme counts.
    by_source: dict[str, list[Candidate]] = {}
    for item in candidates:
        by_source.setdefault(item.source, []).append(item)
    weights = dict(WEIGHTS)
    try:
        override = json.loads(os.getenv("RADAR_WEIGHTS", "").strip() or "{}")
        if not isinstance(override, dict):
            raise ValueError
        for key, value in override.items():
            number = float(value)
            if key in weights and math.isfinite(number) and number >= 0:
                weights[key] = number
    except (ValueError, TypeError):
        print("WARNING invalid RADAR_WEIGHTS; using defaults", file=sys.stderr)
    weight_total = sum(weights.values()) or 1.0
    if weight_total <= 0 or not math.isfinite(weight_total):
        weights = dict(WEIGHTS)
        weight_total = sum(weights.values())
    weights = {k: v / weight_total for k, v in weights.items()}

    for group in by_source.values():
        engagement_values = [max(0, c.engagement) for c in group]
        velocity_values = [max(0, c.velocity) for c in group]
        engagement_ranks = percentile([math.log1p(value) for value in engagement_values])
        velocity_ranks = percentile([math.log1p(value) for value in velocity_values])
        metrics = {
            # Percentile ranking handles source differences; a log volume factor prevents
            # a lone/low-activity candidate from receiving a neutral 0.5 just by being alone.
            "engagement": [rank * min(1.0, math.log1p(value) / math.log1p(100))
                           * (.25 if candidate.signals.get("suspicious_engagement_pattern") else 1.0)
                           for rank, value, candidate in zip(engagement_ranks, engagement_values, group)],
            "trending": [rank * min(1.0, math.log1p(value) / math.log1p(10))
                         * (.25 if candidate.signals.get("suspicious_engagement_pattern") else 1.0)
                         for rank, value, candidate in zip(velocity_ranks, velocity_values, group)],
        }
        for i, candidate in enumerate(group):
            # Wilson lower bound prevents tiny samples from looking certain; if no review signal,
            # explicitly use neutral 0.5 rather than fabricating a positive rating.
            if candidate.positive_ratio is None or candidate.rating_count <= 0:
                positive = .5
            else:
                n = max(1, candidate.rating_count)
                p = max(0.0, min(1.0, candidate.positive_ratio))
                z = 1.96
                positive = (p + z*z/(2*n) - z*math.sqrt((p*(1-p)+z*z/(4*n))/n)) / (1+z*z/n)
            age = max(0.0, (NOW - candidate.published).total_seconds() / 86400)
            recency = math.exp(-age / 45.0)
            scores = {"engagement": metrics["engagement"][i], "trending": metrics["trending"][i],
                      "positive": positive, "recency": recency, "usefulness": candidate.usefulness}
            candidate.scores = scores
            base_score = sum(weights[key] * scores[key] for key in weights)
            # Identical/near-identical prompt sightings are repost evidence, not independent validation.
            candidate.score = base_score
            candidate.quality_score = candidate.usefulness
            volume = candidate.engagement
            candidate.confidence = ("Low" if candidate.signals.get("suspicious_engagement_pattern")
                                    else "High" if volume >= 500 else "Medium" if volume >= 80 else "Low")
            candidate.signals.update({"normalized_scores": {k: round(v, 3) for k, v in scores.items()},
                                      "composite_score": round(candidate.score, 3)})
    return sorted(candidates, key=lambda c: (-c.score, c.url))


def why_selected(candidate: Candidate) -> str:
    lead = "strong relative community engagement" if candidate.scores.get("engagement", 0) >= .75 else "a timely, practical prompt"
    if candidate.scores.get("trending", 0) >= .75:
        lead += " and strong source-normalized engagement velocity"
    return f"Selected for {lead}; usefulness signals scored {candidate.usefulness:.2f}/1. Popularity is not treated as proof of quality."


def why_interesting(candidate: Candidate) -> str:
    features = []
    if candidate.category != "Reasoning & general":
        features.append(f"applies LLM prompting to {candidate.category.lower()}")
    prompt_lower = candidate.prompt.lower()
    if any(term in prompt_lower for term in ("verify", "checklist", "criteria", "rubric")):
        features.append("builds in checks or evaluation criteria")
    if any(term in prompt_lower for term in ("example", "few-shot")):
        features.append("uses examples to guide the model")
    if any(term in prompt_lower for term in ("step by step", "step-by-step", "workflow", "phase 1")):
        features.append("breaks the task into a repeatable process")
    if not features:
        features.append("contains a substantial, reusable instruction block")
    feature_text = "; ".join(features)
    return (f"The prompt {feature_text}. Its explicit structure makes the intended process easier to inspect and reuse;"
            " this is a heuristic reading of the prompt text, not evidence of measured outcomes.")


def significant_new_development(candidate: Candidate, notified_clusters: dict | None) -> bool:
    if not notified_clusters:
        return False
    notice = notified_clusters.get(candidate.cluster_id)
    if not isinstance(notice, dict):
        return False
    try:
        previous_time = datetime.fromisoformat(notice["notified_at"])
        if previous_time.tzinfo is None:
            previous_time = previous_time.replace(tzinfo=timezone.utc)
        days_since_notice = (NOW - previous_time).total_seconds() / 86400
    except (KeyError, ValueError, TypeError):
        return False
    baseline = notice.get("source_baselines", {}).get(candidate.source)
    if baseline is None or days_since_notice < 7:
        return False
    growth = candidate.engagement - float(baseline)
    multiple = candidate.signals.get("velocity_multiple")
    # Require a material absolute increase, >3x this prompt's own prior pace, and a high current rank.
    if growth < max(100.0, float(baseline) * .5) or multiple is None or multiple < 3.0:
        return False
    if candidate.score < .85 or candidate.quality_score < .65:
        return False
    candidate.resurface_reason = (f"new development: {growth:.0f} additional source interactions since the last notice "
                                  f"and {multiple:.1f}× the prior observed velocity; this prompt was requalified at score {candidate.score:.2f}")
    candidate.signals["new_interactions_since_notification"] = growth
    candidate.signals["resurfacing_velocity_multiple"] = multiple
    return True


def choose(candidates: list[Candidate], notified_clusters: dict | None = None, limit: int = MAX_PROMPTS) -> list[Candidate]:
    # Avoid one source taking over the digest; preserve high-quality threshold.
    selected, source_counts, category_counts = [], {}, {}
    for item in rank(candidates):
        already_notified = bool(notified_clusters and item.cluster_id in notified_clusters)
        may_resurface = significant_new_development(item, notified_clusters) if already_notified else False
        if (item.score < MIN_SCORE or source_counts.get(item.source, 0) >= 3
                or (already_notified and not may_resurface)
                or (category_counts.get(item.category, 0) >= 2 and item.score < .85)):
            continue
        selected.append(item)
        source_counts[item.source] = source_counts.get(item.source, 0) + 1
        category_counts[item.category] = category_counts.get(item.category, 0) + 1
        if len(selected) == limit:
            break
    return selected


def clean_display(value: str) -> str:
    # Telegram is sent without parse_mode; strip control/bidi formatting to keep content inert/readable.
    return "".join(ch for ch in value if ch in "\n\t" or (ch.isprintable() and ord(ch) not in range(0x202A, 0x202F) and ord(ch) not in range(0x2066, 0x206A)))


def single_line(value: str, limit: int = 250) -> str:
    text = " ".join(clean_display(value).split())
    text = re.sub(r"(?i)\b(https?)://", lambda match: match.group(1) + "[:]//", text)
    return re.sub(r"(?i)\bwww\.", "www[.]", text)[:limit]


def safe_source_url(value: str) -> str:
    parsed = urlparse(value)
    allowed_hosts = {"github.com", "www.reddit.com"}
    return value if parsed.scheme == "https" and parsed.hostname in allowed_hosts else ""


def prompt_facts(candidate: Candidate) -> list[str]:
    facts = []
    if candidate.source == "GitHub" and "stars" in candidate.signals:
        facts.append(f"{candidate.signals['stars']:,} repository stars")
    if candidate.source == "Reddit":
        if "upvotes_score" in candidate.signals:
            facts.append(f"Reddit post score {candidate.signals['upvotes_score']:,}")
        if "comments" in candidate.signals:
            facts.append(f"{candidate.signals['comments']:,} comments")
        if candidate.positive_ratio is not None and candidate.rating_count > 0:
            facts.append(f"{candidate.positive_ratio:.0%} upvote ratio (source vote count {candidate.rating_count:,})")
    rates = candidate.signals.get("component_velocity_per_hour", {})
    velocity_label = "Observed change" if candidate.signals.get("velocity_basis", "").startswith("observed") else "Age-adjusted first-observation estimate"
    if candidate.source == "GitHub" and "stars" in rates:
        facts.append(f"{velocity_label}: {rates['stars']:.2f} stars/hour")
    elif candidate.source == "Reddit":
        if "post_score" in rates:
            facts.append(f"{velocity_label}: {rates['post_score']:.2f} post-score/hour")
        if "comments" in rates:
            facts.append(f"{velocity_label}: {rates['comments']:.2f} comments/hour")
    if candidate.signals.get("velocity_multiple") is not None:
        facts.append(f"{candidate.signals['velocity_multiple']:.1f}× its prior observed rate")
    if candidate.signals.get("rating_change_percentage_points") is not None:
        delta = candidate.signals["rating_change_percentage_points"]
        facts.append(f"Upvote ratio change: {delta:+.2f} percentage points since prior snapshot")
    facts.append(f"Published/updated {candidate.published.date().isoformat()} ({candidate.signals.get('date_basis', 'source post date')})")
    return facts


def trending_themes(items: list[Candidate]) -> list[str]:
    categories: dict[str, int] = {}
    techniques: dict[str, int] = {}
    patterns = {"stepwise workflows": ("step by step", "step-by-step", "phase 1"),
                "examples and few-shot guidance": ("example", "few-shot"),
                "verification and quality checks": ("verify", "checklist", "rubric", "criteria"),
                "tool-using agents": ("tool", "function call", "agent")}
    for item in items:
        categories[item.category] = categories.get(item.category, 0) + 1
        prompt_lower = item.prompt.lower()
        for label, terms in patterns.items():
            if any(term in prompt_lower for term in terms):
                techniques[label] = techniques.get(label, 0) + 1
    ranked = [(count, f"{label} — present in {count} selected prompt(s)") for label, count in categories.items()]
    ranked += [(count, f"{label} — present in {count} selected prompt(s)") for label, count in techniques.items()]
    return [value for _, value in sorted(ranked, key=lambda row: (-row[0], row[1]))[:3]]


def render(items: list[Candidate], source_status: list[str]) -> str:
    blocks = [f"LLM PROMPT RADAR\n{NOW:%Y-%m-%d}"]
    if not items:
        blocks.append(f"No prompts met the minimum quality score ({MIN_SCORE:.2f}) today.")
        themes_block = "TRENDING THEMES — WITHIN TODAY'S QUALIFYING PROMPTS\n• No themes to report; no prompts qualified."
    else:
        if len(items) < MAX_PROMPTS:
            blocks.append(f"Only {len(items)} prompt(s) qualified for today's digest after the minimum score ({MIN_SCORE:.2f}), repeat-suppression, and diversity rules; the quality floor was not lowered.")
        for i, candidate in enumerate(items, 1):
            prompt_text = candidate.prompt
            if candidate.source == "GitHub" and candidate.license_name not in {"MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "CC0-1.0", "Unlicense"}:
                prompt_text = "Full text omitted because this repository does not declare a recognized reuse license. Open the source link to review it."
            links = [safe_source_url(candidate.url)] + [safe_source_url(url) for url in candidate.sighting_urls if url != candidate.url][:3]
            links = [url for url in links if url]
            if not links:
                links = ["Source link unavailable"]
            sighting_note = "Same/near-copy sightings (not independent validation): " + ", ".join(candidate.sighting_sources or [candidate.source])
            facts = "\n".join(f"• {fact}" for fact in prompt_facts(candidate))
            resurfaced = f"\nResurfaced: {candidate.resurface_reason}" if candidate.resurface_reason else ""
            prompt_text = re.sub(r"(?i)\b(https?)://", lambda match: match.group(1) + "[:]//", prompt_text)
            prompt_text = re.sub(r"(?i)\bwww\.", "www[.]", prompt_text)
            blocks.append(clean_display(
                f"#{i} — {single_line(candidate.title, 180)}\n\nCategory: {single_line(candidate.category, 80)}\nModel: {single_line(candidate.model, 100)}\n"
                f"Source: {candidate.source}\nCreator: {single_line(candidate.author, 100)}\n\n"
                f"WHY IT SURFACED — SOURCE FACTS\n{facts}{resurfaced}\n\n"
                f"RADAR ANALYSIS — HEURISTIC, NOT LLM GENERATED\n{why_interesting(candidate)}\n\n"
                f"{sighting_note}\n\nPrompt:\n{prompt_text}\n\nSource URL(s):\n" + "\n".join(links) +
                f"\n\nConfidence: {candidate.confidence.upper()} | Quality score: {candidate.quality_score:.2f} | Composite: {candidate.score:.3f}"))
        themes_block = "TRENDING THEMES — WITHIN TODAY'S SELECTED PROMPTS\n" + "\n".join(f"• {theme}" for theme in trending_themes(items))
    if source_status:
        blocks.append("Source status: " + "; ".join(source_status))
    blocks.append(themes_block)
    return "\n\n".join(blocks)


def send_telegram(text: str) -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("RADAR_TELEGRAM_CHAT_ID", os.getenv("TELEGRAM_CHAT_ID", "")).strip()
    if not token or not chat_id:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in repository Actions secrets.")
    chunks = []
    current = ""
    for paragraph in text.split("\n\n"):
        pieces = [paragraph]
        if len(paragraph.encode("utf-16-le")) // 2 > 3800:
            pieces, segment, units = [], "", 0
            prompt_prefix = "Prompt:\n" if paragraph.startswith("Prompt:\n") else ""
            body = paragraph[len(prompt_prefix):]
            continuation = "Prompt continued:\n" if prompt_prefix else ""
            for char in body:
                char_units = len(char.encode("utf-16-le")) // 2
                prefix = prompt_prefix if not pieces else continuation
                prefix_units = len(prefix.encode("utf-16-le")) // 2
                if segment and units + char_units + prefix_units > 3700:
                    pieces.append(prefix + segment)
                    segment, units = "", 0
                    prompt_prefix = ""
                segment += char
                units += char_units
            if segment:
                pieces.append((prompt_prefix if not pieces else continuation) + segment)
        for piece in pieces:
            combined = piece if not current else current + "\n\n" + piece
            if current and len(combined.encode("utf-16-le")) // 2 > 3800:
                chunks.append(current)
                current = piece
            else:
                current = combined
    if current:
        chunks.append(current)
    for chunk in chunks:
        body = json.dumps({"chat_id": chat_id, "text": chunk, "disable_web_page_preview": True}).encode()
        request = Request(f"https://api.telegram.org/bot{token}/sendMessage", data=body,
                          headers={"Content-Type": "application/json", "User-Agent": UA}, method="POST")
        try:
            with urlopen(request, timeout=25) as response:
                result = json.loads(response.read().decode())
            if not result.get("ok"):
                raise RuntimeError("Telegram rejected a message")
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise RuntimeError(f"Telegram send failed ({type(exc).__name__})") from None


def main() -> int:
    if "--test" in sys.argv:
        send_telegram("LLM PROMPT RADAR\nTest message only. Source discovery and history updates were not run.")
        print("Sent test message; source discovery and history were skipped.")
        return 0
    history = load_history()
    registry: dict[str, SourceAdapter] = {"github": GitHubAdapter(), "reddit": RedditAdapter()}
    source_setting = os.getenv("RADAR_SOURCES", "").strip() or "github,reddit"
    requested = [name.strip().lower() for name in source_setting.split(",") if name.strip()]
    unknown = [name for name in requested if name not in registry]
    if unknown:
        raise RuntimeError("Unknown RADAR_SOURCES value(s): " + ", ".join(unknown))
    sources = [registry[name] for name in requested]
    if not sources:
        raise RuntimeError("RADAR_SOURCES must enable at least one source.")
    candidates, status = [], []
    for source in sources:
        if source.name == "Reddit" and (not os.getenv("REDDIT_CLIENT_ID", "").strip()
                                        or not os.getenv("REDDIT_CLIENT_SECRET", "").strip()):
            status.append("Reddit skipped (official API credentials not configured)")
            continue
        try:
            found = source.fetch()
            candidates.extend(found)
            status.append(f"{source.name}: {len(found)} candidates")
        except RuntimeError as exc:
            status.append(f"{source.name}: unavailable ({exc})")
            print(f"SOURCE {source.name} unavailable: {exc}", file=sys.stderr)
    accepted = []
    rejected: dict[str, int] = {}
    for candidate in candidates:
        passed, score, reason = quality_gate(candidate)
        if not passed:
            rejected[reason] = rejected.get(reason, 0) + 1
            continue
        candidate.quality_score = score
        candidate.usefulness = score
        candidate.signals["quality_filter"] = reason
        apply_historical_velocity(candidate, history)
        accepted.append(candidate)
    if rejected:
        status.append("Quality filter rejected " + str(sum(rejected.values())) + " candidate(s): "
                      + ", ".join(f"{count} {reason}" for reason, count in sorted(rejected.items())))
    leaders = deduplicate(accepted, history)
    for candidate in leaders:
        candidate.sighting_sources = candidate.sighting_sources or [candidate.source]
    chosen = choose(leaders, history["notified_clusters"], MAX_PROMPTS)
    message = render(chosen, status)
    if "--preview" in sys.argv:
        print(message)
        return 0
    update_history(history, accepted, chosen, leaders)
    send_telegram(message)
    save_history(history)
    print(f"Sent digest with {len(chosen)} qualifying prompt(s).")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
