"""Notify Telegram when Netflix Japan's official release page lists titles for today."""

from __future__ import annotations

import json
import os
import re
import sys
from dataclasses import asdict, dataclass
from datetime import date, datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote_plus, urlencode, urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


BASE_URL = "https://about.netflix.com/ja/new-to-watch"
STATE_PATH = Path(__file__).with_name("state.json")
TIMEZONE = ZoneInfo("Asia/Tokyo")
DATE_RE = re.compile(r"(20\d{2})\s*[/年.-]\s*(\d{1,2})\s*[/月.-]\s*(\d{1,2})")
TITLE_ID_RE = re.compile(r"/(?:title|watch)/(\d+)(?:[/?#]|$)")
USER_AGENT = "DenLabNetflixNotifier/1.0 (personal release tracker)"


@dataclass(frozen=True)
class Title:
    title_id: str
    name: str
    release_date: str
    url: str


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str]] = []
        self._href: str | None = None
        self._parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "a":
            self._href = dict(attrs).get("href")
            self._parts = []

    def handle_data(self, data: str) -> None:
        if self._href is not None:
            self._parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._href is not None:
            self.links.append((self._href, " ".join(self._parts)))
            self._href = None
            self._parts = []


def fetch(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urlopen(request, timeout=30) as response:
            return response.read().decode("utf-8", errors="replace")
    except (HTTPError, URLError, TimeoutError) as exc:
        raise RuntimeError(f"Could not read Netflix's release page ({type(exc).__name__}).") from None


def extract_titles(page: str) -> list[Title]:
    parser = LinkParser()
    parser.feed(page)
    titles: dict[str, Title] = {}

    for href, raw_text in parser.links:
        if not href or "netflix.com" not in href.lower():
            continue
        raw_text = re.sub(r"[\u200b-\u200f\ufeff\u2060]", "", raw_text)
        if re.search(r"/game(?:/|\?|$)", urlparse(href).path, re.IGNORECASE):
            continue
        id_match = TITLE_ID_RE.search(urlparse(href).path)
        date_match = DATE_RE.search(raw_text)
        if not id_match or not date_match:
            continue

        year, month, day = (int(part) for part in date_match.groups())
        try:
            release_date = date(year, month, day).isoformat()
        except ValueError:
            continue

        name = DATE_RE.sub("", raw_text, count=1)
        name = re.sub(r"Netflix\s*で\s*観る\s*→?|Watch\s+on\s+Netflix", "", name, flags=re.IGNORECASE)
        name = " ".join(name.split()).strip(" ·|–—-→")
        if not name:
            continue

        title_id = id_match.group(1)
        titles[title_id] = Title(
            title_id=title_id,
            name=name,
            release_date=release_date,
            url=href,
        )

    return list(titles.values())


def get_catalog() -> list[Title]:
    # Netflix's page currently exposes three pages of dated releases.
    found: dict[str, Title] = {}
    for page_number in range(1, 4):
        suffix = "" if page_number == 1 else f"?page={page_number}"
        for title in extract_titles(fetch(BASE_URL + suffix)):
            found[title.title_id] = title

    if not found:
        raise RuntimeError("No dated Netflix titles were found; leaving the saved state untouched.")
    return sorted(found.values(), key=lambda title: (title.release_date, title.name.casefold()))


def load_state() -> dict:
    try:
        state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        state = {}
    return {
        "initialized": bool(state.get("initialized", False)),
        "seen_ids": set(state.get("seen_ids", [])),
    }


def save_state(state: dict) -> None:
    serializable = {
        "initialized": state["initialized"],
        "seen_ids": sorted(state["seen_ids"]),
        "updated_at": datetime.now(TIMEZONE).isoformat(timespec="seconds"),
    }
    STATE_PATH.write_text(json.dumps(serializable, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def send_telegram(text: str) -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        raise RuntimeError("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in the repository Actions secrets.")

    body = json.dumps({"chat_id": chat_id, "text": text, "disable_web_page_preview": True}).encode("utf-8")
    request = Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
        method="POST",
    )
    try:
        with urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Telegram send failed ({type(exc).__name__}); check the bot token and chat ID.") from None
    if not result.get("ok"):
        raise RuntimeError("Telegram rejected the message; check the bot token and chat ID.")


def trailer_url(title: Title) -> str:
    query = f"{title.name} Netflix official trailer"
    api_key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        return f"https://www.youtube.com/results?search_query={quote_plus(query)}"

    params = urlencode({
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 5,
        "regionCode": "JP",
    })
    request = Request(
        f"https://www.googleapis.com/youtube/v3/search?{params}",
        headers={"User-Agent": USER_AGENT, "x-goog-api-key": api_key},
    )
    try:
        with urlopen(request, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"WARNING: YouTube lookup unavailable ({type(exc).__name__}); using a search link.")
        return f"https://www.youtube.com/results?search_query={quote_plus(query)}"

    normalized_name = " ".join(title.name.casefold().split())
    for item in result.get("items", []):
        snippet = item.get("snippet", {})
        video_title = " ".join(snippet.get("title", "").casefold().split())
        channel = snippet.get("channelTitle", "").casefold()
        video_id = item.get("id", {}).get("videoId")
        is_trailer = any(word in video_title for word in ("trailer", "teaser", "予告", "特報"))
        if video_id and "netflix" in channel and is_trailer and normalized_name in video_title:
            return f"https://www.youtube.com/watch?v={video_id}"

    return f"https://www.youtube.com/results?search_query={quote_plus(query)}"


def main() -> int:
    if "--test" in sys.argv:
        today = datetime.now(TIMEZONE).date()
        titles = get_catalog()
        sample = min(
            titles,
            key=lambda title: abs((date.fromisoformat(title.release_date) - today).days),
        )
        trailer = trailer_url(sample)
        trailer_kind = "matched Netflix-channel video" if "youtube.com/watch?v=" in trailer else "YouTube search link"
        message = "\n".join((
            "🧪 Netflix notifier test — history unchanged",
            f"Sample release: {sample.name} ({sample.release_date})",
            f"Netflix: {sample.url}",
            f"Trailer: {trailer}",
        ))
        send_telegram(message)
        print(f"Test message sent for {sample.name}; trailer result: {trailer_kind}.")
        return 0

    today = datetime.now(TIMEZONE).date()
    titles = get_catalog()
    state = load_state()
    seen: set[str] = state["seen_ids"]

    if state["initialized"]:
        new_titles = [title for title in titles if title.release_date <= today.isoformat() and title.title_id not in seen]
    else:
        # On the first run, avoid a backlog; send only titles released today.
        new_titles = [title for title in titles if title.release_date == today.isoformat()]
        state["initialized"] = True

    seen.update(title.title_id for title in titles if title.release_date <= today.isoformat())

    if new_titles:
        lines = [f"🎬 New on Netflix Japan — {today.isoformat()}", ""]
        for title in new_titles:
            lines.extend((f"• {title.name}", f"Netflix: {title.url}", f"Trailer: {trailer_url(title)}", ""))
        send_telegram("\n".join(lines).strip())
        print(f"Sent {len(new_titles)} new title(s).")
    else:
        print("No new titles for today.")

    state["seen_ids"] = seen
    save_state(state)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
