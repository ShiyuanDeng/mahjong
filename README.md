# Mahjong Score Table · 麻將記分桌

[Open the score table](https://shiyuandeng.github.io/mahjong/) or [open the live-score host](https://mahjong-table-scores.loosebeaver2.chatgpt.site/).

One person records hands on their phone. Tap **Share live table · 共享牌桌** to put the current players, settings and hand history online. Use **Copy table link · 複製觀戰連結** to let friends watch. Anyone with that table link can see its scores. Keep scoring in the same browser on the same device, which holds the editing key. Before sharing, scores stay in the browser.

由一人使用手機記分。點選「共享牌桌」，再點「複製觀戰連結」傳給朋友。持有連結的人都能查看這桌的即時分數。請繼續使用原來的裝置與瀏覽器記分。

Running totals cover all games for the four seated players. The tiles show points for the current game. Leaders includes everyone who played. The rules and glossary explain the Hong Kong patterns in English and traditional Chinese, with references and house choices.

## Hosting

GitHub Pages serves the static frontend. The live-score host serves the same frontend and stores each shared table in D1. Shared links refresh about every three seconds while visible. The browser caches the latest table and retries an unconfirmed score on reconnection. Writes check the prior revision so a stale tab cannot overwrite a newer hand.

Run `node scripts/build.mjs` to package the Worker after editing the frontend. The database schema is in `drizzle/0000_tables.sql`.
