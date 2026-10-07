# 飛象老師作品離線使用工具（make_offline.py）

澳門科學館 Oscar 製作 · 2026年10月

## 為甚麼要轉換？
飛象老師「下载」得到的 `.html` 只是一個外殼：用雙擊（file://）開啟時，會**自動跳轉到飛象的線上版**。
所以沒有網絡時只會看到「無法連上這個網站」。另外，圖片和朗讀音訊都放在網上。

`make_offline.py` 會把圖片、音訊、樣式、程式全部內嵌到同一個檔案，並停用跳轉，得到可以完全離線使用的 `xxx.offline.html`。

## 準備（只需一次，Windows）
1. 到 https://www.python.org/downloads/ 下載並安裝 Python 3。**安裝第一頁要勾選「Add python.exe to PATH」**。
2. 把 `make_offline.py` 和 `拖放轉換.bat` 放在同一個資料夾（例如桌面「離線工具」）。

## 每次轉換（這一步要聯網）
1. 在飛象老師按「下载」，得到 `xxx.html`。
2. 把 `xxx.html` **拖放到 `拖放轉換.bat` 的圖示上**（可以一次拖多個檔案）。
3. 黑色視窗顯示「[完成] 離線版：…xxx.offline.html」後，按任意鍵關閉。
4. **先關掉 Wi-Fi**，再用 Chrome 或 Edge 雙擊 `xxx.offline.html` 試一次。沒問題才複製到 U 盤或課室電腦。

不用 .bat 也可以：在資料夾網址列輸入 `cmd` 按 Enter，再輸入
```
py make_offline.py xxx.html
```
macOS／Linux：`python3 make_offline.py xxx.html`

> 注意：`拖放轉換.bat` 只檢查過內容，**尚未在真正的 Windows 電腦上測試**。如有問題，請改用上面的指令。

## 選項
| 選項 | 作用 |
|---|---|
| `-o 檔名.html` | 指定輸出檔名（預設 `原名.offline.html`） |
| `--keep-analytics` | 保留統計腳本（預設移除） |
| `--image-max-px 0` | 不壓縮圖片（預設最長邊 1600 px） |
| `-q` | 只輸出一行摘要 |

轉換後會另外產生 `xxx.offline.html.report.json`：`remaining_external` 為 0 最理想；`online_only_features` 列出只能聯網使用的功能。

## 仍然需要網絡的功能
- 數據回收（學生作答傳回老師看板）、數據看板：必須聯網。
- 教育應用：沒有下載按鈕，不能離線。
- 作品內的 AI 對話、AI 批改、生成圖片等：必須聯網。
- 執行時才組出來的網址（例如網上詞典讀音）無法預先下載。
- 如果作品用瀏覽器朗讀（speechSynthesis），離線時只能用電腦內建的語音。

## 不用安裝的做法（比較）
- 上課有網絡：直接用飛象的連結最簡單。
- Chrome「另存為 → 網頁，單一檔案（.mhtml）」：離線時**只看到靜態畫面**，按鈕、拖動、朗讀都不能用。

## 版權
離線版保留飛象的外殼與浮水印，只供自己課堂使用；分享前請尊重原作者及平台條款。
