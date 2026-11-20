# Mahjong Score Table · 麻將記分桌

[Open the score table](https://shiyuandeng.github.io/mahjong/) or [open the live-score host](https://mahjong-table-scores.loosebeaver2.chatgpt.site/).

Enter your name and choose a seat. Your browser remembers your chair for this table. Friends joining the shared link can take open seats, and everyone sees the same names and scores from their own perspective. The foreground tiles open a new game, standings, history, rules and setup. One person records hands on their phone. Tap **Share · 共享牌桌** to put the current players, settings and hand history online. Use **Copy link · 複製連結** to let friends watch. Anyone with that table link can see its scores. Keep scoring in the same browser on the same device, which holds the editing key. Before sharing, scores stay in the browser.

輸入名字並選擇座位後，自己的位置會在畫面前方。朋友透過連結入座，各自的畫面會依座位轉向。由一人使用手機記分。點選「共享牌桌」，再點「複製連結」傳給朋友。持有連結的人都能查看這桌的即時分數。請繼續使用原來的裝置與瀏覽器記分。

Running totals cover all games for the four seated players. Seat badges rank these four players by their running totals. Tied players share a rank. The lowest score gets 💩 whenever the table has more than one score. Tap a seat to select scoring patterns from illustrated tile groups. Leaders includes everyone who played. The rules and glossary explain the Hong Kong patterns in English and traditional Chinese, with references and house choices.

## Hosting

GitHub Pages serves the static frontend. The live-score host serves the same frontend and stores each shared table in D1. Shared links refresh about every three seconds while visible. The browser caches the latest table and retries an unconfirmed score on reconnection. Writes check the prior revision so a stale tab cannot overwrite a newer hand.

Run `node scripts/build.mjs` to package the Worker after editing the frontend. Database migrations are in `drizzle/`.
