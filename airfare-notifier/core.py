"""Date scope, complete nonstop itineraries, and source-listed fare messages."""
from __future__ import annotations

import calendar
import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation, ROUND_CEILING
from urllib.parse import urlsplit


@dataclass(frozen=True)
class Config:
    departure_months_min: int = 6
    departure_months_max: int = 12
    nights_min: int = 9
    nights_max: int = 20
    threshold_jpy: int = 25000
    samples_per_day: int = 6
    daily_summary: bool = False
    request_timeout_seconds: int = 45
    request_attempts: int = 2

    def __post_init__(self):
        bounds = {'departure_months_min': (0, 24), 'departure_months_max': (0, 24),
                  'nights_min': (1, 60), 'nights_max': (1, 60), 'threshold_jpy': (1, 1000000),
                  'samples_per_day': (1, 10), 'request_timeout_seconds': (5, 60), 'request_attempts': (1, 3)}
        for field, (low, high) in bounds.items():
            value = getattr(self, field)
            if type(value) is not int or not low <= value <= high:
                raise ValueError(f'Invalid configuration: {field}')
        if self.departure_months_min > self.departure_months_max or self.nights_min > self.nights_max:
            raise ValueError('Configuration ranges are reversed')
        if type(self.daily_summary) is not bool: raise ValueError('daily_summary must be boolean')


def add_months(day: date, months: int) -> date:
    year, month = divmod(day.year * 12 + day.month - 1 + months, 12)
    month += 1
    return date(year, month, min(day.day, calendar.monthrange(year, month)[1]))


def search_dates(cfg: Config, today: date) -> list[tuple[date, date]]:
    first, last = add_months(today, cfg.departure_months_min), add_months(today, cfg.departure_months_max)
    stays = cfg.nights_max - cfg.nights_min + 1
    size = ((last - first).days + 1) * stays
    count = min(cfg.samples_per_day, size)
    # Spread across the whole window; rotate within each evenly spaced band daily.
    indexes = [(i * size // count + today.toordinal() * 17) % size for i in range(count)]
    return [(first + timedelta(days=index // stays),
             first + timedelta(days=index // stays + cfg.nights_min + index % stays)) for index in indexes]


@dataclass(frozen=True)
class Fare:
    raw: dict
    price: Decimal
    nights: int


def valid(raw: dict, cfg: Config, today: date) -> Fare | None:
    try:
        if raw.get('currency') != 'JPY' or isinstance(raw['price'], bool): return None
        price = Decimal(str(raw['price']))
        if not price.is_finite() or price <= 0: return None
        for field in ('member_only', 'from_price', 'requires_membership'):
            if raw.get(field): return None
        if raw.get('available') is False or raw.get('itinerary_complete') is False: return None
        if raw.get('price_type', 'round_trip_total') != 'round_trip_total': return None
        if raw.get('is_direct') is not True or type(raw.get('stops')) is not int or raw['stops'] != 0: return None
        tags = [str(tag).lower() for tag in raw.get('tags', [])]
        if any(any(word in tag for word in ('member', 'from_price', 'self_transfer', 'separate_ticket', 'unavailable')) for tag in tags): return None
        for key, origin, destination in [('outbound', 'NRT', 'MNL'), ('return', 'MNL', 'NRT')]:
            segment = raw[key]
            if segment['departure'] != origin or segment['arrival'] != destination: return None
            if type(segment.get('stops')) is not int or segment['stops'] != 0: return None
            if segment.get('stopovers') or segment.get('layovers'): return None
            if len(segment['legs']) != 1: return None
            leg = segment['legs'][0]
            if leg['departure'] != origin or leg['arrival'] != destination: return None
            if leg.get('stops', 0) != 0 or leg.get('technical_stops') or leg.get('stopovers'): return None
            if not leg.get('flight_number') or not leg.get('carrier'): return None
            departure = datetime.fromisoformat(segment['departure_date'] + 'T' + segment['departure_time'])
            arrival = datetime.fromisoformat(segment['arrival_date'] + 'T' + segment['arrival_time'])
            # Convert local wall times to UTC without requiring a system tz database.
            elapsed = arrival - departure + timedelta(hours=1 if origin == 'NRT' else -1)
            if elapsed <= timedelta(0) or elapsed > timedelta(hours=10): return None
        dep = date.fromisoformat(raw['outbound']['departure_date'])
        arrive = date.fromisoformat(raw['outbound']['arrival_date'])
        ret = date.fromisoformat(raw['return']['departure_date'])
        if not add_months(today, cfg.departure_months_min) <= dep <= add_months(today, cfg.departure_months_max): return None
        nights = (ret - arrive).days
        if not cfg.nights_min <= nights <= cfg.nights_max: return None
        url = urlsplit(raw['booking_url'])
        if url.scheme != 'https' or not url.hostname or url.username or url.password: return None
        return Fare(raw, price, nights)
    except (KeyError, TypeError, ValueError, InvalidOperation, AttributeError, OverflowError):
        return None


def select(results: list, cfg: Config, today: date) -> Fare | None:
    valid_fares = [candidate for raw in results if (candidate := valid(raw, cfg, today))]
    return min(valid_fares, key=lambda candidate: candidate.price, default=None)


def clean(value, limit=250):
    return ' '.join(str(value).split())[:limit]


def summary(fare: Fare | None, cfg: Config, now: datetime, errors: list[str], checked: int) -> str:
    if fare:
        heading = '🎯 Target price found.' if fare.price <= cfg.threshold_jpy else 'Lowest fare found — above budget'
    else:
        heading = 'Search failed; no fare can be reported.' if errors else 'No verified fare found today.'
    lines = ['✈  DEN–LAB  /  AIRFARE', 'NARITA  ⇄  MANILA', '', heading]
    if fare:
        raw = fare.raw
        airlines = sorted({leg['carrier'] for side in ('outbound', 'return') for leg in raw[side]['legs']})
        lines.extend([f'¥{fare.price:,.2f} JPY · round-trip total',
                      f'{fare.nights} nights · 1 adult · economy · both flights nonstop'])
        if fare.price > cfg.threshold_jpy:
            excess = (fare.price - cfg.threshold_jpy).to_integral_value(rounding=ROUND_CEILING)
            lines.append(f'Above ¥{cfg.threshold_jpy:,} budget by ¥{excess:,} (rounded up).')
        else:
            lines.append(f'Within your ¥{cfg.threshold_jpy:,} budget')
        lines.extend(['', '──────────────', '', 'Airline(s): ' + clean(', '.join(airlines), 120)])
        for side, label, origin_zone, destination_zone in [('outbound', 'Outbound', 'JST', 'PHT'), ('return', 'Return', 'PHT', 'JST')]:
            s = raw[side]
            lines.extend(['', f'{label.upper()}  ·  {clean(s["legs"][0]["flight_number"], 30)}',
                          f'{s["departure"]}  {s["departure_date"]} · {s["departure_time"]} {origin_zone}',
                          f'  → {s["arrival"]}  {s["arrival_date"]} · {s["arrival_time"]} {destination_zone}'])
        lines.extend(['', '──────────────', '', 'BAGGAGE & FARE NOTES',
                      f'Baggage (source-listed, unverified): {clean(raw.get("baggage") or "Not supplied")}',
                      'Confirm baggage allowance and fare restrictions with the seller.',
                      'Additional costs not independently checked; optional extras not added.',
                      '', 'BOOKING', 'Source: OctoTrip / ' + clean(raw.get('gate', 'seller not supplied'), 80), raw['booking_url'], '',
                      'Source availability and price refreshed before this alert; supplier checkout not verified.'])
    lines.extend(['', 'SEARCH DETAILS', 'cheapest found among checked sources (OctoTrip; limited date sample)',
                  f'Scope: {add_months(now.date(), cfg.departure_months_min)}–{add_months(now.date(), cfg.departure_months_max)} departures; '
                  f'{cfg.nights_min}–{cfg.nights_max} nights; {checked} date pairs checked.'])
    if errors: lines.append('Coverage incomplete — ' + '; '.join(clean(e, 100) for e in sorted(set(errors))))
    lines.append(f'Verification timestamp: {now.isoformat(timespec="seconds")} · Asia/Tokyo')
    lines.append('Booking links may expire in about 15 minutes. No reservations made.')
    return '\n'.join(lines)
