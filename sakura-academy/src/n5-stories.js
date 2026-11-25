// Original, graded N5 reading practice. Kana lines give the full reading of each kanji sentence.
const N5_STORIES=[
 {"id":"morning","title":"田中さんの朝","level":"N5","summary":"A student’s morning routine","sentences":[
  {"kanji":"田中さんは毎朝七時に起きます。","kana":"たなかさんはまいあさしちじにおきます。","english":"Mr. Tanaka gets up at seven every morning."},
  {"kanji":"朝ご飯を食べて、八時に学校へ行きます。","kana":"あさごはんをたべて、はちじにがっこうへいきます。","english":"He eats breakfast and goes to school at eight."},
  {"kanji":"学校で日本語を勉強します。","kana":"がっこうでにほんごをべんきょうします。","english":"He studies Japanese at school."}
 ]},
 {"id":"shopping","title":"週末の買い物","level":"N5","summary":"A simple weekend outing","sentences":[
  {"kanji":"土曜日、あきさんはスーパーへ行きます。","kana":"どようび、あきさんはスーパーへいきます。","english":"On Saturday, Aki goes to the supermarket."},
  {"kanji":"牛乳とパンを買います。","kana":"ぎゅうにゅうとパンをかいます。","english":"She buys milk and bread."},
  {"kanji":"午後、家で本を読みます。","kana":"ごご、いえでほんをよみます。","english":"In the afternoon, she reads a book at home."}
 ]},
 {"id":"library","title":"図書館の本","level":"N5","summary":"Friends study together","sentences":[
  {"kanji":"日曜日、りなさんは友だちと図書館へ行きます。","kana":"にちようび、りなさんはともだちととしょかんへいきます。","english":"On Sunday, Rina goes to the library with a friend."},
  {"kanji":"日本語の本を二冊借ります。","kana":"にほんごのほんをにさつかります。","english":"She borrows two Japanese books."},
  {"kanji":"午後三時に家へ帰ります。","kana":"ごごさんじにいえへかえります。","english":"She returns home at three in the afternoon."}
 ]},
 {"id":"tokyo","title":"東京で友だちに会う","level":"N5","summary":"A first visit to Tokyo","sentences":[
  {"kanji":"来週、マリアさんは東京へ行きます。","kana":"らいしゅう、マリアさんはとうきょうへいきます。","english":"Next week, Maria is going to Tokyo."},
  {"kanji":"東京で友だちに会います。","kana":"とうきょうでともだちにあいます。","english":"She will meet a friend in Tokyo."},
  {"kanji":"いっしょにすしを食べて、映画を見ます。","kana":"いっしょにすしをたべて、えいがをみます。","english":"They will eat sushi together and watch a movie."}
 ]},
 {"id":"intro","title":"はじめまして","level":"N5","summary":"A first introduction","sentences":[
  {"kanji":"はじめまして。田中ゆきです。","kana":"はじめまして。たなかゆきです。","english":"Nice to meet you. I am Yuki Tanaka."},
  {"kanji":"わたしは学生です。","kana":"わたしはがくせいです。","english":"I am a student."},
  {"kanji":"これは日本語の本です。","kana":"これはにほんごのほんです。","english":"This is a Japanese book."}
 ]},
 {"id":"family","title":"わたしの家族","level":"N5","summary":"A family and their Sunday","sentences":[
  {"kanji":"わたしの家族は四人です。","kana":"わたしのかぞくはよにんです。","english":"There are four people in my family."},
  {"kanji":"父と母と姉とわたしです。","kana":"ちちとははとあねとわたしです。","english":"My father, mother, older sister, and me."},
  {"kanji":"日曜日に家族と公園へ行きます。","kana":"にちようびにかぞくとこうえんへいきます。","english":"On Sunday, I go to the park with my family."}
 ]},
 {"id":"home","title":"駅の近くの家","level":"N5","summary":"Finding a home near the station","sentences":[
  {"kanji":"わたしの家は駅の近くにあります。","kana":"わたしのいえはえきのちかくにあります。","english":"My home is near the station."},
  {"kanji":"家の前に小さい店があります。","kana":"いえのまえにちいさいみせがあります。","english":"There is a small shop in front of the house."},
  {"kanji":"店で水を買います。","kana":"みせでみずをかいます。","english":"I buy water at the shop."}
 ]},
 {"id":"weekend","title":"土曜日の予定","level":"N5","summary":"Making a weekend plan","sentences":[
  {"kanji":"土曜日に友だちと会います。","kana":"どようびにともだちとあいます。","english":"I will meet a friend on Saturday."},
  {"kanji":"いっしょに映画を見ませんか。","kana":"いっしょにえいがをみませんか。","english":"Would you like to watch a movie together?"},
  {"kanji":"はい、午後三時に駅で会いましょう。","kana":"はい、ごごさんじにえきであいましょう。","english":"Yes, let’s meet at the station at three in the afternoon."}
 ]},
 {"id":"hobby","title":"好きなこと","level":"N5","summary":"Talking about hobbies","sentences":[
  {"kanji":"あきさんは音楽が好きです。","kana":"あきさんはおんがくがすきです。","english":"Aki likes music."},
  {"kanji":"毎晩、家で音楽を聞きます。","kana":"まいばん、いえでおんがくをききます。","english":"Every evening, Aki listens to music at home."},
  {"kanji":"日曜日は友だちと写真を撮ります。","kana":"にちようびはともだちとしゃしんをとります。","english":"On Sunday, Aki takes photos with a friend."}
 ]},
 {"id":"town","title":"町を歩く","level":"N5","summary":"Giving and following simple directions","sentences":[
  {"kanji":"駅からまっすぐ歩きます。","kana":"えきからまっすぐあるきます。","english":"Walk straight from the station."},
  {"kanji":"右に小さい本屋があります。","kana":"みぎにちいさいほんやがあります。","english":"There is a small bookshop on the right."},
  {"kanji":"本屋の前で友だちを待ちます。","kana":"ほんやのまえでともだちをまちます。","english":"I wait for my friend in front of the bookshop."}
 ]},
 {"id":"weather","title":"雨の日","level":"N5","summary":"A rainy day and tomorrow’s plan","sentences":[
  {"kanji":"今日は雨です。","kana":"きょうはあめです。","english":"It is rainy today."},
  {"kanji":"家で本を読んで、音楽を聞きます。","kana":"いえでほんをよんで、おんがくをききます。","english":"I read a book and listen to music at home."},
  {"kanji":"明日は晴れですから、公園へ行きます。","kana":"あしたははれですから、こうえんへいきます。","english":"Tomorrow will be sunny, so I will go to the park."}
 ]},
 {"id":"meal","title":"レストランで","level":"N5","summary":"Ordering a simple meal","sentences":[
  {"kanji":"レストランでメニューを見ます。","kana":"れすとらんでめにゅーをみます。","english":"I look at the menu in the restaurant."},
  {"kanji":"水とサンドイッチをください。","kana":"みずとさんどいっちをください。","english":"Water and a sandwich, please."},
  {"kanji":"食事のあとで、友だちと話します。","kana":"しょくじのあとで、ともだちとはなします。","english":"After the meal, I talk with my friend."}
 ]}
];
