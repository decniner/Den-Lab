"""Daily, evidence-based discovery of useful public LLM prompts."""

from __future__ import annotations

import base64
import json
import math
import os
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


API = "https://api.github.com"
NOW = datetime.now(timezone.utc)
WEIGHTS = {"engagement": .30, "trending": .25, "positive": .20, "recency": .15, "usefulness": .10}
try:
    MIN_SCORE = max(0.0, min(1.0, float(os.getenv("RADAR_MIN_SCORE", ".48"))))
except ValueError:
    MIN_SCORE = .48
MAX_PROMPT_CHARS = 3500
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
    tags = (("Coding", ("code", "coding", "developer", "programming", "software")),
            ("Research", ("research", "paper", "academic", "literature")),
            ("Writing", ("writing", "writer", "editor", "copywriting")),
            ("Learning", ("learn", "tutor", "education", "study")),
            ("Agents & automation", ("agent", "automation", "workflow", "tool use")),
            ("Productivity", ("productivity", "planning", "meeting", "business")),
            ("Image generation", ("image", "visual", "art", "midjourney", "stable diffusion")))
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
                velocity=stars / age_days, positive_ratio=None, rating_count=0,
                usefulness=useful_score(title, prompt, readme), category=category_for(title + " " + prompt),
                model=model_for(title + " " + prompt + " " + readme), license_name=license_name,
                signals={"stars": stars, "stars_per_day_since_repo_creation": round(stars / age_days, 3),
                         "repository": full_name, "license": license_name or "not declared",
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
                age_days = max(1.0, (NOW - created).total_seconds() / 86400)
                up_ratio = post.get("upvote_ratio")
                score = int(post.get("score", 0))
                comments = int(post.get("num_comments", 0))
                results_url = "https://www.reddit.com" + post.get("permalink", "")
                title = post.get("title", "Untitled prompt")
                candidates.append(Candidate(
                    source=self.name, title=title[:180], url=results_url,
                    author=post.get("author", "Unknown"), published=created, prompt=body[:MAX_PROMPT_CHARS],
                    engagement=max(0, score) + comments * 2,
                    velocity=max(0, score) / age_days,
                    positive_ratio=float(up_ratio) if up_ratio is not None else None,
                    rating_count=int(post.get("ups", 0)) + int(post.get("downs", 0)), usefulness=useful_score(title, body, ""),
                    category=category_for(title + " " + body), model=model_for(title + " " + body),
                    signals={"upvotes_score": score, "comments": comments,
                             "upvote_ratio": up_ratio, "age_hours": round(age_days * 24, 1)},
                ))
        return candidates


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
        override = json.loads(os.getenv("RADAR_WEIGHTS", "{}"))
        weights.update({k: float(v) for k, v in override.items() if k in weights and float(v) >= 0})
    except (ValueError, TypeError):
        print("WARNING invalid RADAR_WEIGHTS; using defaults", file=sys.stderr)
    weight_total = sum(weights.values()) or 1.0
    weights = {k: v / weight_total for k, v in weights.items()}

    for group in by_source.values():
        metrics = {
            "engagement": percentile([math.log1p(max(0, c.engagement)) for c in group]),
            "trending": percentile([math.log1p(max(0, c.velocity)) for c in group]),
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
            candidate.score = sum(weights[key] * scores[key] for key in weights)
            volume = candidate.engagement
            candidate.confidence = "High" if volume >= 500 else "Medium" if volume >= 80 else "Low"
            candidate.signals.update({"normalized_scores": {k: round(v, 3) for k, v in scores.items()},
                                      "composite_score": round(candidate.score, 3)})
    return sorted(candidates, key=lambda c: (-c.score, c.url))


def why_selected(candidate: Candidate) -> str:
    lead = "strong relative community engagement" if candidate.scores.get("engagement", 0) >= .75 else "a timely, practical prompt"
    if candidate.scores.get("trending", 0) >= .75:
        lead += " and strong popularity relative to repository age"
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
    return "; ".join(features).capitalize() + "."


def choose(candidates: list[Candidate], limit: int = 5) -> list[Candidate]:
    # Avoid one source taking over the digest; preserve high-quality threshold.
    selected, source_counts = [], {}
    for item in rank(candidates):
        if item.score < MIN_SCORE or source_counts.get(item.source, 0) >= 3:
            continue
        selected.append(item)
        source_counts[item.source] = source_counts.get(item.source, 0) + 1
        if len(selected) == limit:
            break
    return selected


def render(items: list[Candidate], source_status: list[str]) -> str:
    now = NOW.strftime("%Y-%m-%d")
    if not items:
        lines = [f"LLM Prompt Radar — {now}", "No prompts met the quality threshold today."]
    else:
        lines = [f"LLM Prompt Radar — {now}", f"Selected {len(items)} of up to 5 prompts."]
        if len(items) < 5:
            lines.append(f"Only {len(items)} prompts met the minimum quality threshold ({MIN_SCORE:.2f}); quality was not lowered.")
        for i, c in enumerate(items, 1):
            prompt_text = c.prompt
            if c.source == "GitHub" and c.license_name not in {"MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "CC0-1.0", "Unlicense"}:
                prompt_text = "Full text omitted because this repository does not declare a recognized reuse license. Open the source link to review it."
            rating = "not provided" if c.positive_ratio is None or c.rating_count <= 0 else f"{c.positive_ratio:.0%} positive proxy ({c.rating_count} votes; confidence-adjusted in score)"
            date_basis = c.signals.get("date_basis", "source post publication date")
            lines.extend(["", f"{i}. {c.title}", f"Prompt: {prompt_text}", f"Source: {c.source} — {c.url}",
                          f"Creator: {c.author} | Model: {c.model} | Category: {c.category}",
                          f"Date: {c.published.date().isoformat()} ({date_basis}) | Rating/reviews: {rating}",
                          f"Engagement metrics: {json.dumps(c.signals, ensure_ascii=False)}",
                          f"Why selected: {why_selected(c)}", f"Why interesting: {why_interesting(c)}",
                          f"Confidence: {c.confidence} | Score: {c.score:.3f}"])
    lines.extend(["", "Sources: " + ("; ".join(source_status) or "none available")])
    return "\n".join(lines)


def send_telegram(text: str) -> None:
    token, chat_id = os.getenv("TELEGRAM_BOT_TOKEN", "").strip(), os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in repository Actions secrets.")
    chunks = [text[i:i + 3900] for i in range(0, len(text), 3900)]
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
    sources: list[SourceAdapter] = [GitHubAdapter(), RedditAdapter()]
    candidates, status = [], []
    for source in sources:
        try:
            found = source.fetch()
            candidates.extend(found)
            status.append(f"{source.name}: {len(found)} candidates")
        except RuntimeError as exc:
            status.append(f"{source.name}: unavailable ({exc})")
            print(f"SOURCE {source.name} unavailable: {exc}", file=sys.stderr)
    chosen = choose(candidates)
    message = render(chosen, status)
    if "--preview" in sys.argv:
        print(message)
        return 0
    send_telegram(message)
    print(f"Sent digest with {len(chosen)} qualifying prompt(s).")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
