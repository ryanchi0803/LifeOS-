# LifeOS-
個人生活管理系統

## LifeGo 圍棋 MVP

### 單檔 HTML 版（不需安裝）

直接雙擊 `standalone.html`，或在瀏覽器開啟此檔案即可使用。
也可直接雙擊 `index.html`；它會自動導向 `standalone.html`。

開啟方式：

直接雙擊 `standalone.html`；若瀏覽器開啟受限制，可在專案目錄執行：

```sh
python -m http.server 4173
```

然後瀏覽器開啟 `http://127.0.0.1:4173`

也可直接使用支援 ES module 的瀏覽器開啟 `index.html`（部分瀏覽器會限制本地 module，建議使用 HTTP server）。

功能：
- 9／13／19 路棋盤，標準與讓棋模式
- 玩家執黑或執白，輪流落子、提子、無自殺與簡單劫
- 連續兩次 Pass 結束並依基本中國面積計分（白貼目 6.5）
- AI 段位：入門 15 級、初級 10 級、中級 5 級、上級 1 級、檔次 1 準
- 9 路棋譜庫內含 10 局公開 Mini-Go 職業對局序列；中高段位會匹配棋譜前綴並模擬對手反擊
- 19 路加入 Lee Sedol vs AlphaGo 第一局公開棋譜開局前綴
- 每手會在對局狀態列顯示選擇原因，例如公開棋譜、提子或局面展望
- 第 1-24 手的角部布局僅作為評分加分，不再無條件固定跳星位
- 支援 AI 黑／AI 白觀戰互奕，可為兩方分別設定段位
- 中高段位加入角部星位／三三、提子防守、形狀與自殺避免等布局原則
- 棋譜來源：https://homepages.cwi.nl/~aeb/go/games/games/other_sizes/9x9/Minigo/
- 本地 AI 思考狀態、最後落子標記、悔棋、重開與新棋局

核心規則測試：

```sh
node --test tests/go-core.test.js
```
