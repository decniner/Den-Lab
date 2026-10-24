window.TADAIMA_DATA = {
  "site": {
    "name": "Tadaima!",
    "nameJa": "ただいま！",
    "edition": "Machida",
    "editionJa": "町田",
    "researchedOn": "2026-10-23",
    "area": "Machida City, Tokyo",
    "areaJa": "東京都町田市"
  },
  "defaults": {
    "budgetMan": 5000,
    "maxWalkMin": 15
  },
  "benchmarks": {
    "landPerTsuboManByStation": {
      "Aihara": 40,
      "Machida": 95,
      "Minami-Machida Grandberry Park": 85,
      "Naruse": 77,
      "Suzukakedai": 80,
      "Tamagawagakuen-mae": 62,
      "Tsukushino": 75,
      "Tsurukawa": 55
    },
    "note": "Land benchmarks: residential ¥/tsubo by station, adjusted from MLIT transactions via Utinokati (multi-year) and 2026 official points (Tochidai/Totinokati): Machida ~95 — NOT the Tochidai station official average of ~181 (commercial-mixed; Haramachida all-use prints 527, the top commercial point 1,028) and NOT the raw ~74 catchment average either (a 20-minute average walk, sprawl-dragged); 95 is the residential ≤15-minute level between the transacted catchment and the central residential official points (116–133). Naruse ~77 (regression 76.8; weighted 2023–2025 ≈78; official 69.4; a 2026 year-to-date print rests on exactly one deal). Suzukakedai ~80 — a deliberate midpoint: the transaction and official series diverge by 25–30 points (101 single-year, composition-skewed, vs 68.6 official) and the gap is unresolved; flagged to revisit first at the next research pass. Tsukushino ~75 (multi-year transactions 68–80; official 71.6–79.4; a 2025 Q1 print of 132 is small-sample noise). Minami-Machida Grandberry Park ~85 (raw ~95 is mechanically inflated by shrinking lot sizes; official 63.9–77.7 lags the redeveloped station front; Tsuruma deals at 79–93 support the premium). Tamagawagakuen-mae ~62 (weighted transactions ≈61.5; a 2026 print rests on one deal). Tsurukawa ~55 (the raw ~51 catchment includes the Onoji/Nozuta urbanisation-control fringe at 27–36; in-zone official residential ≈54–55). Aihara ~40, LOW confidence (2–11 deals a year with ±50% swings; the raw in-zone figure of ~37 is dragged by adjustment-area and 93-tsubo-average lots; the official station average of ~44 is the tell). Walk bands apply the observed gradient: −10% by a 10-minute walk at Tamagawagakuen-mae, −16 to −21% elsewhere — never Tachikawa's steep band. Used houses transacted at about ¥130万/tsubo city-wide (floor-area basis): the centre (Morino/Haramachida/Nakamachi) ~160, the Kanamori belt south ~148, Naruse ~140 (proxy, flagged), Tamagawagakuen ~128, Honmachida ~125, Tsurukawa ~117, the Kanai fringe ~111; age curve ×0.83 at 10 years, ×0.70 at 20, ×0.60 at 30. Official residential land prices rose +3.0% in the 2026 公示地価 survey — rising, centre-led, fringe flat. Data integrity note: these figures were re-verified against Machida's own portal area (city code 13209) during research after an early pass mixed in another city's data and was discarded."
  },
  "properties": [
    {
      "id": "h01",
      "type": "house-new",
      "district": "Tamagawagakuen 3",
      "districtJa": "玉川学園3丁目",
      "title": "New 3LDK (2 units) — completed and move-in ready, parking for 2",
      "priceMan": 4499,
      "priceFrom": false,
      "landM2": 117.07,
      "buildingM2": 91.66,
      "layout": "3LDK",
      "station": "Tamagawagakuen-mae",
      "stationJa": "玉川学園前",
      "line": "Odakyu Odawara Line",
      "lineJa": "小田急小田原線",
      "walkMin": 13,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Completed, immediate move-in possible",
        "Parking for 2 cars; quiet residential street in Tamagawagakuen"
      ],
      "cautions": [
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/bh/special/6004/area_tokyo/13209/028.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h02",
      "type": "house-used",
      "district": "Ogawa 2",
      "districtJa": "小川2丁目",
      "title": "Used 2LDK (1975) — cheapest in the set, 9 min to Naruse",
      "priceMan": 2295,
      "priceFrom": false,
      "landM2": 91.37,
      "buildingM2": 49.66,
      "layout": "2LDK",
      "station": "Naruse",
      "stationJa": "成瀬",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 9,
      "built": "Aug 1975",
      "ageYears": 51,
      "highlights": [
        "Cheapest house in this collection; vacant, immediate handover",
        "Also 16 min from Tsukushino (Tokyu Den-en-toshi) — two lines usable"
      ],
      "cautions": [
        "Built Aug 1975 — pre-1981 seismic standard",
        "Small 49.7m2 building",
        "Seller's contract-nonconformity liability is waived (契約不適合責任免責) per the listing page; no parking space; LP gas, not city gas"
      ],
      "source": {
        "name": "OCN不動産",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/13209/030Z21814595/129388001/x1030Z21814595.html",
        "verified": "detail",
        "infoDate": "2026-10-23"
      },
      "majorCautions": 1
    },
    {
      "id": "h03",
      "type": "house-used",
      "district": "Ogawa 2",
      "districtJa": "小川2丁目",
      "title": "Used 3LDK (1995) — shortest walk here, 7 min to Naruse",
      "priceMan": 3850,
      "priceFrom": false,
      "landM2": 106.83,
      "buildingM2": 83.86,
      "layout": "3LDK",
      "station": "Naruse",
      "stationJa": "成瀬",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 7,
      "built": "Nov 1995",
      "ageYears": 30,
      "highlights": [
        "Shortest walk in this collection (7 min)",
        "Balanced 83.9m2 house on a 106.8m2 plot"
      ],
      "cautions": [
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/special/3016/ensen/177/2177100.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h04",
      "type": "house-used",
      "district": "Takagasaka 7",
      "districtJa": "高ヶ坂7丁目",
      "title": "Used 3LDK (1994) — large 116m2 house on a 154m2 plot",
      "priceMan": 3780,
      "priceFrom": false,
      "landM2": 154,
      "buildingM2": 116.36,
      "layout": "3LDK",
      "station": "Naruse",
      "stationJa": "成瀬",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 13,
      "built": "Oct 1994",
      "ageYears": 32,
      "highlights": [
        "Large house (116.4m2) and plot (154m2) for the price",
        "Quiet residential district on the Naruse side of Machida"
      ],
      "cautions": [
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "OCN不動産",
        "url": "https://house.ocn.ne.jp/sp/ikkodate/special/3004/ensen/324/2324240.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h05",
      "type": "house-used",
      "district": "Minami-Naruse 8",
      "districtJa": "南成瀬8丁目",
      "title": "Used 4LDK (2005) — 13 min to Tsukushino, immediate handover",
      "priceMan": 3380,
      "priceFrom": false,
      "landM2": 130.31,
      "buildingM2": 93.57,
      "layout": "4LDK",
      "station": "Tsukushino",
      "stationJa": "つくし野",
      "line": "Tokyu Den-en-toshi Line",
      "lineJa": "東急田園都市線",
      "walkMin": 13,
      "built": "Apr 2005",
      "ageYears": 21,
      "highlights": [
        "Good value 4LDK on a 130.3m2 plot",
        "Also 13 min from Nagatsuta; vacant, immediate handover"
      ],
      "cautions": [
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "OCN不動産",
        "url": "https://house.ocn.ne.jp/sp/ikkodate/area_tokyo/13209/033.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h06",
      "type": "house-used",
      "district": "Minami-Naruse 8",
      "districtJa": "南成瀬8丁目",
      "title": "Used 4LDK (1995) — south road, flat approach, 165m2 plot",
      "priceMan": 4980,
      "priceFrom": false,
      "landM2": 165.05,
      "buildingM2": 83.04,
      "layout": "4LDK",
      "station": "Tsukushino",
      "stationJa": "つくし野",
      "line": "Tokyu Den-en-toshi Line",
      "lineJa": "東急田園都市線",
      "walkMin": 11,
      "built": "Oct 1995",
      "ageYears": 31,
      "highlights": [
        "Large 165.1m2 plot in a first-class low-rise residential zone",
        "South-facing road, flat approach from the plot; parking for 2"
      ],
      "cautions": [
        "At the top of this collection's price brief",
        "Also 15 min from Naruse (JR Yokohama) — at that station's limit",
        "LP gas (not city gas) per the listing page"
      ],
      "source": {
        "name": "OCN不動産",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/13209/030Z21265307/000389287/x1030Z21265307.html",
        "verified": "detail",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h07",
      "type": "house-used",
      "district": "Naruse 8",
      "districtJa": "成瀬8丁目",
      "title": "Used 4LDK (1994) — under 3300 man, 13 min to Naruse",
      "priceMan": 3299,
      "priceFrom": false,
      "landM2": 121.67,
      "buildingM2": 98.12,
      "layout": "4LDK",
      "station": "Naruse",
      "stationJa": "成瀬",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 13,
      "built": "Mar 1994",
      "ageYears": 32,
      "highlights": [
        "98.1m2 house on a 121.7m2 plot at a low headline price",
        "JR Yokohama Line access to Machida and Yokohama"
      ],
      "cautions": [
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/special/3016/ensen/177/2177100.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h08",
      "type": "house-used",
      "district": "Takagasaka 2",
      "districtJa": "高ヶ坂2丁目",
      "title": "Used 5LDK (2001) — big family house, 15 min to JR Machida",
      "priceMan": 4280,
      "priceFrom": false,
      "landM2": 183.19,
      "buildingM2": 137.04,
      "layout": "5LDK",
      "station": "Machida",
      "stationJa": "町田",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 15,
      "built": "May 2001",
      "ageYears": 25,
      "highlights": [
        "Largest used house here: 137.0m2 on a 183.2m2 plot",
        "Rare detached house within walking distance of Machida Station"
      ],
      "cautions": [
        "At the 15-minute walk limit of this collection (JR side; Odakyu Machida is 20 min)",
        "No final inspection certificate (建築検査済証未取得) — building legality unverified per the listing page",
        "Private-road burden of 21.67m², and the private-road use/excavation consent (私道使用・掘削承諾書) has not been obtained",
        "Second-floor balcony is not installed — fitting one is at the buyer's cost"
      ],
      "source": {
        "name": "OCN不動産",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/13209/030Z21539725/008885017/x1030Z21539725.html",
        "verified": "detail",
        "infoDate": "2026-10-23"
      },
      "majorCautions": 1
    },
    {
      "id": "h09",
      "type": "house-used",
      "district": "Takagasaka 2",
      "districtJa": "高ヶ坂2丁目",
      "title": "Used 4LDK (1997) — 188m2 plot, 12 min to JR Machida",
      "priceMan": 2980,
      "priceFrom": false,
      "landM2": 188.82,
      "buildingM2": 102.68,
      "layout": "4LDK",
      "station": "Machida",
      "stationJa": "町田",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 12,
      "built": "Nov 1997",
      "ageYears": 28,
      "highlights": [
        "Very large 188.8m2 plot for under 3000 man",
        "Also 15 min from Odakyu Machida — both Machida lines usable"
      ],
      "cautions": [
        "No-rebuild (再建築不可): rebuilding is only possible if the neighbour's retaining wall is corrected, the access-strip portion is improved, and permission is obtained from the competent authority",
        "62.25m² of the 188.82m² plot is sloping land; access is a north 4m road with only 2m of frontage, plus a 4.04m² private-road burden"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/13209/030Z78250479/000232005/x1030Z78250479.html",
        "verified": "detail",
        "infoDate": "2026-10-23"
      },
      "majorCautions": 1
    },
    {
      "id": "h10",
      "type": "house-used",
      "district": "Tamagawagakuen 5",
      "districtJa": "玉川学園5丁目",
      "title": "Used 2LDK (1980) — huge 316m2 plot near Tamagawagakuen-mae",
      "priceMan": 4000,
      "priceFrom": false,
      "landM2": 316.14,
      "buildingM2": 95.71,
      "layout": "2LDK",
      "station": "Tamagawagakuen-mae",
      "stationJa": "玉川学園前",
      "line": "Odakyu Odawara Line",
      "lineJa": "小田急小田原線",
      "walkMin": 13,
      "built": "Jul 1980",
      "ageYears": 46,
      "highlights": [
        "Exceptional 316.1m2 (about 95 tsubo) plot — the value is land plus location",
        "Vacant, viewings possible; parking space available"
      ],
      "cautions": [
        "Built Jul 1980 — pre-1981 seismic standard (just before the June 1981 change)",
        "At this age judge it mainly as land; rebuild or major works may be needed",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/sp/ikkodate/area_tokyo/13209.html?lo%5B%5D=0205&lo%5B%5D=0302",
        "verified": "index",
        "infoDate": "2026-10-23"
      },
      "majorCautions": 1
    },
    {
      "id": "h11",
      "type": "house-used",
      "district": "Aihara-machi",
      "districtJa": "相原町",
      "title": "Used 4LDK (1992) — big 178.8m2 plot, renovated, 7 min to Aihara",
      "priceMan": 3590,
      "priceFrom": false,
      "landM2": 178.81,
      "buildingM2": 128.37,
      "layout": "4LDK",
      "station": "Aihara",
      "stationJa": "相原",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 7,
      "built": "Mar 1992",
      "ageYears": 34,
      "highlights": [
        "Spacious 128.4m2 house on a 178.8m2 plot; 18-post LDK plus Japanese room",
        "New interior/exterior renovation; primary school and park within walking distance"
      ],
      "cautions": [
        "Portal copy puts the walk at both 6 and 7 min — scored here on 7",
        "Hilly western Machida district — check the city hazard map for slope/landslide risk",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "OCN不動産",
        "url": "https://house.ocn.ne.jp/sp/ikkodate/special/3003/area_tokyo/13209/017.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h12",
      "type": "house-used",
      "district": "Aihara-machi",
      "districtJa": "相原町",
      "title": "Used 4SLDK (2000) — Sekisui House build, full renovation, 11 min to Aihara",
      "priceMan": 3197,
      "priceFrom": false,
      "landM2": 139.9,
      "buildingM2": 110.36,
      "layout": "4SLDK",
      "station": "Aihara",
      "stationJa": "相原",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 11,
      "built": "Mar 2000",
      "ageYears": 26,
      "highlights": [
        "Sekisui House construction with a full renovation",
        "South road, parking for 2, generous storage throughout"
      ],
      "cautions": [
        "Hilly western Machida district — check the city hazard map for slope/landslide risk",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/special/3007/area_tokyo/13209.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h13",
      "type": "house-used",
      "district": "Minami-Tsukushino 1",
      "districtJa": "南つくし野1丁目",
      "title": "Used 4LDK (2010) — renovated 2010 build near Suzukakedai",
      "priceMan": 4199,
      "priceFrom": false,
      "landM2": 82.8,
      "buildingM2": 66.1,
      "layout": "4LDK",
      "station": "Suzukakedai",
      "stationJa": "すずかけ台",
      "line": "Tokyu Den-en-toshi Line",
      "lineJa": "東急田園都市線",
      "walkMin": 14,
      "built": "Jul 2010",
      "ageYears": 16,
      "highlights": [
        "Relatively recent 2010 build with renovation/reform noted",
        "Quiet residential street; schools nearby"
      ],
      "cautions": [
        "Compact package: 66.1m2 building on an 82.8m2 plot",
        "Portal feeds disagree on layout (2LDK vs 4LDK) and on the Suzukakedai walk (13-16 min) — scored here on 14 min / 4LDK; verify on the listing link"
      ],
      "source": {
        "name": "OCN不動産",
        "url": "https://house.goo.ne.jp/buy/uh/detail/4/13209/1284750066509/128475/x41284750066509.html",
        "verified": "detail",
        "infoDate": "2026-10-24"
      }
    },
    {
      "id": "h14",
      "type": "house-used",
      "district": "Okura-machi",
      "districtJa": "大蔵町",
      "title": "Used 3LDK (2003) on a SE corner lot — all rooms south-facing, flat walk to Tsurukawa",
      "priceMan": 4980,
      "priceFrom": false,
      "landM2": 130.06,
      "buildingM2": 101.23,
      "layout": "3LDK",
      "station": "Tsurukawa",
      "stationJa": "鶴川",
      "line": "Odakyu Odawara Line",
      "lineJa": "小田急小田原線",
      "walkMin": 13,
      "built": "Dec 2003",
      "ageYears": 22,
      "highlights": [
        "South-east corner lot, all rooms south-facing, loft on the second floor",
        "Listing notes a flat walk to Tsurukawa Station; parking for up to 2 cars"
      ],
      "cautions": [
        "At the top of this collection's price brief",
        "Northern Machida / Tama hills side — check the city hazard map for slope/landslide risk",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/special/3006/area_tokyo/13209.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "l01",
      "type": "land",
      "district": "Tamagawagakuen 5",
      "districtJa": "玉川学園5丁目",
      "title": "Large 341m² plot 10 min from Tamagawagakuen-mae — building on site",
      "priceMan": 4999,
      "priceFrom": false,
      "landM2": 341.73,
      "buildingM2": null,
      "layout": null,
      "station": "Tamagawagakuen-mae",
      "stationJa": "玉川学園前",
      "line": "Odakyu Odawara Line",
      "lineJa": "小田急小田原線",
      "walkMin": 10,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "40% / 80%",
      "highlights": [
        "Very large 341.73m² plot for Tamagawagakuen",
        "No building conditions — any house maker",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "A building stands on the land (上物有り) — demolition cost and status to confirm",
        "Narrow road frontage — only about 3.2m onto the NE 6m road per the listing page; check vehicle access and rebuild implications"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/13209/030Z21371234/182569001/x1030Z21371234.html",
        "verified": "detail",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "l02",
      "type": "land",
      "district": "Tamagawagakuen 2",
      "districtJa": "玉川学園2丁目",
      "title": "Vacant south-road lot 5 min from Tamagawagakuen-mae — building conditions attached",
      "priceMan": 4900,
      "priceFrom": false,
      "landM2": 234.23,
      "buildingM2": null,
      "layout": null,
      "station": "Tamagawagakuen-mae",
      "stationJa": "玉川学園前",
      "line": "Odakyu Odawara Line",
      "lineJa": "小田急小田原線",
      "walkMin": 5,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "40% / 80%",
      "highlights": [
        "Vacant land (更地), south road, city gas and mains sewer",
        "Only 5 min walk to Tamagawagakuen-mae Station"
      ],
      "cautions": [
        "Building conditions attached (建築条件付き) — builder is fixed to the seller's designated company",
        "Listing also places the lot in a land-development regulation area (宅地造成工事規制区域) with height-maximum, minimum-lot-size and shadow/slope-line limits — confirm the buildable volume with the designated builder"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/13209/030Z21471706/000585006/x1030Z21471706.html",
        "verified": "detail",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "l03",
      "type": "land",
      "district": "Tamagawagakuen 5",
      "districtJa": "玉川学園5丁目",
      "title": "Huge vacant hilltop plot 7 min from Tamagawagakuen-mae — steep, difficult build",
      "priceMan": 3400,
      "priceFrom": false,
      "landM2": 369.83,
      "buildingM2": null,
      "layout": null,
      "station": "Tamagawagakuen-mae",
      "stationJa": "玉川学園前",
      "line": "Odakyu Odawara Line",
      "lineJa": "小田急小田原線",
      "walkMin": 7,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "40% / 80%",
      "highlights": [
        "Vacant land (更地), immediate handover, high ground with sun and views",
        "Lowest ¥/tsubo among the Tamagawagakuen lots here",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Listing itself warns of a large height difference and high building difficulty — retaining / underground garage / elevator plans suggested, with major extra cost likely",
        "Tama hills area — check landslide / earth-fill (盛土規制法・宅地造成工事規制区域) restrictions noted on the listing"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/13209/030Z79158683/170565001/x1030Z79158683.html",
        "verified": "detail",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "l04",
      "type": "land",
      "district": "Narusegaoka 3",
      "districtJa": "成瀬が丘3丁目",
      "title": "Vacant flat 212m² lot 8 min from Naruse — no building conditions",
      "priceMan": 4200,
      "priceFrom": false,
      "landM2": 212.57,
      "buildingM2": null,
      "layout": null,
      "station": "Naruse",
      "stationJa": "成瀬",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 8,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "40% / 80%",
      "highlights": [
        "Vacant land delivered as vacant (更地渡し), flat plot (平坦地)",
        "Full utilities: city gas, mains sewer",
        "212.57m² — over 50 tsubo",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/13209/030Z21699119/000079001/x1030Z21699119.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l05",
      "type": "land",
      "district": "Tamagawagakuen 3",
      "districtJa": "玉川学園3丁目",
      "title": "349m² vacant plot 12 min from Tamagawagakuen-mae at ¥28.2万/tsubo",
      "priceMan": 2980,
      "priceFrom": false,
      "landM2": 349.65,
      "buildingM2": null,
      "layout": null,
      "station": "Tamagawagakuen-mae",
      "stationJa": "玉川学園前",
      "line": "Odakyu Odawara Line",
      "lineJa": "小田急小田原線",
      "walkMin": 12,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "40% / 80%",
      "highlights": [
        "Vacant land (更地), immediate handover (即引渡し可)",
        "Exceptionally low ¥/tsubo for a station-walk plot — large enough for a two-household home or subdivision play",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Unusually cheap per tsubo for the area — confirm shape, slope, road frontage and any restrictions on the listing page before relying on it",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産 (OCN feed)",
        "url": "https://house.ocn.ne.jp/sp/tochi/special/4001/area_tokyo/13209.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "l06",
      "type": "land",
      "district": "Ogawa 3",
      "districtJa": "小川3丁目",
      "title": "Vacant 135m² lot on a 9m road, 15 min from Naruse",
      "priceMan": 4290,
      "priceFrom": false,
      "landM2": 135.23,
      "buildingM2": null,
      "layout": null,
      "station": "Naruse",
      "stationJa": "成瀬",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 15,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "50% / 100%",
      "highlights": [
        "Vacant land (更地), 9m front road",
        "City gas, mains sewer; primary school about 2 min on foot",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "At the brief's walk limit (15 min); Tsukushino Station is 17 min, so Naruse is the usable station",
        "A boundary-encroachment memorandum exists (越境に関する覚書有) per the listing page — check what encroaches before purchase"
      ],
      "source": {
        "name": "OCN不動産 (goo feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/4/13209/8920152962/892/x48920152962.html",
        "verified": "detail",
        "infoDate": "2026-10-24"
      },
      "majorCautions": 1
    },
    {
      "id": "l07",
      "type": "land",
      "district": "Ogawa 2",
      "districtJa": "小川2丁目",
      "title": "Compact 75m² plot 9 min from Naruse on a 10m road — building on site",
      "priceMan": 2680,
      "priceFrom": false,
      "landM2": 75.76,
      "buildingM2": null,
      "layout": null,
      "station": "Naruse",
      "stationJa": "成瀬",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 9,
      "built": null,
      "ageYears": null,
      "zoning": "第1種中高層住居専用地域",
      "coverageFar": "50% / 100%",
      "highlights": [
        "Regular-shaped plot with 6.6m frontage onto a ~10m NE public road, no level difference to the road",
        "Cheapest Naruse-walk lot in this set by total price",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Small 75.76m² plot (registry / 公簿 area)",
        "A building stands on the land (上物有り) — demolition cost on the buyer unless the listing says otherwise",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "OCN不動産 (goo feed)",
        "url": "https://house.ocn.ne.jp/sp/tochi/area_tokyo/13209/004.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "l08",
      "type": "land",
      "district": "Ogawa 1",
      "districtJa": "小川1丁目",
      "title": "142m² flag lot 10 min from Tsukushino — cheapest total price here",
      "priceMan": 1990,
      "priceFrom": false,
      "landM2": 142.75,
      "buildingM2": null,
      "layout": null,
      "station": "Tsukushino",
      "stationJa": "つくし野",
      "line": "Tokyu Den-en-toshi Line",
      "lineJa": "東急田園都市線",
      "walkMin": 10,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "50% / 100%",
      "highlights": [
        "Immediate handover (即引渡し可), city gas",
        "Quiet position set back from the road — less noise and overlooking",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Flag / pole lot (路地状敷地): about 20m² of the headline 142.75m² is the access strip — effective building area is smaller",
        "A building stands on the land (上物有り), sold as-is — demolition cost on the buyer"
      ],
      "source": {
        "name": "OCN不動産 (goo feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/13209/030Z20774183/006050A26/x1030Z20774183.html",
        "verified": "detail",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "l09",
      "type": "land",
      "district": "Higashi-Tamagawagakuen 1",
      "districtJa": "東玉川学園1丁目",
      "title": "Corner regular-shaped lot in Higashi-Tamagawagakuen, 14 min from Tamagawagakuen-mae",
      "priceMan": 3690,
      "priceFrom": false,
      "landM2": 162.53,
      "buildingM2": null,
      "layout": null,
      "station": "Tamagawagakuen-mae",
      "stationJa": "玉川学園前",
      "line": "Odakyu Odawara Line",
      "lineJa": "小田急小田原線",
      "walkMin": 14,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "40% / 80%",
      "highlights": [
        "Corner lot (角地) SW/SE — good sun and openness",
        "Regular-shaped plot (整形地) in an established low-rise subdivision",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "A building stands on the land (上物有り) — demolition cost and status to confirm",
        "The house standing on the plot was built in Oct 1977 (pre-1981 seismic standard) and the seller's building contract-nonconformity and equipment-repair liability is waived — budget for demolition"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/13209/030Z21682411/000045016/x1030Z21682411.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l10",
      "type": "land",
      "district": "Aihara-machi",
      "districtJa": "相原町",
      "title": "357m² plot with old house 11 min from Aihara — ¥27.6万/tsubo",
      "priceMan": 2980,
      "priceFrom": false,
      "landM2": 357.0,
      "buildingM2": null,
      "layout": null,
      "station": "Aihara",
      "stationJa": "相原",
      "line": "JR Yokohama Line",
      "lineJa": "JR横浜線",
      "walkMin": 11,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "40% / 80%",
      "highlights": [
        "Very large 357m² (107.99 tsubo) plot — lowest ¥/tsubo in this collection",
        "No private-road burden (私道負担無), east 4m road",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "An old house stands on the land (古家有り) — demolition cost on the buyer",
        "Only public water supply is listed in the equipment notes — confirm gas and sewer connection",
        "Hilly northern Machida (Tama hills side) — check slope and landslide-risk maps",
        "Verified on the listing page (information date 2026-10-23)"
      ],
      "source": {
        "name": "SUUMO",
        "url": "https://suumo.jp/tochi/tokyo/sc_machida/nc_20812285/",
        "verified": "detail",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "l11",
      "type": "land",
      "district": "Higashi-Tamagawagakuen 1",
      "districtJa": "東玉川学園1丁目",
      "title": "Vacant 150m² lot 15 min from Tamagawagakuen-mae — building conditions attached",
      "priceMan": 2580,
      "priceFrom": false,
      "landM2": 150.99,
      "buildingM2": null,
      "layout": null,
      "station": "Tamagawagakuen-mae",
      "stationJa": "玉川学園前",
      "line": "Odakyu Odawara Line",
      "lineJa": "小田急小田原線",
      "walkMin": 15,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "40% / 80%",
      "highlights": [
        "Vacant land (更地)",
        "Lowest total price for a Tamagawagakuen-mae walk lot in this set"
      ],
      "cautions": [
        "Building conditions attached (建築条件付き) — you must build with the designated builder",
        "At the brief's walk limit (15 min)",
        "Part of the lot is sloped (敷地内に一部傾斜地あり) per the listing page",
        "About 35m² of the plot is a private-road share; access is via a north 4m private road (one-way)"
      ],
      "source": {
        "name": "OCN不動産 (goo feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/4/13209/8920153680/892/x48920153680.html",
        "verified": "detail",
        "infoDate": "2026-10-24"
      }
    },
    {
      "id": "l12",
      "type": "land",
      "district": "Kanai-ga-oka 2",
      "districtJa": "金井ヶ丘2丁目",
      "title": "Corner south-road plot in Kanai-ga-oka, 15 min from Tamagawagakuen-mae",
      "priceMan": 2900,
      "priceFrom": false,
      "landM2": 165.88,
      "buildingM2": null,
      "layout": null,
      "station": "Tamagawagakuen-mae",
      "stationJa": "玉川学園前",
      "line": "Odakyu Odawara Line",
      "lineJa": "小田急小田原線",
      "walkMin": 15,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "40% / 80%",
      "highlights": [
        "Corner lot (角地) on a south road — good sun",
        "Listing notes rebuilding is possible (再建築可能); immediate handover, city gas and mains sewer",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "A building stands on the land (上物有り), sold as-is (現況渡し) — demolition cost on the buyer",
        "At the brief's walk limit (15 min)",
        "Level difference within the lot (敷地内段差有), and the lot sits in a land-development regulation area (宅地造成工事規制区域) per the listing page — confirm foundation/retaining costs"
      ],
      "source": {
        "name": "OCN不動産 (goo feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/4/13209/1369330004150/136933/x41369330004150.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    }
  ],
  "scoring": {
    "tier": {
      "Machida": 8,
      "Tamagawagakuen-mae": 6
    },
    "walkBand": [
      88,
      70,
      58
    ],
    "mapsQuery": "東京都町田市"
  }
};
