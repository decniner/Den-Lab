import datetime as dt
import hashlib
import html.parser
import json
import re
import time
from urllib.request import Request, urlopen
from urllib.parse import urlparse

from .core import Failure, canonical

def normalize(text):
    return " ".join(text.split())

class TextParser(html.parser.HTMLParser):
    def __init__(self): super().__init__(); self.parts = []; self.hidden = 0
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"): self.hidden += 1
    def handle_endtag(self, tag):
        if tag in ("script", "style"): self.hidden = max(0, self.hidden - 1)
    def handle_data(self, data):
        if not self.hidden: self.parts.append(data)

def fetch_text(url):
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username:
        raise Failure("Sources must be public HTTPS URLs without embedded credentials.")
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": "NewsEdition/1.0"}), timeout=20) as response:
                final = urlparse(response.url)
                if final.scheme != "https" or final.hostname != parsed.hostname:
                    raise Failure("Source redirected outside its allowed HTTPS host; review the canonical URL.")
                raw = response.read(2_000_001)
                if len(raw) > 2_000_000: raise Failure("Source exceeds 2 MB limit.")
                parser = TextParser(); parser.feed(raw.decode("utf-8", errors="replace"))
                text = normalize(" ".join(parser.parts))
                if not text: raise Failure("Source has no readable evidence.")
                return text
        except Failure: raise
        except (OSError, TimeoutError) as exc:
            if attempt == 2: raise Failure("Source fetch failed after 3 attempts; check URL and connectivity.") from exc
            time.sleep(2 ** attempt)

def verify(stories, at, max_age_hours=48):
    if not isinstance(stories, list) or not stories: raise Failure("News must be a nonempty story list.")
    ids, titles, claims_seen, urls_seen = set(), set(), set(), set()
    try:
        for story in stories:
            identifier = story["id"]; title = normalize(story["title"]).casefold()
            published = dt.datetime.fromisoformat(story["published_at"].replace("Z", "+00:00"))
            if published.tzinfo is None: raise Failure("Publication date must include a timezone.")
            age = (at - published).total_seconds()
            if age < -300 or age > max_age_hours * 3600: raise Failure("Stale or future-dated news.")
            if not identifier or not title or identifier in ids or title in titles:
                raise Failure("Duplicate story ID or title.")
            ids.add(identifier); titles.add(title)
            sources = story["sources"]
            if not sources or not story["claims"]: raise Failure("Story missing sources or claims.")
            story_urls = set()
            for source in sources:
                url = source["url"]
                if urlparse(url).scheme != "https" or not source.get("text"):
                    raise Failure("Source URL or evidence missing.")
                story_urls.add(url)
            if story_urls & urls_seen: raise Failure("Duplicate source story across edition.")
            urls_seen.update(story_urls)
            for claim in story["claims"]:
                index = claim["source"]; text = normalize(claim["text"])
                if type(index) is not int or index < 0 or index >= len(sources):
                    raise Failure("Claim source index invalid.")
                if len(text) < 10 or len(text) > 500 or text not in normalize(sources[index]["text"]):
                    raise Failure("Unsupported claim: exact source extract required (10–500 characters).")
                if text.casefold() in claims_seen: raise Failure("Duplicate story claim.")
                claims_seen.add(text.casefold())
    except (KeyError, TypeError, ValueError, AttributeError, IndexError) as exc:
        raise Failure("Malformed news input: require IDs, dated stories, sources and supported claims.") from exc
    return stories

def fetch_and_verify(data, at, allowed_hosts, fixture=False):
    if not isinstance(data, dict) or not isinstance(data.get("stories"), list):
        raise Failure("Input must contain a stories array.")
    if not fixture and (not data.get("reviewed_by") or not data.get("reviewed_at")):
        raise Failure("Live input needs reviewed_by and reviewed_at after human factual/source review.")
    if not fixture:
        if data.get("fixture_only"): raise Failure("Fixture input cannot be relabelled as live news.")
        try:
            reviewed = dt.datetime.fromisoformat(data["reviewed_at"].replace("Z", "+00:00"))
            if reviewed.tzinfo is None or (at - reviewed).total_seconds() < -300 or (at - reviewed).total_seconds() > 48 * 3600:
                raise ValueError()
            if not isinstance(data["reviewed_by"], str) or "REPLACE" in data["reviewed_by"]: raise ValueError()
        except (ValueError, TypeError, AttributeError) as exc:
            raise Failure("Human review must have a named reviewer and a timezone-aware timestamp within 48 hours.") from exc
    for story in data["stories"]:
        for source in story.get("sources", []):
            if not fixture:
                if urlparse(source["url"]).hostname not in allowed_hosts:
                    raise Failure("Source host is outside the configured allowlist.")
                source["text"] = fetch_text(source["url"])
            source["sha256"] = hashlib.sha256(source.get("text", "").encode()).hexdigest()
            source["fetched_at"] = at.isoformat()
    return verify(data["stories"], at)

def generate_script(stories):
    return {"schema_version": 1, "segments": [
        {"text": normalize(claim["text"]), "story_id": story["id"], "source": claim["source"]}
        for story in stories for claim in story["claims"]]}

def validate_script(script, stories):
    expected = generate_script(stories)
    if script != expected:
        raise Failure("Malformed or unsupported script: only the verified attributed extracts are allowed.")
    return script
