window.TADAIMA_DATA = {
  "site": {
    "name": "Tadaima!",
    "nameJa": "ただいま！",
    "edition": "Matsudo",
    "editionJa": "松戸",
    "researchedOn": "2026-11-09",
    "area": "Matsudo City, Chiba",
    "areaJa": "千葉県松戸市"
  },
  "defaults": {
    "budgetMan": 5000,
    "maxWalkMin": 15
  },
  "benchmarks": {
    "landPerTsuboManByStation": {
      "Matsudo": 70,
      "Shin-Matsudo": 64,
      "Kamihongo": 60,
      "Higashi-Matsudo": 60,
      "Minoridai": 58,
      "Tokiwadaira": 55,
      "Yabashira": 55,
      "Shin-Yahashira": 55,
      "Kita-Matsudo": 55,
      "Mabashi": 52,
      "Kita-Kogane": 48,
      "Matsudo-Shinden": 46,
      "Goko": 44,
      "Koganehara": 43,
      "Mutsumi": 34,
      "Yakiri": 53,
      "Motoyama": 44,
      "Akiyama": 57,
      "Koganejoshi": 56
    },
    "note": "Land benchmarks: residential ¥/tsubo by station, triangulated from MLIT transaction data via Utinokati (multi-year, standardised) and 2026 official residential land-price points via Totinokati/tochidai: Matsudo ~70 (official residential average on 14 points; the all-use station average of ~132 mixes station-front commercial plots — Honcho alone is ~422 — and is not used, and quarterly transaction prints swing from 54 to 115 on 5–7 deals), Shin-Matsudo ~64, Kamihongo ~60 (official points thin at 3, corroborated by its house catchment), Minoridai ~58, Kita-Matsudo ~55, Mabashi ~52, Kita-Kogane ~48 (transaction regression 47.8, official 42.5 and all-use 46.9 converge), Matsudo-Shinden ~46, Goko ~44, Mutsumi/Rokujitsu ~34. Higashi-Matsudo is scored at ~60, NOT Utinokati's ~40 regression: that figure is dragged down by urbanisation-control (調整区域) deals in Kamishiki trading at 3–16万円/坪 on 270–1,000m² lots, which are not residential comparables. Yabashira/Shin-Yahashira (~55) and Koganehara (~43, a district with no station of its own, bus to Kita-Kogane) are proxies from official district points and neighbouring-station transactions, flagged as such. Yakiri (~53) rests on an all-use district print only — low confidence; Motoyama (~44), Akiyama (~57) and Koganejoshi (~56) appear in the house file only and rest on district-level prints, flagged as such. Walk bands use Matsudo's observed land gradient — prices fall roughly 30% by a 10-minute walk and 50% by 16+ minutes (city transactions: 85.4万円/坪 within 5 minutes vs 42.8 at 16+); house prices fall only ~12% over the same range. Used houses transacted at about ¥107万/tsubo city-wide (floor-area basis): Matsudo station catchment ~132, Shin-Matsudo ~123, Kamihongo ~129 at the top; by age, ≤10-yr stock ~139 falls to ~65 for 30+-yr stock. The district print of ~362 for Nemoto rests on a handful of non-standard deals and is ignored. Official residential land prices rose +8.0% in the 2026 公示地価 survey (+8.9% in 基準地価, the Tokyo belt's second-fastest rise) — the fourth straight year of acceleration (+2.3% in 2023 to +8.0% in 2026)."
  },
  "properties": [
    {
      "id": "h01",
      "type": "house-new",
      "district": "Goko-nishi 1",
      "districtJa": "五香西1丁目",
      "title": "New 3LDK (GRAFARE, 4 units) — 18帖 LDK, 7 min to Motoyama",
      "priceMan": 3590,
      "priceFrom": false,
      "landM2": 117.89,
      "buildingM2": 92.95,
      "layout": "3LDK",
      "station": "Motoyama",
      "stationJa": "元山",
      "line": "Keisei Matsudo Line",
      "lineJa": "京成松戸線",
      "walkMin": 7,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Housing performance-evaluation certified (design + construction)",
        "18帖 3-face-lit LDK; parking for 2; also 11–13 min from Goko"
      ],
      "cautions": [
        "Part of a 4-unit development — confirm which unit/lot this price buys"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/bh/detail/4/12207/1226010046527/122601/x41226010046527.html",
        "verified": "detail",
        "infoDate": "2026-11-09"
      },
      "priceDropMan": 200
    },
    {
      "id": "h02",
      "type": "house-new",
      "district": "Goko-nishi 2",
      "districtJa": "五香西2丁目",
      "title": "New 3SLDK — 20帖+ living room on a 132m² plot, Goko side",
      "priceMan": 4599,
      "priceFrom": false,
      "landM2": 132.31,
      "buildingM2": 113.85,
      "layout": "3SLDK",
      "station": "Goko",
      "stationJa": "五香",
      "line": "Keisei Matsudo Line",
      "lineJa": "京成松戸線",
      "walkMin": 9,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Largest new-build house here: 113.9m² on 132.3m² of land, living room over 20帖",
        "Parking for 2 in parallel; nursery/kindergarten ~5 min walk"
      ],
      "cautions": [
        "Portal feeds disagree on the walk (8 vs 9 min) — scored here on 9",
        "A second unit in the same development is ¥4,699万",
        "Detail page lists a land-development-works regulation zone (宅地造成工事規制区域), a 10 m height-district limit (高度地区) and a Building Standards Act Art. 22 zone among the legal restrictions"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/bh/detail/4/12207/1349100003419/134910/x41349100003419.html",
        "verified": "detail",
        "infoDate": "2026-10-24"
      }
    },
    {
      "id": "h03",
      "type": "house-new",
      "district": "Goko-nishi 1",
      "districtJa": "五香西1丁目",
      "title": "New 3LDK by Polus — floor heating, 8 min to Goko Station",
      "priceMan": 4930,
      "priceFrom": false,
      "landM2": 104.98,
      "buildingM2": 84.98,
      "layout": "3LDK",
      "station": "Goko",
      "stationJa": "五香",
      "line": "Keisei Matsudo Line",
      "lineJa": "京成松戸線",
      "walkMin": 8,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Polus development of 2 units in a quiet residential block",
        "Floor heating and bathroom dryer fitted"
      ],
      "cautions": [
        "Only this unit falls within the brief — the other unit is ¥5,430万",
        "Compact 85.0m² building for the price",
        "Not yet built — the detail page schedules completion in late Dec 2026 with move-in around mid-Feb 2027"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/bh/detail/12207/030/Z/21282761.html",
        "verified": "detail",
        "infoDate": "2026-10-21"
      }
    },
    {
      "id": "h04",
      "type": "house-new",
      "district": "Goko-minami 2",
      "districtJa": "五香南2丁目",
      "title": "New 4LDK single-storey (平屋) — rare one-floor plan, 3 min to Motoyama",
      "priceMan": 4999,
      "priceFrom": false,
      "landM2": 116.7,
      "buildingM2": 107.65,
      "layout": "4LDK",
      "station": "Motoyama",
      "stationJa": "元山",
      "line": "Keisei Matsudo Line",
      "lineJa": "京成松戸線",
      "walkMin": 3,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Single-storey new build — no stairs, 107.7m² all on one floor",
        "Shortest walk of any new build here (3 min)"
      ],
      "cautions": [
        "Priced at ¥4,999万 — effectively at this collection's ceiling, no headroom",
        "Single-storey format carries a price premium per m²"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/bh/detail/1/12207/030Z21406541/185883001/x1030Z21406541.html",
        "verified": "detail",
        "infoDate": "2026-10-20"
      }
    },
    {
      "id": "h06",
      "type": "house-new",
      "district": "Takatsuka-Shinden",
      "districtJa": "高塚新田",
      "title": "New 4LDK on a 149m² plot — performance-evaluated, parking for 2+",
      "priceMan": 4990,
      "priceFrom": false,
      "landM2": 148.96,
      "buildingM2": 103.3,
      "layout": "4LDK",
      "station": "Ichikawa-Ono",
      "stationJa": "市川大野",
      "line": "JR Musashino Line",
      "lineJa": "JR武蔵野線",
      "walkMin": 13,
      "built": "New build",
      "ageYears": 0,
      "highlights": [
        "Generous 149.0m² plot — the largest of the new builds here",
        "Housing performance-evaluation certified (design + construction)"
      ],
      "cautions": [
        "At the price ceiling (¥4,990万)",
        "The usable station, Ichikawa-Ono, is across the border in Ichikawa City — Matsudo-side stations are 29–30 min away",
        "Not yet built — the detail page schedules completion in Dec 2026"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/bh/detail/12207/030/Z/21923128.html",
        "verified": "detail",
        "infoDate": "2026-10-19"
      }
    },
    {
      "id": "h07",
      "type": "house-used",
      "district": "Mutsumi 3",
      "districtJa": "六実3丁目",
      "title": "Used 4LDK (2015) — corner lot, 21帖 south-facing LDK, 5 min to Mutsumi",
      "priceMan": 3350,
      "priceFrom": false,
      "landM2": 110.63,
      "buildingM2": 95.22,
      "layout": "4LDK",
      "station": "Mutsumi",
      "stationJa": "六実",
      "line": "Tobu Urban Park Line",
      "lineJa": "東武野田線",
      "walkMin": 5,
      "built": "May 2015",
      "ageYears": 11,
      "highlights": [
        "Lightweight steel-frame build on a corner plot with roads on two sides (N 4m / W 4m)",
        "Waterworks and interior renovated Jul 2026 (kitchen, toilet, entrance door, washroom); primary school 7 min, supermarket 5 min"
      ],
      "cautions": [
        "Zoning is shown as 'unspecified' (無指定) on the detail page — verify planning/building status before purchase",
        "The 2026 renovation covered finishes and waterworks, not the structure",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/12207/030Z21592279/136844001/x1030Z21592279.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "h09",
      "type": "house-used",
      "district": "Goko 4",
      "districtJa": "五香4丁目",
      "title": "Used 4LDK (1994), renovated inside and out Sep 2026 — under ¥2,800万",
      "priceMan": 2799,
      "priceFrom": false,
      "landM2": 102.49,
      "buildingM2": 100.79,
      "layout": "4LDK",
      "station": "Motoyama",
      "stationJa": "元山",
      "line": "Keisei Matsudo Line",
      "lineJa": "京成松戸線",
      "walkMin": 11,
      "built": "Feb 1994",
      "ageYears": 32,
      "highlights": [
        "Renovation completed Sep 2026: new kitchen, bath, toilets and washstand, exterior/roof repainted, termite inspection done",
        "All rooms 6帖 or larger; toilets on both floors; primary school 6 min walk"
      ],
      "cautions": [
        "Another portal feed for this house notes a floor-area reduction (減築) is planned and a 0.5m² corner-cut (隅切り) applies — verify the scope and timing of those works before purchase",
        "Parking for 1 car only; 1994 timber structure underneath the renovation",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/12207/030Z21867007/163519004/x1030Z21867007.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "h10",
      "type": "house-used",
      "district": "Hiraga",
      "districtJa": "平賀",
      "title": "Used 3LDK (1996), renovated Sep 2026 — cheapest renovated house here, Kita-Kogane side",
      "priceMan": 2280,
      "priceFrom": false,
      "landM2": 119.39,
      "buildingM2": 91.9,
      "layout": "3LDK",
      "station": "Kita-Kogane",
      "stationJa": "北小金",
      "line": "JR Joban Line",
      "lineJa": "JR常磐線",
      "walkMin": 12,
      "built": "Jun 1996",
      "ageYears": 30,
      "highlights": [
        "Interior/exterior renovation completed Sep 2026 (waterworks, water heater, wallpaper/flooring)",
        "Wide 13.5m frontage on a 5.5m public road in a First Low-Rise Residential zone; all rooms over 6帖 with storage"
      ],
      "cautions": [
        "1996 structure — the 2026 works were finishes and fittings, not structural renewal",
        "The detail page lists an 8.05m² private-road area (私道面積) within the plot"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/12207/030Z21916262/163519001/x1030Z21916262.html",
        "verified": "detail",
        "infoDate": "2026-11-01"
      }
    },
    {
      "id": "h11",
      "type": "house-used",
      "district": "Oganehara 5",
      "districtJa": "大金平5丁目",
      "title": "Used 3LDK (1986) at ¥2,490万 — honest older house, partial 2025 reform only",
      "priceMan": 2490,
      "priceFrom": false,
      "landM2": 117.89,
      "buildingM2": 89.42,
      "layout": "3LDK",
      "station": "Koganejoshi",
      "stationJa": "小金城趾",
      "line": "Nagareyama Line",
      "lineJa": "流鉄流山線",
      "walkMin": 12,
      "built": "Mar 1986",
      "ageYears": 40,
      "highlights": [
        "Priced as an older house: 117.9m² plot a 12-minute walk from Koganejoshi Station",
        "Layout can be changed to 4LDK (at extra cost, per listing)"
      ],
      "cautions": [
        "40-year-old structure (Mar 1986) — post-1981 seismic standard, but budget for ageing fabric",
        "The May 2025 reform was partial only (unit bath, taps, wet-area flooring/wallpaper) — not a full renovation"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/12207/030Z20896281/000466033/x1030Z20896281.html",
        "verified": "detail",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h13",
      "type": "house-used",
      "district": "Akiyama",
      "districtJa": "秋山",
      "title": "Used 2SDK (2001) — shuttered garage, south road, 5 min to Akiyama Station",
      "priceMan": 3180,
      "priceFrom": false,
      "landM2": 91.67,
      "buildingM2": 89.63,
      "layout": "2SDK",
      "station": "Akiyama",
      "stationJa": "秋山",
      "line": "Hokuso Line",
      "lineJa": "北総線",
      "walkMin": 5,
      "built": "Jun 2001",
      "ageYears": 25,
      "highlights": [
        "Shuttered garage plus space for a second car; south-facing balcony",
        "Supermarket 2 min walk; quiet residential block"
      ],
      "cautions": [
        "Compact 91.7m² plot",
        "Unconventional 2SDK layout (2 rooms + storage + DK) — check actual room sizes in person",
        "Detail page lists the Cultural Properties Protection Act (文化財保護法) and the Landscape Act (景観法) among the legal restrictions"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/12207/030Z21528108/087394001/x1030Z21528108.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      },
      "majorCautions": 1
    },
    {
      "id": "h14",
      "type": "house-used",
      "district": "Goko-nishi 2",
      "districtJa": "五香西2丁目",
      "title": "Used 2LDK Hebel House (2016) — solar + battery, fully renovated Aug 2026",
      "priceMan": 3980,
      "priceFrom": false,
      "landM2": 115.11,
      "buildingM2": 86.47,
      "layout": "2LDK",
      "station": "Goko",
      "stationJa": "五香",
      "line": "Keisei Matsudo Line",
      "lineJa": "京成松戸線",
      "walkMin": 8,
      "built": "Jan 2016",
      "ageYears": 10,
      "highlights": [
        "Asahi Kasei Hebel House: lightweight steel frame with solar panels, storage battery and EcoCute (all-electric)",
        "Fully renovated Aug 2026; parking for 3"
      ],
      "cautions": [
        "Only 2LDK at ¥3,980万 — you are paying for the Hebel build quality, energy kit and condition, not room count",
        "Detail page lists Landscape Act (景観法) regulation, a height district (高度地区) and a landscape district (景観地区) among the legal restrictions"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/12207/030Z21263214/030225019/x1030Z21263214.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "h15",
      "type": "house-used",
      "district": "Kanegasaku",
      "districtJa": "金ケ作",
      "title": "Used 4LDK (2017) on 186m² with a wide garden — two stations, two lines",
      "priceMan": 3280,
      "priceFrom": false,
      "landM2": 186.04,
      "buildingM2": 105.7,
      "layout": "4LDK",
      "station": "Shin-Yahashira",
      "stationJa": "新八柱",
      "line": "JR Musashino Line",
      "lineJa": "JR武蔵野線",
      "walkMin": 10,
      "built": "Feb 2017",
      "ageYears": 9,
      "highlights": [
        "Large 186.0m² plot with an unobstructed sunny garden",
        "Also 10 min from Yahashira (Keisei Matsudo Line) — two lines usable"
      ],
      "cautions": [
        "Large-lot fringe district — daily life is car-friendly; both stations are a full 10-minute walk",
        "Detail page lists a Building Standards Act Art. 22 zone (建基法22条区域) and a Type-1 height district (第1種高度地区) among the legal restrictions",
        "The layout is effectively 4SLDK — the detail page's own remarks and another portal feed count a storage room (納戸) that the headline 4LDK omits"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/12207/030Z21972171/116518067/x1030Z21972171.html",
        "verified": "detail",
        "infoDate": "2026-10-23"
      }
    },
    {
      "id": "h16",
      "type": "house-used",
      "district": "Koda 5",
      "districtJa": "幸田5丁目",
      "title": "Used 3LDK built Dec 2019 — big 114m² house on 164m², Kita-Kogane side",
      "priceMan": 3680,
      "priceFrom": false,
      "landM2": 164.22,
      "buildingM2": 114.27,
      "layout": "3LDK",
      "station": "Kita-Kogane",
      "stationJa": "北小金",
      "line": "JR Joban Line",
      "lineJa": "JR常磐線",
      "walkMin": 15,
      "built": "Dec 2019",
      "ageYears": 6,
      "highlights": [
        "Nearly new (2019) and generously sized: 114.3m² house on 164.2m² of land",
        "All-electric with bathroom dryer; parking for 3; schools and parks within walking distance"
      ],
      "cautions": [
        "At the 15-minute walk limit of this collection, and Kita-Kogane is the only practical station",
        "Detail page lists the cliff ordinance (がけ条例), the Landscape Act (景観法), a maximum height limit and an Art. 22 zone among the legal restrictions — the cliff-ordinance listing warrants a slope/retaining-wall check",
        "Handover is not immediate — the listing text states delivery around mid-March 2027 (the detail page shows 引渡時期: 相談)"
      ],
      "source": {
        "name": "goo住宅・不動産",
        "url": "https://house.goo.ne.jp/buy/uh/detail/1/12207/030Z20604701/176213001/x1030Z20604701.html",
        "verified": "detail",
        "infoDate": "2026-10-23"
      },
      "majorCautions": 1
    },
    {
      "id": "l01",
      "type": "land",
      "district": "Tokiwadaira 1",
      "districtJa": "常盤平1丁目",
      "title": "3 minutes from Tokiwadaira Station — building on site, land still registered as forest",
      "priceMan": 2700,
      "priceFrom": false,
      "landM2": 115,
      "buildingM2": null,
      "layout": null,
      "station": "Tokiwadaira",
      "stationJa": "常盤平",
      "line": "Keisei Matsudo Line",
      "lineJa": "京成松戸線",
      "walkMin": 3,
      "built": null,
      "ageYears": null,
      "zoning": "第1種住居地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "Flat 3-minute walk to Tokiwadaira Station; station-front shops nearby",
        "6.8m of frontage onto an east 8m road; full utilities (city gas, water, mains sewer)",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "A building stands on the land (上物有り), sold as-is (現況渡し) — demolition cost and effort on the buyer",
        "Registered land category is forest (地目：山林), not residential land (宅地) — confirm the conversion/development procedures needed before building",
        "Handover only after a definitive survey (確定測量後引渡し)",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/12207/030Z21861147/025659000/x1030Z21861147.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      },
      "majorCautions": 1
    },
    {
      "id": "l02",
      "type": "land",
      "district": "Korokudai",
      "districtJa": "胡録台",
      "title": "134m² low-rise plot 5 min from Kamihongo — only 3m of frontage",
      "priceMan": 4280,
      "priceFrom": false,
      "landM2": 134.82,
      "buildingM2": null,
      "layout": null,
      "station": "Kamihongo",
      "stationJa": "上本郷",
      "line": "Keisei Matsudo Line",
      "lineJa": "京成松戸線",
      "walkMin": 5,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "50% / 100%",
      "highlights": [
        "Flat 5-minute walk to Kamihongo Station in a quiet low-rise residential area",
        "Supermarket within a 10-minute walk",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "A building stands on the land (上物有り), sold as-is (現況渡し) — demolition cost and effort on the buyer",
        "Narrow frontage: only 3m onto the NW 6m road — check vehicle access and rebuild design carefully",
        "Only city gas is listed among the utilities on the page — water and sewer connections not stated, confirm before purchase",
        "10m height limit applies in this low-rise zone",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/12207/030Z21578689/000232226/x1030Z21578689.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l03",
      "type": "land",
      "district": "Tokiwadaira 5",
      "districtJa": "常盤平5丁目",
      "title": "Vacant NW-corner lot 5 min from Goko — handover late November",
      "priceMan": 2680,
      "priceFrom": false,
      "landM2": 115.98,
      "buildingM2": null,
      "layout": null,
      "station": "Goko",
      "stationJa": "五香",
      "line": "Keisei Matsudo Line",
      "lineJa": "京成松戸線",
      "walkMin": 5,
      "built": null,
      "ageYears": null,
      "zoning": "第1種住居地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "Vacant land delivered vacant (更地渡し) — no demolition cost",
        "NW corner lot (角地) on two ~6m public roads, flat plot",
        "Supermarket 3 min on foot, park 1 min",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Handover is scheduled for late November 2026, not immediate",
        "North-side frontage is only 3.3m — the usable frontage is the 12.2m west side",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/12207/030Z21403566/006050527/x1030Z21403566.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l04",
      "type": "land",
      "district": "Kuriyama",
      "districtJa": "栗山",
      "title": "Vacant regular-shaped lot near Yakiri Station — cliff ordinance applies",
      "priceMan": 1850,
      "priceFrom": false,
      "landM2": 98.05,
      "buildingM2": null,
      "layout": null,
      "station": "Yakiri",
      "stationJa": "矢切",
      "line": "Hokuso Line",
      "lineJa": "北総線",
      "walkMin": 7,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "50% / 100%",
      "highlights": [
        "Vacant land delivered vacant (更地渡し), immediate handover (即引渡し可)",
        "Regular-shaped flat plot (整形地) in a quiet low-rise street; full utilities (city gas, water, mains sewer)",
        "Bus stop 6 min away for Ichikawa and Matsudo stations",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Cliff ordinance applies (がけ条例あり) — retaining/building restrictions near the slope to confirm",
        "Road frontage details are not stated on the listing page — verify access on site",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/12207/030Z79226095/101849001/x1030Z79226095.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l05",
      "type": "land",
      "district": "Kogane",
      "districtJa": "小金",
      "title": "Vacant lot on an 8m road, 9 min from Kita-Kogane — buyer-use restriction applies",
      "priceMan": 3850,
      "priceFrom": false,
      "landM2": 111.7,
      "buildingM2": null,
      "layout": null,
      "station": "Kita-Kogane",
      "stationJa": "北小金",
      "line": "JR Joban Line",
      "lineJa": "JR常磐線",
      "walkMin": 9,
      "built": null,
      "ageYears": null,
      "zoning": "第1種住居地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "Vacant land (更地), regular-shaped plot (整形地) on a wide north 8m road",
        "Immediate handover (即引渡し可); elementary school 4 min on foot",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Contract restriction (契約制限有): the sale is aimed at buyers planning a wooden house of up to 3 floors with no basement, or vacant-land use",
        "Price is quoted as bare-land value (素地価格)",
        "Verified on the listing page (information date 2026-10-18)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/12207/030Z21895300/178996005/x1030Z21895300.html",
        "verified": "detail",
        "infoDate": "2026-10-18"
      }
    },
    {
      "id": "l06",
      "type": "land",
      "district": "Kubohiraga",
      "districtJa": "久保平賀",
      "title": "Cheapest Kita-Kogane-side lot here — building on site, registry area only",
      "priceMan": 1980,
      "priceFrom": false,
      "landM2": 106.42,
      "buildingM2": null,
      "layout": null,
      "station": "Kita-Kogane",
      "stationJa": "北小金",
      "line": "JR Joban Line",
      "lineJa": "JR常磐線",
      "walkMin": 9,
      "built": null,
      "ageYears": null,
      "zoning": "準住居地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "Fronts a wide 12m north public road",
        "Listing notes a station-area redevelopment project has been decided for Kita-Kogane",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "A building stands on the land (上物有り) — demolition cost and effort on the buyer",
        "Stated area is the registry figure (公簿), not a measured survey — actual area may differ",
        "Only city gas is listed among the utilities on the page — water and sewer connections not stated, confirm before purchase",
        "Verified on the listing page (information date 2026-10-03)"
      ],
      "source": {
        "name": "goo住宅・不動産 (LIFULL HOME'S feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/4/12207/84070019597/8407/x484070019597.html",
        "verified": "detail",
        "infoDate": "2026-10-03"
      }
    },
    {
      "id": "l07",
      "type": "land",
      "district": "Shin-Matsudo-Minami 1",
      "districtJa": "新松戸南1丁目",
      "title": "Vacant lot 11 min from Shin-Matsudo — a third of it is flag-pole strip",
      "priceMan": 3799,
      "priceFrom": false,
      "landM2": 76.8,
      "buildingM2": null,
      "layout": null,
      "station": "Shin-Matsudo",
      "stationJa": "新松戸",
      "line": "JR Joban Line",
      "lineJa": "JR常磐線",
      "walkMin": 11,
      "built": null,
      "ageYears": null,
      "zoning": "第1種低層住居専用地域",
      "coverageFar": "50% / 100%",
      "highlights": [
        "No setback required (セットバック無); fronts a north 8.9m public road",
        "Second station usable: Koya (Ryutetsu Nagareyama Line) 12 min",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Headline area includes about 32m² of flag-pole access strip (路地状部分) — the effective building plot is roughly 76.8m²",
        "Currently used as a car park (現況：駐車場)",
        "Water, sewer and gas connections are at the buyer's cost (上下水・ガス引込買主負担)",
        "Verified on the listing page (information date 2026-10-19)"
      ],
      "source": {
        "name": "goo住宅・不動産 (LIFULL HOME'S feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/4/12207/1230340085714/123034/x41230340085714.html",
        "verified": "detail",
        "infoDate": "2026-10-19"
      }
    },
    {
      "id": "l08",
      "type": "land",
      "district": "Shin-Matsudo 3",
      "districtJa": "新松戸3丁目",
      "title": "South-facing plot on an 11.9m road by Shin-Matsudo — vacant-land delivery",
      "priceMan": 4480,
      "priceFrom": false,
      "landM2": 101.25,
      "buildingM2": null,
      "layout": null,
      "station": "Shin-Matsudo",
      "stationJa": "新松戸",
      "line": "JR Joban Line",
      "lineJa": "JR常磐線",
      "walkMin": 12,
      "built": null,
      "ageYears": null,
      "zoning": "第1種中高層住居専用地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "Vacant-land delivery (更地渡し) — no demolition cost",
        "South-facing, 8.8m of frontage onto an 11.9m road; regular-shaped plot (整形地)",
        "Three stations usable: Shin-Matsudo 12 min, Higashi-Matsudo (Musashino Line) 12 min, Koya 14 min",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "Handover timing is by consultation (引渡可能時期：相談)",
        "Verified on the listing page (information date 2026-10-22)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/12207/030Z21852776/006160041/x1030Z21852776.html",
        "verified": "detail",
        "infoDate": "2026-10-22"
      }
    },
    {
      "id": "l09",
      "type": "land",
      "district": "Futatsugi",
      "districtJa": "二ツ木",
      "title": "138m² corner plot by Mabashi at the lowest ¥/tsubo — survey still pending",
      "priceMan": 2190,
      "priceFrom": false,
      "landM2": 138.35,
      "buildingM2": null,
      "layout": null,
      "station": "Mabashi",
      "stationJa": "馬橋",
      "line": "Ryutetsu Nagareyama Line",
      "lineJa": "流鉄流山線",
      "walkMin": 12,
      "built": null,
      "ageYears": null,
      "zoning": "準住居地域",
      "coverageFar": "60% / 200%",
      "highlights": [
        "Corner lot (角地) on two roads, regular-shaped (整形地)",
        "Lowest ¥/tsubo in this collection (¥52.3万, computed)",
        "Two lines at one station: JR Joban Line Mabashi is also 12 min",
        "No building condition (建築条件なし) — choose your own builder"
      ],
      "cautions": [
        "A building stands on the land (上物有り), sold as-is (現況渡し) — demolition cost and effort on the buyer",
        "Cliff ordinance applies (がけ条例)",
        "Definitive survey not yet completed (確定測量未了) — the stated area and dimensions may change",
        "Possible boundary encroachment (越境) is noted by the agent and sold as-is",
        "Type-1 height district (高度地区第1種) restrictions apply",
        "Verified on the listing page (information date 2026-10-21)"
      ],
      "source": {
        "name": "goo住宅・不動産 (SUUMO feed)",
        "url": "https://house.goo.ne.jp/buy/la/detail/1/12207/030Z77126660/122925069/x1030Z77126660.html",
        "verified": "detail",
        "infoDate": "2026-10-21"
      },
      "majorCautions": 2
    }
  ],
  "scoring": {
    "tier": {
      "Matsudo": 8,
      "Shin-Matsudo": 6,
      "Higashi-Matsudo": 6
    },
    "walkBand": [
      85,
      60,
      46
    ],
    "mapsQuery": "千葉県松戸市"
  }
};
