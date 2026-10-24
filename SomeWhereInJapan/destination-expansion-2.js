(function attachDestinationExpansionTwo(root){
'use strict';
const additions=[
  {
    "region": "Hokkaido",
    "name": "Cape Soya",
    "place": "Wakkanai · Hokkaido",
    "description": "At Japan’s northernmost headland, wind moves across a low, open coastline and the sea stretches toward Sakhalin. Come for the scale and the feeling of reaching the edge of the map.",
    "tags": [
      "Nature",
      "Slow travel"
    ],
    "months": [
      6,
      7,
      8,
      9
    ],
    "seasonReason": "Long summer days make the exposed cape easier to enjoy; wind and visibility can change quickly, so bring a layer.",
    "illustration": "coast",
    "alt": "Sunset light across the open headland at Cape Soya",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Sunset_of_Cape_Soya.jpg/1280px-Sunset_of_Cape_Soya.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Sunset_of_Cape_Soya.jpg",
      "credit": "Searobin",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
      "alt": "Sunset light across the open headland at Cape Soya"
    }
  },
  {
    "region": "Hokkaido",
    "name": "Lake Akan",
    "place": "Akan · Kushiro, Hokkaido",
    "description": "A volcanic lake ringed by forest and mountains, with boats, lakeside walks, and the Ainu settlement of Akanko Onsen nearby. Slow down for the water and learn about the region’s living Ainu culture.",
    "tags": [
      "Nature",
      "Culture"
    ],
    "months": [
      5,
      6,
      7,
      8,
      9,
      10
    ],
    "seasonReason": "Late spring through autumn is comfortable for lakeside walks and boat outings; check local services and weather before travelling.",
    "illustration": "lake",
    "alt": "Lake Akan and its forested volcanic shoreline",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Lake_Akan_20140809.jpg/1280px-Lake_Akan_20140809.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Lake_Akan_20140809.jpg",
      "credit": "Suicasmo",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "Lake Akan and its forested volcanic shoreline"
    }
  },
  {
    "region": "Hokkaido",
    "name": "Asahidake Ropeway",
    "place": "Higashikawa · Hokkaido",
    "description": "Ride from the forest toward Hokkaido’s highest mountain, where short alpine paths open onto volcanic terrain and wide views. The landscape changes quickly with elevation, clouds, and season.",
    "tags": [
      "Nature"
    ],
    "months": [
      7,
      8,
      9,
      10
    ],
    "seasonReason": "Late summer brings alpine flowers and early autumn color; mountain weather can turn quickly, so check ropeway operation and trail conditions.",
    "illustration": "mountain",
    "alt": "The Asahidake Ropeway climbing into Hokkaido’s alpine landscape",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Asahidake_Ropeway%2C_Hokkaido%2C_April_2023_03.jpg/1280px-Asahidake_Ropeway%2C_Hokkaido%2C_April_2023_03.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Asahidake_Ropeway,_Hokkaido,_April_2023_03.jpg",
      "credit": "Calistemon",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "The Asahidake Ropeway climbing into Hokkaido’s alpine landscape"
    }
  },
  {
    "region": "Hokkaido",
    "name": "Ningle Terrace",
    "place": "Furano · Hokkaido",
    "description": "Small timber craft cottages sit among the trees beside a forest path, creating a gentle pause outside central Furano. Browse the workshops slowly and let the woodland setting set the pace.",
    "tags": [
      "Culture",
      "Slow travel"
    ],
    "months": [
      1,
      2,
      7,
      8,
      9,
      12
    ],
    "seasonReason": "Snowy evenings and green summer woods give the forest cottages very different moods; check the current opening schedule before visiting.",
    "illustration": "village",
    "alt": "Wooden craft cottages tucked into the forest at Ningle Terrace",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/130503_Ningle_Terrace_Furano_Hokkaido_Japan05s10.jpg/1280px-130503_Ningle_Terrace_Furano_Hokkaido_Japan05s10.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:130503_Ningle_Terrace_Furano_Hokkaido_Japan05s10.jpg",
      "credit": "663highland",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "Wooden craft cottages tucked into the forest at Ningle Terrace"
    }
  },
  {
    "region": "Hokkaido",
    "name": "Upopoy National Ainu Museum",
    "place": "Shiraoi · Hokkaido",
    "description": "A museum and cultural park centered on Ainu history, language, art, and contemporary life. Give the exhibitions time, then explore the lakeside grounds with curiosity and respect.",
    "tags": [
      "Culture",
      "Slow travel"
    ],
    "months": [
      4,
      5,
      6,
      7,
      8,
      9,
      10
    ],
    "seasonReason": "The indoor galleries work in any weather; spring through autumn makes it easier to enjoy the wider lakeside grounds.",
    "illustration": "museum",
    "alt": "The Upopoy National Ainu Museum and its lakeside grounds in Shiraoi",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Shiraoi-upopoy_38.jpg/1280px-Shiraoi-upopoy_38.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Shiraoi-upopoy_38.jpg",
      "credit": "Higa4",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "alt": "The Upopoy National Ainu Museum and its lakeside grounds in Shiraoi"
    }
  },
  {
    "region": "Hokkaido",
    "name": "Abashiri Prison Museum",
    "place": "Abashiri · Hokkaido",
    "description": "Historic prison buildings and exhibits trace the difficult history of incarceration and the development of Japan’s far north. Walk the open-air grounds thoughtfully and allow time for the stories behind the architecture.",
    "tags": [
      "Culture",
      "Slow travel"
    ],
    "months": [
      5,
      6,
      7,
      8,
      9,
      10
    ],
    "seasonReason": "The open-air site is most comfortable from late spring into autumn; snow and cold can make the grounds more demanding in winter.",
    "illustration": "museum",
    "alt": "Historic timber buildings at the Abashiri Prison Museum",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/86/130713_Abashiri_Prison_Museum_Abashiri_Hokkaido_Japan08n.jpg/1280px-130713_Abashiri_Prison_Museum_Abashiri_Hokkaido_Japan08n.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:130713_Abashiri_Prison_Museum_Abashiri_Hokkaido_Japan08n.jpg",
      "credit": "663highland",
      "license": "CC BY 2.5",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.5",
      "alt": "Historic timber buildings at the Abashiri Prison Museum"
    }
  },
  {
    "region": "Tohoku",
    "name": "Hakkoda Ropeway",
    "place": "Aomori · Aomori",
    "description": "The gondola climbs over a volcanic mountain range, opening views toward forest, wetlands, and the broad Aomori landscape. At the top, choose a short lookout or a longer trail only if conditions suit.",
    "tags": [
      "Nature"
    ],
    "months": [
      1,
      2,
      3,
      6,
      7,
      8,
      9,
      10
    ],
    "seasonReason": "Winter snow and autumn color are striking but bring very different conditions; check ropeway operation and summit weather on the day.",
    "illustration": "mountain",
    "alt": "A ropeway cabin crossing the wooded Hakkoda mountain range",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Hakkoda_Ropeway_2019.jpg/1280px-Hakkoda_Ropeway_2019.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Hakkoda_Ropeway_2019.jpg",
      "credit": "Marho",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "A ropeway cabin crossing the wooded Hakkoda mountain range"
    }
  },
  {
    "region": "Tohoku",
    "name": "Oga Namahage Museum",
    "place": "Oga · Akita",
    "description": "Discover the striking masks and local stories behind Namahage, the New Year tradition of Oga. The displays make a strong cultural stop in any season; approach the folklore as a living local practice.",
    "tags": [
      "Culture"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "An indoor visit suits every season; winter adds context to the New Year tradition, while coastal conditions vary through the year.",
    "illustration": "museum",
    "alt": "The entrance to the Namahage Museum on Oga Peninsula",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/Entrance_of_Namahage_Museum%2C_Oga%2C_Akita.JPG/1280px-Entrance_of_Namahage_Museum%2C_Oga%2C_Akita.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Entrance_of_Namahage_Museum,_Oga,_Akita.JPG",
      "credit": "Kumpei Shiraishi",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "alt": "The entrance to the Namahage Museum on Oga Peninsula"
    }
  },
  {
    "region": "Tohoku",
    "name": "Hachimantai Aspite Line",
    "place": "Hachimantai · Iwate and Akita",
    "description": "A high mountain road crosses a landscape of forest, open ridges, and volcanic scenery. Stop at designated viewpoints, stay aware of road conditions, and treat the weather as part of the plan.",
    "tags": [
      "Nature",
      "Slow travel"
    ],
    "months": [
      4,
      5,
      6,
      9,
      10
    ],
    "seasonReason": "The mountain route is seasonal and can close in winter; spring opening and autumn color are memorable, but verify current road access first.",
    "illustration": "mountain",
    "alt": "A winding road crossing the high Hachimantai mountain landscape",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Hachimantai_Aspite_Line.jpg/1280px-Hachimantai_Aspite_Line.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Hachimantai_Aspite_Line.jpg",
      "credit": "Thyristorchopper",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "alt": "A winding road crossing the high Hachimantai mountain landscape"
    }
  },
  {
    "region": "Tohoku",
    "name": "Genbikei Gorge",
    "place": "Ichinoseki · Iwate",
    "description": "Clear water threads through volcanic rock, rapids, and green banks along a compact riverside walk. Look for the famous basket-and-cable dango delivery across the gorge when it is operating.",
    "tags": [
      "Nature",
      "Food"
    ],
    "months": [
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Fresh spring growth and autumn leaves frame the gorge; riverside paths and local services can be affected by weather.",
    "illustration": "gorge",
    "alt": "The river and rock formations of Genbikei Gorge",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/230727_Genbikei_Ichinoseki_Iwate_pref_Japan02s3.jpg/1280px-230727_Genbikei_Ichinoseki_Iwate_pref_Japan02s3.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:230727_Genbikei_Ichinoseki_Iwate_pref_Japan02s3.jpg",
      "credit": "663highland",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "The river and rock formations of Genbikei Gorge"
    }
  },
  {
    "region": "Tohoku",
    "name": "Akiu Great Falls",
    "place": "Sendai · Miyagi",
    "description": "A powerful waterfall drops into a wooded ravine west of central Sendai. View it from above or follow the descent toward the river only if the path and weather conditions are suitable.",
    "tags": [
      "Nature"
    ],
    "months": [
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Spring water and autumn color add drama to the valley; rain can make the descent slippery, so check local trail guidance.",
    "illustration": "waterfall",
    "alt": "Akiu Great Falls dropping into a forested ravine",
    "image": "",
    "photo": {
      "url": "https://upload.wikimedia.org/wikipedia/commons/c/c7/Akiu_Otaki.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
      "source": "https://commons.wikimedia.org/wiki/File:Akiu_Otaki.jpg",
      "credit": "Stu",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
      "alt": "Akiu Great Falls dropping into a forested ravine"
    }
  },
  {
    "region": "Kanto",
    "name": "teamLab Borderless",
    "place": "Azabudai Hills · Tokyo",
    "description": "A large digital art museum where projected environments flow between rooms and respond to movement. Follow your curiosity rather than a fixed route, and reserve enough time to explore without rushing.",
    "tags": [
      "Culture"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "A fully indoor experience works throughout the year; timed entry and current ticket rules should be checked before you go.",
    "illustration": "museum",
    "alt": "Immersive digital artworks inside teamLab Borderless in Tokyo",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/TeamLab_Borderless_Azabudai_Hills.jpg/1280px-TeamLab_Borderless_Azabudai_Hills.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:TeamLab_Borderless_Azabudai_Hills.jpg",
      "credit": "DannyWithLove",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "Immersive digital artworks inside teamLab Borderless in Tokyo"
    }
  },
  {
    "region": "Kanto",
    "name": "Yokohama Chinatown",
    "place": "Naka · Yokohama",
    "description": "Lanterns, ornate gates, and tightly packed restaurants give this historic port district its own rhythm. Come hungry, look beyond the busiest avenue, and make time for the smaller streets and temple courtyard.",
    "tags": [
      "Food",
      "Culture"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "The dining streets stay lively through the year; festivals and weekends bring larger crowds, so allow extra time then.",
    "illustration": "food",
    "alt": "Colorful streets and traditional architecture in Yokohama Chinatown",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Yokohama_Chinatown_4.jpg/1280px-Yokohama_Chinatown_4.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Yokohama_Chinatown_4.jpg",
      "credit": "Syced",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "alt": "Colorful streets and traditional architecture in Yokohama Chinatown"
    }
  },
  {
    "region": "Kanto",
    "name": "Edo Wonderland Nikko Edomura",
    "place": "Nikko · Tochigi",
    "description": "A theme park recreates Edo-period streets with costumed performers, stage shows, and hands-on cultural activities. Check the performance schedule on arrival and leave room to wander between the main attractions.",
    "tags": [
      "Culture",
      "Slow travel"
    ],
    "months": [
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11
    ],
    "seasonReason": "Spring and autumn are comfortable for the outdoor streets; show schedules and operating days vary, so check the calendar before travelling.",
    "illustration": "themepark",
    "alt": "A reconstructed Edo-period street at Nikko Edomura",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Edo_Wonderland_Nikko_Edomura_01.JPG/1280px-Edo_Wonderland_Nikko_Edomura_01.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Edo_Wonderland_Nikko_Edomura_01.JPG",
      "credit": "Abasaa",
      "license": "Public domain",
      "licenseUrl": "https://commons.wikimedia.org/wiki/File:Edo_Wonderland_Nikko_Edomura_01.JPG",
      "alt": "A reconstructed Edo-period street at Nikko Edomura"
    }
  },
  {
    "region": "Kanto",
    "name": "Oya History Museum",
    "place": "Utsunomiya · Tochigi",
    "description": "Walk through vast underground chambers carved from Oya stone, where dramatic scale and shifting light reveal the quarry’s industrial past. Bring a light layer: the underground temperature feels different from the city above.",
    "tags": [
      "Culture"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "The underground galleries offer a weather-proof visit year-round; check current entry times and event closures before setting out.",
    "illustration": "museum",
    "alt": "The enormous underground stone chambers of Oya History Museum",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/40/Oya_History_Museum_%2822146304608%29.jpg/1280px-Oya_History_Museum_%2822146304608%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Oya_History_Museum_(22146304608).jpg",
      "credit": "Hiroshi Nakai",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "alt": "The enormous underground stone chambers of Oya History Museum"
    }
  },
  {
    "region": "Kanto",
    "name": "Mother Farm",
    "fullDay": true,
    "place": "Futtsu · Chiba",
    "description": "Rolling pasture, seasonal flower fields, and animal encounters make this an easygoing countryside day from Tokyo Bay. Distances are long, so check the day’s shows and choose a few areas rather than racing around.",
    "tags": [
      "Nature",
      "Slow travel"
    ],
    "months": [
      2,
      3,
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Flower displays and farm activities change through the year; check the current seasonal guide and weather before choosing a date.",
    "illustration": "farm",
    "alt": "Open countryside and farm fields at Mother Farm in Chiba",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Chiba_Mother_farm_Nemophila_xl.jpg/1280px-Chiba_Mother_farm_Nemophila_xl.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Chiba_Mother_farm_Nemophila_xl.jpg",
      "credit": "kiki_1313",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "alt": "Open countryside and farm fields at Mother Farm in Chiba"
    }
  },
  {
    "region": "Kanto",
    "name": "Hasedera Temple, Kamakura",
    "place": "Hase · Kamakura",
    "description": "A hillside temple pairs a calm garden and viewing terraces with an intimate feel above the coastal town. Take the path at an unhurried pace and notice how the view opens between the trees.",
    "tags": [
      "Culture",
      "Nature"
    ],
    "months": [
      3,
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Spring flowers and autumn foliage are highlights; the hillside steps and popular bloom periods can be busy.",
    "illustration": "temple",
    "alt": "Temple buildings and green hillside at Hasedera in Kamakura",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Hasedera_temple_in_Kamakura_%282576768994%29.jpg/1280px-Hasedera_temple_in_Kamakura_%282576768994%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Hasedera_temple_in_Kamakura_(2576768994).jpg",
      "credit": "KimonBerlin",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "alt": "Temple buildings and green hillside at Hasedera in Kamakura"
    }
  },
  {
    "region": "Chubu",
    "name": "Kurobe Dam",
    "place": "Tateyama · Toyama",
    "description": "An immense concrete wall holds back a deep alpine reservoir beneath the Northern Alps. Look across the engineering and mountain scale together, and build the visit around the wider Alpine Route connections.",
    "tags": [
      "Nature",
      "Culture"
    ],
    "months": [
      6,
      7,
      8,
      9,
      10
    ],
    "seasonReason": "The Alpine Route is seasonal and snow can linger; confirm transport connections and operating dates before planning the mountain crossing.",
    "illustration": "dam",
    "alt": "Kurobe Dam spanning a mountain valley beneath the Japanese Alps",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Kurobe_Dam_20141012_130913.jpg/1280px-Kurobe_Dam_20141012_130913.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Kurobe_Dam_20141012_130913.jpg",
      "credit": "Ka23 13",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "Kurobe Dam spanning a mountain valley beneath the Japanese Alps"
    }
  },
  {
    "region": "Chubu",
    "name": "Tojinbo Cliffs",
    "place": "Sakai · Fukui",
    "description": "Basalt columns form a dramatic edge above the Sea of Japan, where waves and wind shape the whole visit. Keep to marked paths and take time to look back along the rugged coastline.",
    "tags": [
      "Nature"
    ],
    "months": [
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Milder spring and autumn days suit the exposed coastal walk; high winds and rough seas can change conditions at the cliffs.",
    "illustration": "coast",
    "alt": "Basalt columns and sea cliffs along the coast at Tojinbo",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Tojinbo_cliffs%2C_Fukui_Prefecture%3B_September_2019_%2801%29.jpg/1280px-Tojinbo_cliffs%2C_Fukui_Prefecture%3B_September_2019_%2801%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Tojinbo_cliffs,_Fukui_Prefecture;_September_2019_(01).jpg",
      "credit": "雷太",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "alt": "Basalt columns and sea cliffs along the coast at Tojinbo"
    }
  },
  {
    "region": "Chubu",
    "name": "Tsumago-juku",
    "place": "Nagiso · Nagano",
    "description": "A preserved post town along the Nakasendo invites a slow walk past timber inns, lattice-fronted houses, and quiet side lanes. Look for the traces of the old highway beyond the central street.",
    "tags": [
      "Culture",
      "Slow travel"
    ],
    "months": [
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Spring greenery and autumn color make the Nakasendo walk especially inviting; allow time for the uphill path between villages.",
    "illustration": "village",
    "alt": "Traditional wooden houses lining the historic street of Tsumago-juku",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Tsumago-juku_%E5%A6%BB%E7%B1%A0%E5%AE%BF_aerial_panorama.jpg/1280px-Tsumago-juku_%E5%A6%BB%E7%B1%A0%E5%AE%BF_aerial_panorama.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Tsumago-juku_%E5%A6%BB%E7%B1%A0%E5%AE%BF_aerial_panorama.jpg",
      "credit": "BobTanGo",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "alt": "Traditional wooden houses lining the historic street of Tsumago-juku"
    }
  },
  {
    "region": "Chubu",
    "name": "Gero Onsen",
    "place": "Gero · Gifu",
    "description": "A riverside hot spring town gathers public baths, footbaths, bridges, and small lanes around the Hida River. Stay overnight if you can: the town settles into a different pace after day visitors leave.",
    "tags": [
      "Slow travel",
      "Culture"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      10,
      11,
      12
    ],
    "seasonReason": "Hot-spring bathing suits cooler months especially well, while the town remains a year-round stop; check individual bath hours and rules.",
    "illustration": "onsen",
    "alt": "Traditional buildings and riverside scenery in Gero Onsen",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Gero-Onsen001.JPG/1280px-Gero-Onsen001.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Gero-Onsen001.JPG",
      "credit": "阪神強いな at ja.wikipedia",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
      "alt": "Traditional buildings and riverside scenery in Gero Onsen"
    }
  },
  {
    "region": "Chubu",
    "name": "Lake Suwa",
    "place": "Suwa · Nagano",
    "description": "The broad lake sits between mountain ranges, with lakeside paths and small towns linking hot springs, shrines, and local museums. Choose one shore-side stop and leave time to watch the light move over the water.",
    "tags": [
      "Nature",
      "Slow travel"
    ],
    "months": [
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Clear spring and autumn days open the best mountain views; winter weather is beautiful but calls for extra care around the shoreline.",
    "illustration": "lake",
    "alt": "Lake Suwa framed by the surrounding Nagano mountains",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Lake_Suwa%2C_Nagano_Prefecture%3B_May_2019_%2806%29.jpg/1280px-Lake_Suwa%2C_Nagano_Prefecture%3B_May_2019_%2806%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Lake_Suwa,_Nagano_Prefecture;_May_2019_(06).jpg",
      "credit": "Sei F",
      "license": "CC BY-SA 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0",
      "alt": "Lake Suwa framed by the surrounding Nagano mountains"
    }
  },
  {
    "region": "Chubu",
    "name": "Echizen Ono Castle",
    "place": "Ono · Fukui",
    "description": "A small hilltop keep looks over the old castle town, with lanes and waterways below that reward a second glance after the climb. On certain misty mornings the town can seem to float, though the effect is never guaranteed.",
    "tags": [
      "Culture",
      "Nature"
    ],
    "months": [
      4,
      5,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "Autumn and winter mornings sometimes create the famous sea-of-clouds view; conditions are unpredictable, so enjoy the castle even without it.",
    "illustration": "castle",
    "alt": "Echizen Ono Castle rising above its historic town",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Echizen_Ono_Castle.jpg/1280px-Echizen_Ono_Castle.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Echizen_Ono_Castle.jpg",
      "credit": "Keisuke MAEDA",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "Echizen Ono Castle rising above its historic town"
    }
  },
  {
    "region": "Kansai",
    "name": "Kifune Shrine",
    "place": "Sakyo · Kyoto",
    "description": "A forested approach of stone steps and red lanterns leads to a mountain shrine beside the clear Kibune River. Walk quietly, notice the changing light, and treat the shrine and village as a living community.",
    "tags": [
      "Culture",
      "Nature"
    ],
    "months": [
      5,
      6,
      7,
      8,
      9,
      10,
      11
    ],
    "seasonReason": "Fresh green and summer shade make the mountain setting appealing; winter snow can be beautiful but makes the approach more demanding.",
    "illustration": "shrine",
    "alt": "Stone lanterns rising along the forest approach to Kifune Shrine",
    "image": "",
    "photo": {
      "url": "https://upload.wikimedia.org/wikipedia/commons/f/f5/Sand%C5%8D%2C_Kifune_Shrine%2C_Kyoto_-_Jul_22%2C_2007.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail_unscaled",
      "source": "https://commons.wikimedia.org/wiki/File:Sand%C5%8D,_Kifune_Shrine,_Kyoto_-_Jul_22,_2007.jpg",
      "credit": "kibun",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "alt": "Stone lanterns rising along the forest approach to Kifune Shrine"
    }
  },
  {
    "region": "Kansai",
    "name": "Katsuoji Temple",
    "place": "Minoh · Osaka",
    "description": "Bright daruma dolls gather across a wooded temple precinct, turning a visit into a playful search for small details. Follow the paths uphill and pause to read the wishes represented by the dolls.",
    "tags": [
      "Culture",
      "Nature"
    ],
    "months": [
      3,
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Spring leaves and autumn color frame the hillside temple; weekends and foliage season can be busy, and access involves some walking.",
    "illustration": "temple",
    "alt": "Daruma dolls arranged across the grounds of Katsuoji Temple",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Daruma_Dolls_Osaka.JPG/1280px-Daruma_Dolls_Osaka.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Daruma_Dolls_Osaka.JPG",
      "credit": "EllieRH",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "Daruma dolls arranged across the grounds of Katsuoji Temple"
    }
  },
  {
    "region": "Kansai",
    "name": "Nara National Museum",
    "place": "Nara · Nara",
    "description": "Buddhist sculpture and temple treasures offer a focused counterpoint to Nara Park’s open-air encounters. Choose one gallery rather than trying to absorb everything, and check which exhibitions are open that day.",
    "tags": [
      "Culture"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "The galleries make a useful indoor stop in any season; special exhibitions and regular closing days affect access.",
    "illustration": "museum",
    "alt": "The historic exhibition buildings of Nara National Museum",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/140927_Nara_National_Museum_Nara_Japan01bs5.jpg/1280px-140927_Nara_National_Museum_Nara_Japan01bs5.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:140927_Nara_National_Museum_Nara_Japan01bs5.jpg",
      "credit": "663highland",
      "license": "CC BY 2.5",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.5",
      "alt": "The historic exhibition buildings of Nara National Museum"
    }
  },
  {
    "region": "Kansai",
    "name": "Wakayama Castle",
    "place": "Wakayama · Wakayama",
    "description": "White walls and a green roof rise above the city from a compact hilltop park. Walk the stone approaches and grounds before entering the keep, then look back toward the surrounding city from the upper level.",
    "tags": [
      "Culture",
      "Nature"
    ],
    "months": [
      3,
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Spring blossoms and autumn foliage soften the castle grounds; check the keep’s opening calendar and allow time for the uphill paths.",
    "illustration": "castle",
    "alt": "Wakayama Castle above its surrounding park and city",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c0/Wakayama_Castle_-_Apr_4%2C_2017_%282%29.jpg/1280px-Wakayama_Castle_-_Apr_4%2C_2017_%282%29.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Wakayama_Castle_-_Apr_4,_2017_(2).jpg",
      "credit": "mk_is_here",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "alt": "Wakayama Castle above its surrounding park and city"
    }
  },
  {
    "region": "Kansai",
    "name": "Takarazuka Grand Theater",
    "place": "Takarazuka · Hyogo",
    "description": "The home stage of the all-female Takarazuka Revue brings elaborate costumes, precise choreography, and a distinctive theatrical tradition together. Plan around a performance calendar and allow time for the surrounding theatre district.",
    "tags": [
      "Culture"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "Performances run on a changing schedule through the year; confirm the current program, ticket availability, and visitor guidance ahead of time.",
    "illustration": "theatre",
    "alt": "The historic Takarazuka Grand Theater building in Hyogo",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Takarazuka_grand_theater03s3200.jpg/1280px-Takarazuka_grand_theater03s3200.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Takarazuka_grand_theater03s3200.jpg",
      "credit": "663highland",
      "license": "CC BY 2.5",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.5",
      "alt": "The historic Takarazuka Grand Theater building in Hyogo"
    }
  },
  {
    "region": "Chugoku",
    "name": "Okayama Korakuen",
    "place": "Okayama · Okayama",
    "description": "Broad lawns, ponds, tea houses, and carefully framed views make this one of Japan’s classic landscape gardens. Take the paths slowly and look for the castle across the river as part of the garden’s composition.",
    "tags": [
      "Culture",
      "Nature",
      "Slow travel"
    ],
    "months": [
      3,
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Seasonal flowers, fresh green, and autumn color each shift the garden’s palette; check opening times and event notices before visiting.",
    "illustration": "garden",
    "alt": "Pond, lawns, and garden landscape at Okayama Korakuen",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Korakuen_%28japanese_garden%29_and_Okayama_castle.jpg/1280px-Korakuen_%28japanese_garden%29_and_Okayama_castle.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Korakuen_(japanese_garden)_and_Okayama_castle.jpg",
      "credit": "Motokoka",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "Pond, lawns, and garden landscape at Okayama Korakuen"
    }
  },
  {
    "region": "Chugoku",
    "name": "Shukkeien Garden",
    "place": "Hiroshima · Hiroshima",
    "description": "A compact central garden arranges ponds, bridges, islands, and miniature landscapes into an unhurried loop. Pause on the bridges and let the scale change from the busy city outside to the details within.",
    "tags": [
      "Nature",
      "Slow travel"
    ],
    "months": [
      3,
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Spring blossoms and autumn color complement the garden’s year-round pond views; check for temporary closures or event changes.",
    "illustration": "garden",
    "alt": "A pond and curved bridge in Hiroshima’s Shukkeien Garden",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/20100722_Hiroshima_Shukkeien_4387.jpg/1280px-20100722_Hiroshima_Shukkeien_4387.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:20100722_Hiroshima_Shukkeien_4387.jpg",
      "credit": "Jakub Hałun",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "A pond and curved bridge in Hiroshima’s Shukkeien Garden"
    }
  },
  {
    "region": "Chugoku",
    "name": "Kintaikyo Bridge",
    "place": "Iwakuni · Yamaguchi",
    "description": "Five graceful wooden arches cross the Nishiki River beneath a hilltop castle. Walk the bridge from both banks to see how the construction changes against the water and mountains.",
    "tags": [
      "Culture",
      "Nature"
    ],
    "months": [
      3,
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Cherry blossoms and autumn colors make the riverbanks especially photogenic; water levels and weather can affect the riverside experience.",
    "illustration": "bridge",
    "alt": "The arched timber spans of Kintaikyo Bridge over the Nishiki River",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Tenshu_of_Iwakuni_Castle_and_Kintaikyo_Bridge_2.jpg/1280px-Tenshu_of_Iwakuni_Castle_and_Kintaikyo_Bridge_2.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Tenshu_of_Iwakuni_Castle_and_Kintaikyo_Bridge_2.jpg",
      "credit": "そらみみ",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "The arched timber spans of Kintaikyo Bridge over the Nishiki River"
    }
  },
  {
    "region": "Chugoku",
    "name": "Tomonoura harbor lanes",
    "place": "Fukuyama · Hiroshima",
    "description": "A small port town opens through narrow lanes toward an old harbor, stone steps, and the iconic Joyato lighthouse. Wander without hurry and notice how the working waterfront shapes the historic streets.",
    "tags": [
      "Culture",
      "Food",
      "Slow travel"
    ],
    "months": [
      3,
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Spring and autumn are comfortable for exploring the harbor lanes on foot; check ferry connections and small museum hours as schedules vary.",
    "illustration": "harbor",
    "alt": "Historic harbor buildings and the waterfront at Tomonoura",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Tomonoura_Gangi.jpg/1280px-Tomonoura_Gangi.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Tomonoura_Gangi.jpg",
      "credit": "Yanajin",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "alt": "Historic harbor buildings and the waterfront at Tomonoura"
    }
  },
  {
    "region": "Chugoku",
    "name": "Tsunoshima Bridge",
    "place": "Shimonoseki · Yamaguchi",
    "description": "A long road bridge arcs across clear blue water toward a small island on the Sea of Japan. The view is best appreciated from public viewpoints; do not stop on the bridge or obstruct local traffic.",
    "tags": [
      "Nature",
      "Islands"
    ],
    "months": [
      5,
      6,
      7,
      8,
      9,
      10
    ],
    "seasonReason": "Clear summer days bring vivid sea colors, though coastal weather and visibility vary; check local conditions before making the drive.",
    "illustration": "bridge",
    "alt": "Tsunoshima Bridge crossing bright blue water off Yamaguchi",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Tsunoshima_Ohashi_Bridge.jpg/1280px-Tsunoshima_Ohashi_Bridge.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Tsunoshima_Ohashi_Bridge.jpg",
      "credit": "Amy00",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
      "alt": "Tsunoshima Bridge crossing bright blue water off Yamaguchi"
    }
  },
  {
    "region": "Chugoku",
    "name": "Bitchu Matsuyama Castle",
    "place": "Takahashi · Okayama",
    "description": "Stone walls and a wooden keep crown a forested peak above Takahashi. The steep approach is part of the experience, and on some cool mornings clouds fill the valley below without any guarantee.",
    "tags": [
      "Culture",
      "Nature"
    ],
    "months": [
      4,
      5,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "Autumn and winter mornings can bring cloud-sea views; the mountain access is weather-sensitive, so check the shuttle and walking route before leaving.",
    "illustration": "castle",
    "alt": "Bitchu Matsuyama Castle on its forested mountain summit",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Bitchu_Matsuyama_Castle.JPG/1280px-Bitchu_Matsuyama_Castle.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Bitchu_Matsuyama_Castle.JPG",
      "credit": "by Reggaeman",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
      "alt": "Bitchu Matsuyama Castle on its forested mountain summit"
    }
  },
  {
    "region": "Shikoku",
    "name": "Chichibugahama Beach",
    "place": "Mitoyo · Kagawa",
    "description": "At low tide, shallow pools can mirror the sky and the silhouettes of people walking across the sand. Check the tide and wind together, then wait patiently for the reflective moment rather than expecting it on arrival.",
    "tags": [
      "Nature",
      "Islands"
    ],
    "months": [
      5,
      6,
      7,
      8,
      9,
      10
    ],
    "seasonReason": "Longer evenings and calmer summer weather can create reflective conditions, but tides, wind, and clouds decide the view on any day.",
    "illustration": "beach",
    "alt": "Shallow tidal pools reflecting the sky at Chichibugahama Beach",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6c/Titibugahama_20200404_03.jpg/1280px-Titibugahama_20200404_03.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Titibugahama_20200404_03.jpg",
      "credit": "Dokudami",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "Shallow tidal pools reflecting the sky at Chichibugahama Beach"
    }
  },
  {
    "region": "Shikoku",
    "name": "Shikoku Karst",
    "place": "Kumakogen · Ehime and Kochi",
    "description": "A high open plateau of grass, limestone outcrops, and broad mountain horizons feels far removed from the coast below. The winding approach is part of the journey; check road access and bring layers for exposed weather.",
    "tags": [
      "Nature",
      "Slow travel"
    ],
    "months": [
      5,
      6,
      7,
      8,
      9,
      10
    ],
    "seasonReason": "Summer and early autumn are the main window for the upland road; fog, wind, and seasonal closures can affect the drive.",
    "illustration": "mountain",
    "alt": "Limestone outcrops and open grassland across Shikoku Karst",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Shikoku_Karst_2023-08-02_1706.jpg/1280px-Shikoku_Karst_2023-08-02_1706.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Shikoku_Karst_2023-08-02_1706.jpg",
      "credit": "Photos of Japan",
      "license": "CC0",
      "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
      "alt": "Limestone outcrops and open grassland across Shikoku Karst"
    }
  },
  {
    "region": "Shikoku",
    "name": "Ozu Castle",
    "place": "Ozu · Ehime",
    "description": "A reconstructed wooden keep overlooks the Hijikawa River and the old castle town below. Pair the interior visit with a walk through quiet streets and riverside views to understand the town’s scale.",
    "tags": [
      "Culture",
      "Slow travel"
    ],
    "months": [
      3,
      4,
      5,
      9,
      10,
      11
    ],
    "seasonReason": "Spring and autumn make the river walk comfortable; confirm keep opening times and local event schedules for your date.",
    "illustration": "castle",
    "alt": "Ozu Castle overlooking the Hijikawa River and historic town",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Ozu_Castle_20241206_003.jpg/1280px-Ozu_Castle_20241206_003.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Ozu_Castle_20241206_003.jpg",
      "credit": "Mobius6",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "Ozu Castle overlooking the Hijikawa River and historic town"
    }
  },
  {
    "region": "Shikoku",
    "name": "Ryugado Cave",
    "place": "Kami · Kochi",
    "description": "A limestone cave threads through chambers shaped by underground water over immense time. Follow the visitor route at a steady pace, wear practical shoes, and check current access conditions before travelling.",
    "tags": [
      "Nature"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "The cave offers a sheltered experience in every season; access, route conditions, and visitor services should be confirmed in advance.",
    "illustration": "cave",
    "alt": "An illuminated limestone chamber inside Ryugado Cave",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Kami_Kochi_Ryugado_Inside_1.JPG/1280px-Kami_Kochi_Ryugado_Inside_1.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Kami_Kochi_Ryugado_Inside_1.JPG",
      "credit": "京浜にけ",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "alt": "An illuminated limestone chamber inside Ryugado Cave"
    }
  },
  {
    "region": "Shikoku",
    "name": "Otsuka Museum of Art",
    "place": "Naruto · Tokushima",
    "description": "Full-scale ceramic reproductions bring celebrated Western artworks together under one roof, from ancient mosaics to modern paintings. The collection is extensive; choose a few periods and leave room for the final galleries.",
    "tags": [
      "Culture"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "A large indoor museum suits any weather; check opening days and allow several hours if you want to see more than a small selection.",
    "illustration": "museum",
    "alt": "The entrance and galleries of Otsuka Museum of Art in Naruto",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/The_Otsuka_Museum_of_Art01s3200.jpg/1280px-The_Otsuka_Museum_of_Art01s3200.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:The_Otsuka_Museum_of_Art01s3200.jpg",
      "credit": "663highland",
      "license": "CC BY 2.5",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.5",
      "alt": "The entrance and galleries of Otsuka Museum of Art in Naruto"
    }
  },
  {
    "region": "Kyushu",
    "name": "Dazaifu Tenmangu",
    "place": "Dazaifu · Fukuoka",
    "description": "A lively shrine approach passes shops and plum-tree courtyards before reaching a deeply storied place of learning and prayer. Look beyond the busiest gate for quieter corners and take time to notice the architecture.",
    "tags": [
      "Culture",
      "Food"
    ],
    "months": [
      2,
      3,
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Plum blossoms are a signature of late winter and early spring; festival periods bring crowds, while the shrine grounds remain a year-round visit.",
    "illustration": "shrine",
    "alt": "The shrine buildings and approach at Dazaifu Tenmangu",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/20100719_Dazaifu_Tenmangu_Shrine_3328.jpg/1280px-20100719_Dazaifu_Tenmangu_Shrine_3328.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:20100719_Dazaifu_Tenmangu_Shrine_3328.jpg",
      "credit": "Jakub Hałun",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "The shrine buildings and approach at Dazaifu Tenmangu"
    }
  },
  {
    "region": "Kyushu",
    "name": "Kirishima Jingu",
    "place": "Kirishima · Kagoshima",
    "description": "A vermilion shrine building sits among deep forest on the slopes of the Kirishima mountains. Let the cedar approach slow the visit, and check mountain weather if you plan to continue to nearby highland trails.",
    "tags": [
      "Culture",
      "Nature"
    ],
    "months": [
      3,
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Fresh green and autumn color frame the forest approach; mountain weather can differ from Kagoshima city and may affect onward plans.",
    "illustration": "shrine",
    "alt": "The vivid shrine architecture of Kirishima Jingu among forested mountains",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Kirishima-Jingu_Front.jpg/1280px-Kirishima-Jingu_Front.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Kirishima-Jingu_Front.jpg",
      "credit": "MaedaAkihiko",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "The vivid shrine architecture of Kirishima Jingu among forested mountains"
    }
  },
  {
    "region": "Kyushu",
    "name": "Sakurai Futamigaura",
    "place": "Itoshima · Fukuoka",
    "description": "Two sea stacks joined by a sacred rope stand just offshore, with a white torii framing the open water. Visit gently, watch the tides and waves, and give the coastal landscape room in your day.",
    "tags": [
      "Nature",
      "Culture"
    ],
    "months": [
      5,
      6,
      7,
      8,
      9,
      10
    ],
    "seasonReason": "Clearer days and longer light bring out the coastline; wind, surf, and sunset timing shift the experience, so check conditions.",
    "illustration": "coast",
    "alt": "The paired sea rocks and torii gate at Sakurai Futamigaura",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Futamigaura_in_Itoshima%2C_Fukuoka.jpg/1280px-Futamigaura_in_Itoshima%2C_Fukuoka.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Futamigaura_in_Itoshima,_Fukuoka.jpg",
      "credit": "flickr - yuki5287",
      "license": "CC BY 2.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.0",
      "alt": "The paired sea rocks and torii gate at Sakurai Futamigaura"
    }
  },
  {
    "region": "Kyushu",
    "name": "Amakusa Gokyo",
    "place": "Kamiamakusa · Kumamoto",
    "description": "A chain of bridges links islands across a calm archipelago of inlets, fishing villages, and sea views. Choose a viewpoint or a short island stop rather than treating the scenic crossing as a race.",
    "tags": [
      "Nature",
      "Islands"
    ],
    "months": [
      3,
      4,
      5,
      6,
      9,
      10,
      11
    ],
    "seasonReason": "Spring and autumn bring comfortable driving weather; sea conditions, ferry connections, and local schedules are worth checking ahead.",
    "illustration": "bridge",
    "alt": "One of the bridges connecting islands across the Amakusa Gokyo route",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/AmakusaFiveBridgeFromSenganzan2.JPG/1280px-AmakusaFiveBridgeFromSenganzan2.JPG?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:AmakusaFiveBridgeFromSenganzan2.JPG",
      "credit": "Ippukucho",
      "license": "CC BY 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/3.0",
      "alt": "One of the bridges connecting islands across the Amakusa Gokyo route"
    }
  },
  {
    "region": "Kyushu",
    "name": "Mojiko Retro",
    "place": "Moji · Kitakyushu",
    "description": "Red-brick buildings and early-modern port architecture line the waterfront at the northern edge of Kyushu. Walk between the old station area, museums, and the harbor, then pause for a view across the strait.",
    "tags": [
      "Culture",
      "Food"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "The waterfront district works in every season; clear days make the strait views brighter, while individual museums keep their own hours.",
    "illustration": "harbor",
    "alt": "Historic station and waterfront architecture in Mojiko Retro",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Mojiko_Station_20190831.jpg/1280px-Mojiko_Station_20190831.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Mojiko_Station_20190831.jpg",
      "credit": "そらみみ",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "alt": "Historic station and waterfront architecture in Mojiko Retro"
    }
  },
  {
    "region": "Kyushu",
    "name": "Arita Porcelain Park",
    "place": "Arita · Saga",
    "description": "A surprising palace-like landmark introduces Arita’s long relationship with porcelain and trade. Pair the photo-worthy grounds with a visit to local kilns or ceramic shops to connect the spectacle with the craft.",
    "tags": [
      "Culture",
      "Slow travel"
    ],
    "months": [
      3,
      4,
      5,
      9,
      10,
      11
    ],
    "seasonReason": "Spring and autumn are pleasant for exploring the grounds and nearby pottery district; verify current park and shop hours before travelling.",
    "illustration": "heritage",
    "alt": "The palace-style landmark at Arita Porcelain Park in Saga",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/Zwinger_Palace_at_Arita_Porcelain_Park.jpg/1280px-Zwinger_Palace_at_Arita_Porcelain_Park.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Zwinger_Palace_at_Arita_Porcelain_Park.jpg",
      "credit": "STA3816",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "alt": "The palace-style landmark at Arita Porcelain Park in Saga"
    }
  },
  {
    "region": "Okinawa",
    "name": "Sefa Utaki",
    "place": "Nanjo · Okinawa",
    "description": "A sacred Ryukyu site set among dense subtropical forest, where natural rock formations and narrow paths shape a quiet visit. Follow posted guidance, keep voices low, and treat the precinct with care.",
    "tags": [
      "Culture",
      "Nature"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "Cooler months are more comfortable for the forest paths; rain can make stone surfaces slippery, and access rules should be checked before arrival.",
    "illustration": "shrine",
    "alt": "Rock formations and forest paths at the sacred site of Sefa Utaki",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Okinawa_Nanjo_Sefa-utaki_Gusuku_site_Yuinchi_02.jpg/1280px-Okinawa_Nanjo_Sefa-utaki_Gusuku_site_Yuinchi_02.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Okinawa_Nanjo_Sefa-utaki_Gusuku_site_Yuinchi_02.jpg",
      "credit": "Hyppolyte de Saint-Rambert",
      "license": "CC BY 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
      "alt": "Rock formations and forest paths at the sacred site of Sefa Utaki"
    }
  },
  {
    "region": "Okinawa",
    "name": "Nakagusuku Castle",
    "place": "Nakagusuku · Okinawa",
    "description": "Curving stone ramparts follow a hillside above the Pacific, showing the scale and skill of Ryukyu-era fortress building. Walk between the walls and lookout points while staying on marked paths.",
    "tags": [
      "Culture",
      "Nature"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "The exposed hilltop is more comfortable in cooler months; summer heat, rain, and strong sun make water and shade breaks essential.",
    "illustration": "castle",
    "alt": "Curved stone ramparts at Nakagusuku Castle in Okinawa",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7e/Nakagusuku_Castle24n3104.jpg/1280px-Nakagusuku_Castle24n3104.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Nakagusuku_Castle24n3104.jpg",
      "credit": "663highland",
      "license": "CC BY 2.5",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.5",
      "alt": "Curved stone ramparts at Nakagusuku Castle in Okinawa"
    }
  },
  {
    "region": "Okinawa",
    "name": "Bise Fukugi Tree Road",
    "place": "Bise · Motobu, Okinawa",
    "description": "Old fukugi trees form shaded green corridors between traditional homes and the sea near the Churaumi coast. Walk quietly through this residential village and respect private gates and everyday life.",
    "tags": [
      "Nature",
      "Slow travel"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "The leafy lanes offer shade year-round; cooler months make the walk easier, while summer humidity and sun call for a slower pace.",
    "illustration": "village",
    "alt": "A shaded lane beneath mature fukugi trees in Bise village",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Fukugi_trees_at_Bise_Village%2C_Okinawa.jpg/1280px-Fukugi_trees_at_Bise_Village%2C_Okinawa.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Fukugi_trees_at_Bise_Village,_Okinawa.jpg",
      "credit": "Mokkie",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "alt": "A shaded lane beneath mature fukugi trees in Bise village"
    }
  },
  {
    "region": "Okinawa",
    "name": "Yonaha Maehama Beach",
    "place": "Miyakojima · Okinawa",
    "description": "A long sweep of pale sand meets exceptionally clear water on Miyakojima’s southwest coast. Swim only where conditions and local guidance allow, and keep the beach pristine for the next visitor.",
    "tags": [
      "Nature",
      "Islands"
    ],
    "months": [
      4,
      5,
      6,
      7,
      8,
      9,
      10
    ],
    "seasonReason": "Warmer months suit beach time, but sun, currents, and typhoon weather need attention; always follow local swimming and safety guidance.",
    "illustration": "beach",
    "alt": "White sand and clear turquoise water at Yonaha Maehama Beach",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Yonahamaehama_Miyakojima_Okinawa_Japan05bs3s4592.jpg/1280px-Yonahamaehama_Miyakojima_Okinawa_Japan05bs3s4592.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Yonahamaehama_Miyakojima_Okinawa_Japan05bs3s4592.jpg",
      "credit": "663highland",
      "license": "CC BY 2.5",
      "licenseUrl": "https://creativecommons.org/licenses/by/2.5",
      "alt": "White sand and clear turquoise water at Yonaha Maehama Beach"
    }
  },
  {
    "region": "Okinawa",
    "name": "Shikinaen Royal Garden",
    "place": "Shikinaen · Naha, Okinawa",
    "description": "A former Ryukyu royal retreat combines a circular pond, stone bridges, and a distinctive hexagonal pavilion in a quiet green setting. Take the loop slowly and look for how the garden blends local and Chinese influences.",
    "tags": [
      "Culture",
      "Nature",
      "Slow travel"
    ],
    "months": [
      1,
      2,
      3,
      4,
      5,
      6,
      9,
      10,
      11,
      12
    ],
    "seasonReason": "The garden is rewarding year-round; cooler months are most comfortable for the open paths, while heavy rain can affect walking conditions.",
    "illustration": "garden",
    "alt": "The pond and pavilion within Shikinaen Royal Garden in Naha",
    "image": "",
    "photo": {
      "url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Naha_Okinawa_Japan_Shikinaen-02.jpg/1280px-Naha_Okinawa_Japan_Shikinaen-02.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail",
      "source": "https://commons.wikimedia.org/wiki/File:Naha_Okinawa_Japan_Shikinaen-02.jpg",
      "credit": "CEphoto, Uwe Aranas",
      "license": "CC BY-SA 3.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
      "alt": "The pond and pavilion within Shikinaen Royal Garden in Naha"
    }
  }
];
if(root.DESTINATIONS)root.DESTINATIONS.push(...additions);
if(typeof module!=='undefined'&&module.exports)module.exports={additions};
})(typeof globalThis!=='undefined'?globalThis:this);
