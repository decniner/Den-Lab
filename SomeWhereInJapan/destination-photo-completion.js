(function completeDestinationPhotographs(root){
  'use strict';

  // Individually selected Commons files for destinations that previously
  // fell back to an illustration. Each file page provides its photographer,
  // license, and reuse terms.
  const photos = {
    'Asahiyama Zoo':['Asahiyama zoo entrance.jpg','Keyaki · Wikimedia Commons'],
    'Moerenuma Park':['Avenue in Moerenuma Park.jpg','Wikimedia Commons · see linked file attribution'],
    'Lake Shikotsu':['Lake Shikotsu 01.jpg','Wikimedia Commons · see linked file attribution'],
    'Otaru Aquarium':['Otaru aquarium 201909.jpg','Wikimedia Commons · see linked file attribution'],
    'Kakunodate Samurai District':['Bukeyashiki Street in Kakunodate 20060506.jpg','Wikimedia Commons · see linked file attribution'],
    'Lake Towada':['Lake Towada from Ohanabe 2008.jpg','Wikimedia Commons · see linked file attribution'],
    'Hirosaki Castle Park':['Hirosaki Castle.JPG','Kojin · public domain'],
    'Zuiganji Temple':['211030 Zuigan-ji Matsushima Miyagi pref Japan22s3.jpg','Wikimedia Commons · see linked file attribution'],
    'Meiji Jingu':['Meiji Jingu 2023-3.jpg','Wikimedia Commons · see linked file attribution'],
    'Shibuya Scramble Crossing':['Shibuya Crossing, Aerial.jpg','Wikimedia Commons · see linked file attribution'],
    'teamLab Planets TOKYO':['At teamLab Planets (48277793276).jpg','Wikimedia Commons · see linked file attribution'],
    'Tokyo National Museum':['Tokyo National Museum, Honkan 2010.jpg','Wikimedia Commons · see linked file attribution'],
    'Ghibli Museum, Mitaka':['Ghibli Museum 2024.JPG','Wikimedia Commons · see linked file attribution'],
    'Great Buddha of Kamakura':['Templo Kōtoku-in, Kamakura - 2026 - 05.jpg','Wikimedia Commons · see linked file attribution'],
    'Enoshima Aquarium':['Enoshima Aquarium front 2025 March 21 various 19 35 29 446000.jpeg','Wikimedia Commons · see linked file attribution'],
    'Hitachi Seaside Park':['2025 Hitachi Seaside Park 2.jpg','Wikimedia Commons · see linked file attribution'],
    'Ashikaga Flower Park':['Ashikaga Flower Park 03.jpg','Wikimedia Commons · see linked file attribution'],
    'Sanrio Puroland':['Sanriopuroland-outside-summer2007.jpg','Wikimedia Commons · see linked file attribution'],
    'Hamarikyu Gardens':['Hamarikyu gardens.jpg','Kallerna · CC BY-SA 3.0'],
    'Jigokudani Snow Monkey Park':['Snow Monkeys at Jigokudani Monkey Park, Japan.jpg','Kelly Drewett · CC BY-SA 4.0'],
    'Takayama Jinya':['Takayama Jinya.jpg','Bernard Gagnon · Wikimedia Commons'],
    'Hida Folk Village':['Hida Folk Village - HidaFolkVillage6459.jpg','lumoplank · Wikimedia Commons'],
    'Kurobe Gorge Railway':['Kurobe Gorge Railway (14894581628).jpg','Wikimedia Commons · see linked file attribution'],
    'Ise Jingu':['Ise Ise-jingu Main Sanctuary 1.jpg','Wikimedia Commons · see linked file attribution'],
    'Fushimi Inari Taisha':['Torii path with lantern at Fushimi Inari Taisha Shrine, Kyoto, Japan.jpg','Wikimedia Commons · see linked file attribution'],
    'Nijo Castle':['Nijo Castle, Kyoto.jpg','Katsutoshi Seki · CC BY-SA 3.0'],
    'Dotonbori':['Osaka Dotonbori yoru.jpg','Sakai Yayoi · Wikimedia Commons'],
    'Kinosaki Onsen':['Kinosaki onsen01 2816.jpg','663highland · Wikimedia Commons'],
    'Byodo-in Temple':['Phoenix Hall, Byodo-in, November 2016 -01.jpg','Wikimedia Commons · see linked file attribution'],
    'Kobe Harborland':['Kobe Port Tower and Harborland at night 20190202-2.jpg','Wikimedia Commons · see linked file attribution'],
    'Todai-ji Temple':['Tōdai-ji Kon-dō.jpg','Wikimedia Commons · see linked file attribution'],
    'Adachi Museum of Art':['Adachi Museum of Art 01.jpg','Wikimedia Commons · see linked file attribution'],
    'Dogo Onsen':['Dogo onsen honkan long exposure.jpg','Wikimedia Commons · see linked file attribution'],
    'Naruto Whirlpools':['Observing Naruto whirlpools.jpg','Pauloleong2002 · Wikimedia Commons'],
    'Nagasaki Peace Park':['Nagasaki (4696131594).jpg','Wikimedia Commons · see linked file attribution'],
    'Huis Ten Bosch':['Huis Ten Bosch - 01.jpg','JKT-c · Wikimedia Commons'],
    'Beppu Jigoku Meguri':['Umi Jigoku (Sea Hell) in Beppu.jpg','Wikimedia Commons · see linked file attribution'],
    // Commons does not host reusable images of this modern sculpture under
    // Japan's freedom-of-panorama rules, so this shows the temple grounds.
    'Nanzoin Reclining Buddha':['Nanzoin Temple from bridge in front of Kido Monjudo Hall in Sasaguri, Kasuya, Fukuoka.jpg','Wikimedia Commons · see linked file attribution'],
    'Okinawa World & Gyokusendo Cave':['Gyokusendo Cave - panoramio.jpg','FoxyStranger Kawasaki · CC BY-SA 3.0'],
    'Okinawa Peace Memorial Park':['Itoman Okinawa Okinawa-Cornerstone-of-Peace-Memorial-01.jpg','CEphoto, Uwe Aranas · CC BY-SA 3.0']
  };

  const photoFor = (filename, credit) => ({
    url:`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1100`,
    source:`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename).replace(/%20/g,'_')}`,
    credit,
    license:'See linked Wikimedia Commons file page'
  });

  if(Array.isArray(root.DESTINATIONS)){
    for(const place of root.DESTINATIONS){
      const match=photos[place.name];
      if(!match)continue;
      place.photo=photoFor(match[0],match[1]);
      place.alt=`${place.name} in ${place.place}`;
    }
  }

  if(typeof module!=='undefined'&&module.exports)module.exports={photos};
})(typeof globalThis!=='undefined'?globalThis:this);
