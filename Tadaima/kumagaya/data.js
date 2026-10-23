window.TADAIMA_DATA = {
  "site": {
    "name": "Tadaima!",
    "nameJa": "ただいま！",
    "edition": "Kumagaya",
    "editionJa": "熊谷",
    "researchedOn": "2026-10-23",
    "area": "Kumagaya City, Saitama",
    "areaJa": "埼玉県熊谷市"
  },
  "defaults": {
    "budgetMan": 5000,
    "maxWalkMin": 15
  },
  "benchmarks": {
    "landPerTsuboManByStation": {
      "Hirose-Yachonomori": 13,
      "Ishihara": 20,
      "Kagohara": 22,
      "Kami-Kumagaya": 20,
      "Kumagaya": 20
    },
    "note": "Land benchmarks: residential ¥/tsubo to score against, triangulated from MLIT transaction data via Utinokati and 2026 official land prices (Tochidai/Totinokati/tochi-d), all observed 2026-10-23: Kumagaya 20, Kagohara 22, Kami-Kumagaya 20 (proxy — scored against Kumagaya, whose centre is its catchment), Ishihara 20, Hirose-Yachonomori 13 (proxy, low confidence); Oaso could not be isolated (no transaction series, no official point — fringe fallback ≤10 at lowest confidence if a figure is unavoidable). Kumagaya station's 2026 all-use official average (22.90万/坪 公示） is NOT used: it folds in commercial station-front points up to 89.92 （筑波3丁目） and an office point at 35.70, while its raw transaction catchment (14.5, 2025, avg walk 40.9 min, avg lot ~105坪） is NOT used either — it reaches the Menuma/Konan fringe and urbanisation-control deals that print at 1.6–8万/坪 against 15–30+ in-zone; the in-zone truth is bracketed by central-district transactions (30.0, 3-yr) and near-station residential official points (27–35 within ~1 km, 17.7–24 further out), and normal 50–60坪 lots city-wide transact at 20.5. Kami-Kumagaya's Tochidai total (33.55) is rejected as Kumagaya-centre all-use mix, Kagohara's total (17.68) is rejected for Fukaya-side and far-fringe drag against its 19.4–25.8 near-station residential points （籠原南 36.03 official / 36.7 transactions is a premium pocket, not the station figure), Ishihara rests on its 21.13 official point and 16.5–23.4 in-zone transactions, and Hirose-Yachonomori blends its dragged 10.85 total with a falling 15.0 official point at Hirose. Partial-2026 prints (Kumagaya station land 9.7 on 13 deals, −33%) are rejected as thin quarterly noise, as are all sub-10-deal splits (Hirose houses 63.0 on 8, Kami-Kumagaya houses 55.0 on 8). Walk gradient is nearly flat (car city): land −8.25% by a 10-minute walk at Kumagaya station (Utinokati regression), houses flat to ~15 min then a step down, most volume 16+ min out. Used-house anchor ≈58万/坪 city-wide (last-3-years transactions 58.1; 2025: 60.9 on 335 deals; age cohorts ≤10 yr 88.4, 30+ yr 26.7). Official direction 2026: residential ≈+0.6% city-wide (all-use +0.81%), centre points +3–5%, fringe 0 to −2% — a gentle, centre-led rise."
  },
  "properties": [
    {
      "id": "h01",
      "type": "house-new",
      "district": "Manpeicho 2",
      "districtJa": "万平町2丁目",
      "title": "New 4LDK development (4 units) — long-life quality housing, 3-car parking",
      "priceMan": 4190,
      "priceFrom": false,
      "landM2": 159.68,
      "buildingM2": 109.3,
      "layout": "4LDK",
      "station": "Kumagaya",
      "stationJa": "熊谷",
      "line": "JR Takasaki Line",
      "lineJa": "JR高崎線",
      "walkMin": 10,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Closest new build to Kumagaya Station itself in this collection — Shinkansen commuting possible",
        "Long-life quality housing (長期優良住宅); parking for 3 cars"
      ],
      "cautions": [
        "Portal feeds disagree on the walk (9 vs 10 min) — scored here on 10; verify on the ground",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/sp/new-ikkodate/area_saitama/11202.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h02",
      "type": "house-new",
      "district": "Sayada",
      "districtJa": "佐谷田",
      "title": "New 4LDK — single-unit sale north of Kumagaya Station",
      "priceMan": 3390,
      "priceFrom": false,
      "landM2": 126.83,
      "buildingM2": 99.78,
      "layout": "4LDK",
      "station": "Kumagaya",
      "stationJa": "熊谷",
      "line": "JR Takasaki Line",
      "lineJa": "JR高崎線",
      "walkMin": 13,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "One of very few new builds within walking distance of Kumagaya Station",
        "City gas; parking for 2 or more cars"
      ],
      "cautions": [
        "13-minute walk is toward the brief's outer edge",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "OCN不動産",
        "url": "https://house.ocn.ne.jp/sp/new-ikkodate/special/6015/area_saitama/11202/063.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h03",
      "type": "house-new",
      "district": "Miyamotocho",
      "districtJa": "宮本町",
      "title": "New 3LDK+S (2 units) — long-life quality housing, roof balcony",
      "priceMan": 2690,
      "priceFrom": false,
      "landM2": 139.24,
      "buildingM2": 106.82,
      "layout": "3LDK+S",
      "station": "Kami-Kumagaya",
      "stationJa": "上熊谷",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 5,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Shortest walk of any new build here — 5 min to Kami-Kumagaya; Ishihara is also 13 min",
        "Long-life quality housing (長期優良住宅) with roof balcony and loft storage room"
      ],
      "cautions": [
        "Kumagaya Station (JR/Shinkansen) is 16 min on foot — just outside comfortable walking range; the usable station is Kami-Kumagaya on the local Chichibu line",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/sp/new-ikkodate/area_saitama/11202.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h04",
      "type": "house-new",
      "district": "Hakoda 2",
      "districtJa": "箱田2丁目",
      "title": "New 4LDK, completed — city gas and mains sewerage",
      "priceMan": 2590,
      "priceFrom": false,
      "landM2": 131.88,
      "buildingM2": 103.5,
      "layout": "4LDK",
      "station": "Kami-Kumagaya",
      "stationJa": "上熊谷",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 15,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Completed and open for viewing; primary school 5 min walk",
        "City gas and mains sewerage; parking for 2 cars"
      ],
      "cautions": [
        "At the 15-minute walk limit of this collection (via Kami-Kumagaya); Kumagaya Station is 17 min",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/sp/new-ikkodate/special/6004/area_saitama/11202.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h05",
      "type": "house-new",
      "district": "Motoishi 2",
      "districtJa": "本石2丁目",
      "title": "New 3SLDK — long-life quality housing on a south-facing regular plot",
      "priceMan": 2199,
      "priceFrom": false,
      "landM2": 95.8,
      "buildingM2": 97.71,
      "layout": "3SLDK",
      "station": "Kami-Kumagaya",
      "stationJa": "上熊谷",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 10,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Cheapest new house in this collection",
        "Long-life quality housing (長期優良住宅); south-facing regular-shaped plot, city gas and mains sewerage"
      ],
      "cautions": [
        "Portal feeds disagree on the price (¥2,199万 vs ¥2,399万 for the same house) — scored here on the cheaper feed; confirm before viewing",
        "Compact 95.8m² plot — small for Kumagaya",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/sp/new-ikkodate/area_saitama/11202.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h06",
      "type": "house-new",
      "district": "Akagicho 1",
      "districtJa": "赤城町1丁目",
      "title": "New 4LDK (2 units) — seismic + damping structure, telework room",
      "priceMan": 2480,
      "priceFrom": false,
      "landM2": 118.09,
      "buildingM2": 98.01,
      "layout": "4LDK",
      "station": "Ishihara",
      "stationJa": "石原",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 9,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Earthquake-resistant + vibration-damped construction; ~2-tatami telework room",
        "Side-by-side parking for 2 cars; supermarket 6 min walk"
      ],
      "cautions": [
        "Portal feeds disagree on the walk (9 vs 11 min) — scored here on 9; verify on the ground",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/sp/new-ikkodate/special/6004/area_saitama/11202.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h07",
      "type": "house-new",
      "district": "Ishihara",
      "districtJa": "石原",
      "title": "New 4LDK+S development (2 units) — seismic grade 3, parking for 3",
      "priceMan": 2180,
      "priceFrom": false,
      "landM2": 157.06,
      "buildingM2": 98.82,
      "layout": "4LDK+S",
      "station": "Ishihara",
      "stationJa": "石原",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 9,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Generous 157m² plot at the joint-lowest new-build price here",
        "Seismic grade 3; parking for 3 cars; city gas"
      ],
      "cautions": [
        "South-bank Arakawa side of the city — check the Kumagaya flood hazard map for this plot before purchase",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/sp/new-ikkodate/area_saitama/11202.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h08",
      "type": "house-new",
      "district": "Tsukimicho 1",
      "districtJa": "月見町1丁目",
      "title": "New 4LDK — long-life quality housing, south garden, 3-car parking",
      "priceMan": 3490,
      "priceFrom": false,
      "landM2": 151.22,
      "buildingM2": 103.71,
      "layout": "4LDK",
      "station": "Ishihara",
      "stationJa": "石原",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 10,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Long-life quality housing (長期優良住宅); south garden with side-by-side parking for 3",
        "City gas and mains sewerage; roof balcony"
      ],
      "cautions": [
        "Portal feeds disagree on the price (¥3,290万 vs ¥3,490万 for the same house) — scored here on the higher figure; confirm before viewing",
        "South-bank Arakawa side of the city — check the Kumagaya flood hazard map for this plot before purchase",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/bh/special/6011/area_saitama/11202.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h09",
      "type": "house-used",
      "district": "Shinbori",
      "districtJa": "新堀",
      "title": "Used 3SLDK (2002) — Hebel House steel-frame build, 7 min to Kagohara",
      "priceMan": 2780,
      "priceFrom": false,
      "landM2": 165.44,
      "buildingM2": 105.96,
      "layout": "3SLDK",
      "station": "Kagohara",
      "stationJa": "籠原",
      "line": "JR Takasaki Line",
      "lineJa": "JR高崎線",
      "walkMin": 7,
      "built": "Aug 2002",
      "ageYears": 24,
      "highlights": [
        "Hebel House (Asahi Kasei) light-gauge steel construction — a step above standard timber builds",
        "Large walk-in closet plus a 3-tatami storage room; 7 min to a JR station"
      ],
      "cautions": [
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "OCN不動産",
        "url": "https://house.ocn.ne.jp/sp/ikkodate/area_saitama/11202.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h10",
      "type": "house-used",
      "district": "Tamai 5",
      "districtJa": "玉井5丁目",
      "title": "Used 3LDK (1991) — Kagohara side, priced under ¥1,300万",
      "priceMan": 1299,
      "priceFrom": false,
      "landM2": 122.52,
      "buildingM2": 97.97,
      "layout": "3LDK",
      "station": "Kagohara",
      "stationJa": "籠原",
      "line": "JR Takasaki Line",
      "lineJa": "JR高崎線",
      "walkMin": 15,
      "built": "Mar 1991",
      "ageYears": 35,
      "highlights": [
        "JR Takasaki Line access at a Chichibu-line price",
        "Sensible 98m² house on a 122.5m² plot"
      ],
      "cautions": [
        "At the 15-minute walk limit of this collection",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/special/3003/area_saitama/11202.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h11",
      "type": "house-used",
      "district": "Shinbori",
      "districtJa": "新堀",
      "title": "Used 5LDK (1993) — cheapest JR-station walk in this collection",
      "priceMan": 880,
      "priceFrom": false,
      "landM2": 100,
      "buildingM2": 98.12,
      "layout": "5LDK",
      "station": "Kagohara",
      "stationJa": "籠原",
      "line": "JR Takasaki Line",
      "lineJa": "JR高崎線",
      "walkMin": 6,
      "built": "Feb 1993",
      "ageYears": 33,
      "highlights": [
        "Five rooms and a 6-minute walk to Kagohara (JR) for ¥880万",
        "City gas; vacant, immediate handover"
      ],
      "cautions": [
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "OCN不動産",
        "url": "https://house.ocn.ne.jp/sp/ikkodate/area_saitama/11202.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h12",
      "type": "house-used",
      "district": "Oaso",
      "districtJa": "大麻生",
      "title": "Used 3LDK (1998) — south garden, 6 min to Oaso Station",
      "priceMan": 880,
      "priceFrom": false,
      "landM2": 136.23,
      "buildingM2": 82.8,
      "layout": "3LDK",
      "station": "Oaso",
      "stationJa": "大麻生",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 6,
      "built": "Jun 1998",
      "ageYears": 28,
      "highlights": [
        "Joint-cheapest house here, with a south-facing garden and parking for 2",
        "All rooms Western-style with storage in every room"
      ],
      "cautions": [
        "Portal feeds disagree on the price (¥880万 vs ¥1,080万 for the same house via different agencies) — scored here on the cheaper feed; confirm before viewing",
        "Oaso is a small local station south of the Arakawa — check the Kumagaya flood hazard map for this plot before purchase",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/sp/ikkodate/area_saitama/11202/134.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h13",
      "type": "house-used",
      "district": "Hirose",
      "districtJa": "広瀬",
      "title": "Used 4LDK (1991), interior-renovated — two-family layout, 5 min to Hirose-Yachonomori",
      "priceMan": 1300,
      "priceFrom": false,
      "landM2": 181.49,
      "buildingM2": 136.62,
      "layout": "4LDK",
      "station": "Hirose-Yachonomori",
      "stationJa": "ひろせ野鳥の森",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 5,
      "built": "Jul 1991",
      "ageYears": 35,
      "highlights": [
        "Biggest used house here (136.6m²) on a 181.5m² plot, interior renovated",
        "Two-family capable layout — separate kitchen, bath and toilet per household; south road frontage with garden"
      ],
      "cautions": [
        "Portal feeds disagree on the price (¥1,300万 on the live index vs ¥1,330–1,480万 in older crawls) — scored here on the live index figure; confirm before viewing",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/shuto_uh/area_saitama/11202/058.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h14",
      "type": "house-used",
      "district": "Senami",
      "districtJa": "瀬南",
      "title": "Used 4LDK (1997), part-renovated — 5 min to Hirose-Yachonomori",
      "priceMan": 1480,
      "priceFrom": false,
      "landM2": 162.91,
      "buildingM2": 119.03,
      "layout": "4LDK",
      "station": "Hirose-Yachonomori",
      "stationJa": "ひろせ野鳥の森",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 5,
      "built": "Sep 1997",
      "ageYears": 29,
      "highlights": [
        "Large 119m² house on a 162.9m² plot; south road frontage, city gas",
        "Renovation already covers bath, toilet and washstand renewal plus termite treatment"
      ],
      "cautions": [
        "Portal feeds disagree on the walk (5 vs 7 min) — scored here on 5; verify on the ground",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "OCN不動産",
        "url": "https://house.ocn.ne.jp/sp/ikkodate/area_saitama/11202.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h15",
      "type": "house-used",
      "district": "Motoishi 2",
      "districtJa": "本石2丁目",
      "title": "Used 4DK (1987), renovated inside and out — 5 min to Kami-Kumagaya",
      "priceMan": 1030,
      "priceFrom": false,
      "landM2": 93.41,
      "buildingM2": 77.01,
      "layout": "4DK",
      "station": "Kami-Kumagaya",
      "stationJa": "上熊谷",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 5,
      "built": "Dec 1987",
      "ageYears": 38,
      "highlights": [
        "Renovated inside and out; every room 6 tatami or larger",
        "Aeon supermarket 3 min walk; Kumagaya Station also walkable in 14 min"
      ],
      "cautions": [
        "Compact 93.4m² plot and 77m² building",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/special/3007/area_saitama/11202/061.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h16",
      "type": "house-used",
      "district": "Ishihara",
      "districtJa": "石原",
      "title": "Used 4LDK (1996), renovated — the Ishihara family starter",
      "priceMan": 1599,
      "priceFrom": false,
      "landM2": 100.12,
      "buildingM2": 80.31,
      "layout": "4LDK",
      "station": "Ishihara",
      "stationJa": "石原",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 10,
      "built": "Mar 1996",
      "ageYears": 30,
      "highlights": [
        "Four rooms with an LDK plus separate Japanese room on the ground floor — children can each have a room",
        "Storage in every room; schools and supermarkets in walking range"
      ],
      "cautions": [
        "Portal feeds disagree on the price and walk (¥1,599万 at 9–12 min vs ¥1,699万 at 10 min for the same house) — scored here on ¥1,599万 / 10 min; confirm before viewing",
        "South-bank Arakawa side of the city — check the Kumagaya flood hazard map for this plot before purchase",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/shuto_uh/area_saitama/11202/004.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h17",
      "type": "house-used",
      "district": "Ishihara",
      "districtJa": "石原",
      "title": "Used 5DK (1978) — pre-1981 seismic standard, cross-renewed 2026",
      "priceMan": 1180,
      "priceFrom": false,
      "landM2": 128.64,
      "buildingM2": 101.84,
      "layout": "5DK",
      "station": "Ishihara",
      "stationJa": "石原",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 10,
      "built": "Jul 1978",
      "ageYears": 48,
      "highlights": [
        "Spacious 5DK with storage in every room and daylight from two sides",
        "Wall coverings renewed Jun 2026; shops within walking distance"
      ],
      "cautions": [
        "Built Jul 1978 — pre-1981 old seismic standard (旧耐震); budget for a seismic assessment and possible reinforcement",
        "South-bank Arakawa side of the city — check the Kumagaya flood hazard map for this plot before purchase",
        "Seen on a portal index page — verify details on the listing link"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/shuto_uh/area_saitama/11202/004.html",
        "verified": "index",
        "infoDate": "2026-10-23"
      },
      "majorCautions": 1
    },
    {
      "id": "l01",
      "type": "land",
      "district": "Ginza 1",
      "districtJa": "銀座1",
      "title": "Commercial-zone plot 6 minutes from Kumagaya Station — building on site",
      "priceMan": 3500,
      "priceFrom": false,
      "landM2": 113.15,
      "buildingM2": null,
      "layout": null,
      "station": "Kumagaya",
      "stationJa": "熊谷",
      "line": "JR Takasaki Line",
      "lineJa": "JR高崎線",
      "walkMin": 6,
      "built": null,
      "ageYears": null,
      "zoning": "商業地域",
      "coverageFar": "80% / 240%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Commercial zoning (商業地域) in the station-front district — flexible but not a quiet residential street; the highest ¥/tsubo in this collection",
        "A building stands on the land (上物有り), sold as-is (現況渡し) — demolition cost and effort on the buyer",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z21753170/035184013/x1030Z21753170.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l02",
      "type": "land",
      "district": "Enoki-cho",
      "districtJa": "榎町",
      "title": "165m² plot 7 minutes from Kami-Kumagaya — 1980 house on site",
      "priceMan": 1280,
      "priceFrom": false,
      "landM2": 165.28,
      "buildingM2": null,
      "layout": null,
      "station": "Kami-Kumagaya",
      "stationJa": "上熊谷",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 7,
      "built": null,
      "ageYears": null,
      "zoning": "第1種住居地域",
      "coverageFar": "60% / 160%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "A 1980 wooden house stands on the land (上物有り), sold as-is (現況渡し) — demolition cost on the buyer",
        "Area may change: the current survey measures 168.19m² against the registered 165.28m², and a neighbouring owner did not attend the boundary confirmation",
        "No city-gas main in the front road (LP gas) — the nearest gas main is by the north-west neighbouring plot",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z21186605/000585092/x1030Z21186605.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l03",
      "type": "land",
      "district": "Ishihara",
      "districtJa": "石原",
      "title": "Vacant 165m² plot 9 minutes from Ishihara at an anomalously low ¥100万",
      "priceMan": 100,
      "priceFrom": false,
      "landM2": 165.86,
      "buildingM2": null,
      "layout": null,
      "station": "Ishihara",
      "stationJa": "石原",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 9,
      "built": null,
      "ageYears": null,
      "zoning": "第1種中高層住居専用地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Anomalously low asking price (¥100万 for 165.9m² of zoned residential land) — confirm the listing is genuine, complete and free of undisclosed encumbrances before relying on it",
        "LP gas and no mains sewer listed in the utilities (water only)",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z77284959/179201001/x1030Z77284959.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l04",
      "type": "land",
      "district": "Miyamachi 1",
      "districtJa": "宮町1",
      "title": "Cheap plot between two stations — 1.88m road, setback and a 1972 house",
      "priceMan": 555,
      "priceFrom": false,
      "landM2": 120.66,
      "buildingM2": null,
      "layout": null,
      "station": "Kami-Kumagaya",
      "stationJa": "上熊谷",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 10,
      "built": null,
      "ageYears": null,
      "zoning": "第1種住居地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Setback required: the front road is a Building Standards Act Art. 42-2 road only 1.88m wide, so rebuilding requires setting the building back",
        "A 1972 wooden house stands on the land (上物有り), sold as-is (現況渡し) — demolition cost on the buyer",
        "City-gas meter has been removed — reconnection is at the buyer's cost; no parking space on the plot",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z20144496/142790011/x1030Z20144496.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      },
      "majorCautions": 1
    },
    {
      "id": "l05",
      "type": "land",
      "district": "Ishihara",
      "districtJa": "石原",
      "title": "Vacant 208m² plot 10 minutes from Ishihara — registered as paddy field",
      "priceMan": 650,
      "priceFrom": false,
      "landM2": 208,
      "buildingM2": null,
      "layout": null,
      "station": "Ishihara",
      "stationJa": "石原",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 10,
      "built": null,
      "ageYears": null,
      "zoning": "第1種中高層住居専用地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Registered land category is paddy field (田) despite the residential zoning — farmland conversion procedures may be needed before building",
        "Narrow frontage: only 3.9m onto the north 4.2m road",
        "LP gas and no mains sewer listed in the utilities (water only); agent notes also mention a Category-2 residential portion, against the headline Category-1 mid/high-rise zoning",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z74681140/130748003/x1030Z74681140.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l06",
      "type": "land",
      "district": "Shinbori-Shinden",
      "districtJa": "新堀新田",
      "title": "Huge vacant 497m² plot 10 minutes from Kagohara — lowest ¥/tsubo of the zoned lots",
      "priceMan": 3150,
      "priceFrom": false,
      "landM2": 496.99,
      "buildingM2": null,
      "layout": null,
      "station": "Kagohara",
      "stationJa": "籠原",
      "line": "JR Takasaki Line",
      "lineJa": "JR高崎線",
      "walkMin": 10,
      "built": null,
      "ageYears": null,
      "zoning": "第1種住居地域",
      "coverageFar": "60% / 160%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Registered land category is field (畑) — confirm residential conversion status before building",
        "Utilities are not listed on the listing page at all — confirm water, sewer and gas connections and any connection costs",
        "Very large single 497m² lot — total outlay to build and maintain is well beyond a standard house plot",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z78521919/130748003/x1030Z78521919.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l07",
      "type": "land",
      "district": "Miharumachi",
      "districtJa": "見晴町",
      "title": "250m² plot with wide 14.6m frontage, 10 minutes from Kami-Kumagaya — building on site",
      "priceMan": 2380,
      "priceFrom": false,
      "landM2": 250.01,
      "buildingM2": null,
      "layout": null,
      "station": "Kami-Kumagaya",
      "stationJa": "上熊谷",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 10,
      "built": null,
      "ageYears": null,
      "zoning": "第1種住居地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "A building stands on the land (上物有り), sold as-is (現況渡し) — demolition cost and effort on the buyer",
        "Only city gas is listed under utilities — water and sewer connections are not stated on the listing page and must be confirmed",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z20927798/018377000/x1030Z20927798.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l08",
      "type": "land",
      "district": "Hakoda 1",
      "districtJa": "箱田1",
      "title": "Large vacant 405m² plot 11 minutes from Kami-Kumagaya",
      "priceMan": 2380,
      "priceFrom": false,
      "landM2": 405.45,
      "buildingM2": null,
      "layout": null,
      "station": "Kami-Kumagaya",
      "stationJa": "上熊谷",
      "line": "Chichibu Railway",
      "lineJa": "秩父鉄道",
      "walkMin": 11,
      "built": null,
      "ageYears": null,
      "zoning": "第1種住居地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Road frontage is not stated anywhere on the listing page — confirm the access road and frontage before relying on buildability",
        "No gas supply listed (utilities shown are water and mains sewer only)",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z21791775/183009001/x1030Z21791775.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l09",
      "type": "land",
      "district": "Jurokken",
      "districtJa": "拾六間",
      "title": "Vacant corner plot 13 minutes from Kagohara — private road inside the headline area",
      "priceMan": 2500,
      "priceFrom": false,
      "landM2": 220.0,
      "buildingM2": null,
      "layout": null,
      "station": "Kagohara",
      "stationJa": "籠原",
      "line": "JR Takasaki Line",
      "lineJa": "JR高崎線",
      "walkMin": 13,
      "built": null,
      "ageYears": null,
      "zoning": "第1種中高層住居専用地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Headline area includes 11.44m² of private road — effective buildable area is about 220.0m²",
        "The Flood Prevention Act (水防法) appears in the listing's legal restrictions — check the Arakawa-basin flood hazard map for this plot",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z21690066/174536001/x1030Z21690066.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l10",
      "type": "land",
      "district": "Suehiro 2",
      "districtJa": "末広2",
      "title": "218m² plot 13 minutes from Kumagaya Station — liability waived, boundaries not clarified",
      "priceMan": 2500,
      "priceFrom": false,
      "landM2": 218.28,
      "buildingM2": null,
      "layout": null,
      "station": "Kumagaya",
      "stationJa": "熊谷",
      "line": "JR Takasaki Line",
      "lineJa": "JR高崎線",
      "walkMin": 13,
      "built": null,
      "ageYears": null,
      "zoning": "第1種住居地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Defect-liability exemption (契約不適合責任免責) — the seller takes no liability for defects",
        "Boundaries not clarified (境界非明示) and the sale is on the registered area (公簿売買) — the actual area may differ",
        "An old house stands on the land (上物有り), sold as-is (現況渡し) — demolition cost on the buyer",
        "Part of the land is registered as paddy field (田) — an Agricultural Land Act Art. 5 notification is required; the plot currently uses well water and the water pipe must be re-laid and the old pipe removed at the buyer's cost",
        "No ownership share is held in the designated-position access road the plot fronts",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z20144504/142790011/x1030Z20144504.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      },
      "majorCautions": 2
    },
    {
      "id": "l11",
      "type": "land",
      "district": "Kagohara-Minami 2",
      "districtJa": "籠原南2",
      "title": "Vacant plot 14 minutes from Kagohara — only 2.5m of road frontage",
      "priceMan": 2550,
      "priceFrom": false,
      "landM2": 178.5,
      "buildingM2": null,
      "layout": null,
      "station": "Kagohara",
      "stationJa": "籠原",
      "line": "JR Takasaki Line",
      "lineJa": "JR高崎線",
      "walkMin": 14,
      "built": null,
      "ageYears": null,
      "zoning": "第1種住居地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Narrow frontage: only 2.5m onto the west 5.8m road — flag-pole-style access that constrains design and car access",
        "Headline area appears to include an agreement-road portion: agent notes give the plot as 53.98 tsubo (about 178.5m²) with 17.17 tsubo of agreement road — treat about 178.5m² as the effective building area and confirm the split",
        "Registered land category is field (畑), and a Cultural Properties Protection Act note applies to the neighbouring land",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z78699787/130748003/x1030Z78699787.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l12",
      "type": "land",
      "district": "Shinbori",
      "districtJa": "新堀",
      "title": "Small 89m² plot at the 15-minute limit from Kagohara — boundaries not clarified, setback needed",
      "priceMan": 400,
      "priceFrom": false,
      "landM2": 89.38,
      "buildingM2": null,
      "layout": null,
      "station": "Kagohara",
      "stationJa": "籠原",
      "line": "JR Takasaki Line",
      "lineJa": "JR高崎線",
      "walkMin": 15,
      "built": null,
      "ageYears": null,
      "zoning": "第1種住居地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Boundaries not clarified (境界非明示) — sold without boundary confirmation",
        "Setback required (セットバック要)",
        "A building stands on the land (上物有り), sold as-is (現況渡し) — demolition cost on the buyer",
        "Small 89.4m² plot, with shadow (日影) restrictions noted",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/11202/030Z21690108/174536001/x1030Z21690108.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      },
      "majorCautions": 1
    }
  ],
  "scoring": {
    "tier": {
      "Kagohara": 6,
      "Kami-Kumagaya": 6,
      "Kumagaya": 8
    },
    "walkBand": [
      21,
      19,
      18
    ],
    "mapsQuery": "埼玉県熊谷市"
  }
};
