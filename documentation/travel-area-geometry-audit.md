# Travel Area geometry audit — 2026-09-09

範圍：resolver 的 61 個明確 catalog entries；13 個有核對核心 geometry，48 個沒有已核對 geometry。任意市町村 fallback 及 production 旅程實際地點無法由這份有限 catalog 推知。Production trip API 回 401，**無法線上統計實際重分類數量**。

Travel Area 是旅行規劃分區，不是官方行政界。以下 polygons 只描繪已核對的核心町域，不宣稱完整涵蓋整個旅遊圈；各 component 獨立保留，沒有 union、外包框、圓或人工補線。Filter 及地圖 label 只顯示 user-facing 名稱。所有線條橘色實線、無填色、不攔截手勢。

## 最終 mapping（包含無 geometry 的 catalog entries）

| travelAreaKey | travelAreaZh | travelAreaLocal | internal geometryComponents / relation evidence |
| --- | --- | --- | --- |
| ginza | 銀座 | 銀座 | 銀座 ([4859036](https://www.openstreetmap.org/relation/4859036)) |
| ebisu | 惠比壽 | 恵比寿 | 恵比寿 ([9521529](https://www.openstreetmap.org/relation/9521529))；恵比寿南 ([9616318](https://www.openstreetmap.org/relation/9616318)) |
| daikanyama | 代官山 | 代官山 | 代官山町 ([17022574](https://www.openstreetmap.org/relation/17022574))；猿楽町 ([17022575](https://www.openstreetmap.org/relation/17022575)) |
| shibuya | 澀谷 | 渋谷 | 渋谷 ([17022659](https://www.openstreetmap.org/relation/17022659))；神南 ([17022738](https://www.openstreetmap.org/relation/17022738))；宇田川町 ([17022739](https://www.openstreetmap.org/relation/17022739))；道玄坂 ([17022582](https://www.openstreetmap.org/relation/17022582))；円山町 ([17022583](https://www.openstreetmap.org/relation/17022583)) |
| asakusa | 淺草 | 浅草 | 浅草 ([9046136](https://www.openstreetmap.org/relation/9046136))；花川戸 ([16400401](https://www.openstreetmap.org/relation/16400401))；雷門 ([18158548](https://www.openstreetmap.org/relation/18158548)) |
| shinjuku | 新宿 | 新宿 | 新宿 ([17081654](https://www.openstreetmap.org/relation/17081654))；西新宿 ([17081666](https://www.openstreetmap.org/relation/17081666))；歌舞伎町 ([17081657](https://www.openstreetmap.org/relation/17081657)) |
| otsuka | 大塚 | 大塚 | 南大塚 ([18687916](https://www.openstreetmap.org/relation/18687916))；北大塚 ([18687920](https://www.openstreetmap.org/relation/18687920)) |
| ikebukuro | 池袋 | 池袋 | 池袋 ([4869702](https://www.openstreetmap.org/relation/4869702))；西池袋 ([18672896](https://www.openstreetmap.org/relation/18672896))；東池袋 ([18672902](https://www.openstreetmap.org/relation/18672902))；南池袋 ([3047806](https://www.openstreetmap.org/relation/3047806)) |
| toyosu | 豐洲 | 豊洲 | 豊洲 ([3789147](https://www.openstreetmap.org/relation/3789147)) |
| marunouchi-otemachi | 丸之內／大手町 | 丸の内／大手町 | 丸の内 ([3544394](https://www.openstreetmap.org/relation/3544394))；大手町 ([3545196](https://www.openstreetmap.org/relation/3545196)) |
| tsukiji | 築地 | 築地 | 築地 ([16170475](https://www.openstreetmap.org/relation/16170475)) |
| azabujuban | 麻布十番 | 麻布十番 | 麻布十番 ([3562067](https://www.openstreetmap.org/relation/3562067)) |
| ueno | 上野 | 上野 | 上野 ([18158684](https://www.openstreetmap.org/relation/18158684))；上野公園 ([18158889](https://www.openstreetmap.org/relation/18158889)) |
| tokyo-tower-shiba | 東京鐵塔／芝公園 | 東京タワー／芝公園 | 無可信 snapshot；不畫邊界 |
| harajuku-omotesando | 原宿／表參道 | 原宿／表参道 | 無可信 snapshot；不畫邊界 |
| nerima | 練馬 | 練馬 | 無可信 snapshot；不畫邊界 |
| kamakura | 鎌倉 | 鎌倉 | 無可信 snapshot；不畫邊界 |
| fujisawa | 藤澤 | 藤沢 | 無可信 snapshot；不畫邊界 |
| myeongdong | 明洞 | 명동 | 無可信 snapshot；不畫邊界 |
| hongdae | 弘大 | 홍대 | 無可信 snapshot；不畫邊界 |
| itaewon | 梨泰院 | 이태원 | 無可信 snapshot；不畫邊界 |
| gangnam | 江南 | 강남 | 無可信 snapshot；不畫邊界 |
| montmartre | 蒙馬特 | Montmartre | 無可信 snapshot；不畫邊界 |
| chiyoda | 千代田 | 千代田 | 無可信 snapshot；不畫邊界 |
| chuo | 中央 | 中央 | 無可信 snapshot；不畫邊界 |
| minato | 港 | 港 | 無可信 snapshot；不畫邊界 |
| bunkyo | 文京 | 文京 | 無可信 snapshot；不畫邊界 |
| taito | 台東 | 台東 | 無可信 snapshot；不畫邊界 |
| sumida | 墨田 | 墨田 | 無可信 snapshot；不畫邊界 |
| koto | 江東 | 江東 | 無可信 snapshot；不畫邊界 |
| shinagawa | 品川 | 品川 | 無可信 snapshot；不畫邊界 |
| meguro | 目黑 | 目黒 | 無可信 snapshot；不畫邊界 |
| ota | 大田 | 大田 | 無可信 snapshot；不畫邊界 |
| setagaya | 世田谷 | 世田谷 | 無可信 snapshot；不畫邊界 |
| nakano | 中野 | 中野 | 無可信 snapshot；不畫邊界 |
| suginami | 杉並 | 杉並 | 無可信 snapshot；不畫邊界 |
| toshima | 豐島 | 豊島 | 無可信 snapshot；不畫邊界 |
| kita | 北 | 北 | 無可信 snapshot；不畫邊界 |
| arakawa | 荒川 | 荒川 | 無可信 snapshot；不畫邊界 |
| itabashi | 板橋 | 板橋 | 無可信 snapshot；不畫邊界 |
| adachi | 足立 | 足立 | 無可信 snapshot；不畫邊界 |
| katsushika | 葛飾 | 葛飾 | 無可信 snapshot；不畫邊界 |
| edogawa | 江戶川 | 江戸川 | 無可信 snapshot；不畫邊界 |
| jongno | 鐘路 | 종로 | 無可信 snapshot；不畫邊界 |
| jung | 中 | 중 | 無可信 snapshot；不畫邊界 |
| yongsan | 龍山 | 용산 | 無可信 snapshot；不畫邊界 |
| mapo | 麻浦 | 마포 | 無可信 snapshot；不畫邊界 |
| dongdaemun | 東大門 | 동대문 | 無可信 snapshot；不畫邊界 |
| seocho | 瑞草 | 서초 | 無可信 snapshot；不畫邊界 |
| songpa | 松坡 | 송파 | 無可信 snapshot；不畫邊界 |
| brooklyn | 布魯克林 | Brooklyn | 無可信 snapshot；不畫邊界 |
| manhattan | 曼哈頓 | Manhattan | 無可信 snapshot；不畫邊界 |
| queens | 皇后區 | Queens | 無可信 snapshot；不畫邊界 |
| bronx | 布朗克斯 | Bronx | 無可信 snapshot；不畫邊界 |
| staten-island | 史泰登島 | Staten Island | 無可信 snapshot；不畫邊界 |
| paris | 巴黎 | Paris | 無可信 snapshot；不畫邊界 |
| new-york | 紐約 | New York | 無可信 snapshot；不畫邊界 |
| los-angeles | 洛杉磯 | Los Angeles | 無可信 snapshot；不畫邊界 |
| san-francisco | 舊金山 | San Francisco | 無可信 snapshot；不畫邊界 |
| chicago | 芝加哥 | Chicago | 無可信 snapshot；不畫邊界 |
| boston | 波士頓 | Boston | 無可信 snapshot；不畫邊界 |

## 語意修正與限制

- 惠比壽／代官山拆為 ebisu / daikanyama；惠比壽西跨圈且證據不足，不把整個町域強塞給任一側。代官山加入 T-SITE 所在猿楽町；惠比壽加入恵比寿南。
- 新宿移除整片代々木，加入歌舞伎町；西新宿與歌舞伎町不成為新 filter。
- 上野加入上野公園；澀谷加入宇田川町、道玄坂、円山町，移除整片神宮前／富ヶ谷 geometry。既有 resolver 對這兩處的歷史別名不在此次擴大重分類，polygon 明確只表達核心覆蓋。
- 池袋加入南池袋；其他 7 區保留經核對的原 component。沒有把同名的新宿（葛飾區 Niijuku）納入。
- 舊 composite 依 existing evidence → address components / address → verified containment 判定。無證據／矛盾／邊界點保留原值；不使用店名、不重搜 Google、不改 placeId/address/photos。GET 轉換回傳不寫 DB；正常保存才持久化，無批次 migration。
- 每個 component 的旅遊語意來源見 mapping-audit.json 的 semanticEvidence；OSM relation IDs、source tags、兩份 snapshot 與 SHA-256 均保留。48 個無 geometry 條目不宣稱完成新的網路取證，僅明確保持空 mapping，避免把更大行政區當旅遊圈。

## 驗收

在有相應地點的旅程，以地圖／全螢幕 dropdown 逐一選以上 13 區。新宿看歌舞伎町、上野看公園、澀谷看宇田川町；惠比壽與代官山分別選取。快速切區後只保留新區邊界，選全部清空。無 geometry 區只保留 markers / fitBounds。一般清單與全螢幕選取同步。無需逐點人工判定來源；固定 mapping regression 與本機瀏覽器已核對所有 13 組 IDs。
