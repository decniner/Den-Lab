"""Bounded public GETs, per-origin pacing, and robots enforcement."""
from __future__ import annotations

import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

USER_AGENT = "DenLabShoppingNotifier/1.0 (public Japan sale digest; no purchases)"
MAX_BYTES = 8 * 1024 * 1024


class SourceError(RuntimeError):
    pass


def _robot_groups(text):
    groups, agents, rules = [], [], []
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        key, value = [part.strip() for part in line.split(":", 1)]
        key = key.lower()
        if key == "user-agent":
            if rules:
                groups.append((agents, rules))
                agents, rules = [], []
            agents.append(value.lower())
        elif key in ("allow", "disallow", "crawl-delay") and agents:
            rules.append((key, value))
    if agents:
        groups.append((agents, rules))
    matched = []
    best = -1
    for agents, rules in groups:
        strength = max((0 if a == "*" else len(a) for a in agents if a == "*" or a in USER_AGENT.lower()), default=-1)
        if strength > best:
            matched, best = list(rules), strength
        elif strength == best and strength >= 0:
            matched.extend(rules)
    return matched


def robots_allowed(text: str, url: str) -> bool:
    parts = urlsplit(url)
    target = parts.path + ("?" + parts.query if parts.query else "")
    matches = []
    for kind, pattern in _robot_groups(text):
        if kind not in ("allow", "disallow") or not pattern:
            continue
        ending = "$" if pattern.endswith("$") else ""
        pattern_body = pattern[:-1] if ending else pattern
        expression = "^" + re.escape(pattern_body).replace(r"\*", ".*") + ending
        if re.search(expression, target):
            matches.append((len(pattern_body.replace("*", "")), kind == "allow"))
    return max(matches)[1] if matches else True


class _RedirectGuard(HTTPRedirectHandler):
    def __init__(self, client):
        self.client = client

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        original = urlsplit(req.full_url)
        destination = urlsplit(newurl)
        if (original.scheme, original.netloc) != (destination.scheme, destination.netloc):
            raise SourceError("cross_origin_redirect")
        origin = f"{destination.scheme}://{destination.netloc}"
        if original.path == "/robots.txt" and destination.path != "/robots.txt":
            raise SourceError("robots_redirect_not_supported")
        if origin in self.client.robots and not robots_allowed(self.client.robots[origin], newurl):
            raise SourceError("robots_disallowed_redirect")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class HttpClient:
    def __init__(self, timeout=15, attempts=3, delay=1.0, opener=None, sleep=time.sleep, clock=time.monotonic, deadline=None):
        self.timeout, self.attempts, self.delay = timeout, attempts, delay
        self.sleep, self.clock = sleep, clock
        self.deadline = deadline
        self.robots, self.last_request, self.crawl_delays = {}, {}, {}
        self.opener = opener or build_opener(_RedirectGuard(self)).open

    def _remaining(self):
        remaining = float("inf") if self.deadline is None else self.deadline - self.clock()
        if remaining <= 0:
            raise SourceError("source_time_budget_exhausted")
        return remaining

    def _pause(self, seconds):
        self.sleep(min(max(0, seconds), self._remaining()))
        self._remaining()

    def _read_body(self, response, request_deadline):
        def time_left():
            remaining = min(self._remaining(), request_deadline - self.clock())
            if remaining <= 0:
                raise TimeoutError()
            return remaining
        if not hasattr(response, "read1"):
            time_left()
            body = response.read(MAX_BYTES + 1)
            time_left()
            return body
        blocks, size = [], 0
        while size <= MAX_BYTES:
            remaining = time_left()
            # urllib has no public per-read timeout setter. The HTTPResponse socket is
            # optional (test/custom transports); total-clock checks also guard each read.
            sock = getattr(getattr(getattr(response, "fp", None), "raw", None), "_sock", None)
            if sock is not None:
                sock.settimeout(remaining)
            block = response.read1(min(65536, MAX_BYTES + 1 - size))
            time_left()
            if not block:
                break
            blocks.append(block)
            size += len(block)
        return b"".join(blocks)

    def _raw(self, url):
        parts = urlsplit(url)
        if parts.scheme != "https" or not parts.hostname or parts.username or parts.password:
            raise SourceError("only_public_https_urls_supported")
        origin = f"{parts.scheme}://{parts.netloc}"
        for attempt in range(self.attempts):
            delay = max(self.delay, self.crawl_delays.get(origin, 0))
            if origin in self.last_request:
                self._pause(max(0, delay - (self.clock() - self.last_request[origin])))
            self.last_request[origin] = self.clock()
            try:
                req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html, application/json, text/plain"})
                request_timeout = min(self.timeout, self._remaining())
                request_deadline = self.clock() + request_timeout
                with self.opener(req, timeout=request_timeout) as response:
                    if urlsplit(response.geturl()).netloc != parts.netloc:
                        raise SourceError("cross_origin_redirect")
                    body = self._read_body(response, request_deadline)
                    if len(body) > MAX_BYTES:
                        raise SourceError("response_size_limit")
                    charset = getattr(response.headers, "get_content_charset", lambda: None)() or "utf-8"
                    return body.decode(charset, errors="replace")
            except HTTPError as exc:
                status = exc.code
                try:
                    retry_after = float(exc.headers.get("Retry-After", 2 ** attempt))
                except (ValueError, TypeError):
                    retry_after = 2 ** attempt
                exc.close()
                if status not in (429, 500, 502, 503, 504) or attempt == self.attempts - 1:
                    raise SourceError(f"HTTP {status}") from None
                self._pause(min(8, max(0, retry_after)))
            except (URLError, TimeoutError, OSError) as exc:
                if attempt == self.attempts - 1:
                    raise SourceError(type(exc).__name__) from None
                self._pause(min(8, 2 ** attempt))
        raise SourceError("request_failed")

    def get(self, url: str) -> str:
        parts = urlsplit(url)
        origin = f"{parts.scheme}://{parts.netloc}"
        if parts.path == "/robots.txt":
            return self._raw(url)
        if origin not in self.robots:
            try:
                rules = self._raw(origin + "/robots.txt")
            except SourceError as exc:
                if str(exc) != "HTTP 404":
                    raise
                rules = ""  # Absence of robots.txt imposes no robots restrictions.
            if "<html" in rules.casefold() or "<!doctype html" in rules.casefold():
                raise SourceError("invalid_robots_response")
            self.robots[origin] = rules
            for kind, value in _robot_groups(rules):
                if kind == "crawl-delay":
                    try:
                        self.crawl_delays[origin] = max(self.crawl_delays.get(origin, 0), float(value))
                    except ValueError:
                        raise SourceError("invalid_crawl_delay") from None
        if not robots_allowed(self.robots[origin], url):
            raise SourceError("robots_disallowed")
        return self._raw(url)
