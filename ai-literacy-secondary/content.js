'use strict';
window.SITE = {
  "kind": "secondary",
  "storageKey": "msc-ai-literacy-secondary-v1",
  "title": "AI 素養中學生站",
  "subtitle": "辨識風險、學術誠信、負責任地使用生成式 AI",
  "audience": "初中至高中",
  "tabs": [
    {
      "id": "home",
      "label": "首頁"
    },
    {
      "id": "learn",
      "label": "學習關卡"
    },
    {
      "id": "games",
      "label": "互動遊戲"
    },
    {
      "id": "challenge",
      "label": "總結大挑戰"
    },
    {
      "id": "resources",
      "label": "案例資源"
    }
  ],
  "lessons": [
    {
      "id": "s01",
      "title": "公開試操卷與 AI 代寫",
      "scene": "夜讀會／操卷",
      "intro": "生成式 AI 能產出長文。若校本準則禁止或未授權，略改就交可能構成不誠實完成功課。",
      "story": "阿傑用 ChatGPT 產生長文，改幾個字就當公開試操卷交。",
      "q": "依教青局建議與常見校本政策，較正確的是？",
      "options": [
        "只要改過幾個字就不算 AI 代寫",
        "須遵守校本準則或取得教師明確許可，並誠實標示用途",
        "所有科目永遠禁止打開任何網頁"
      ],
      "answer": 1,
      "why": "教青局（C03）強調校本準則與許可；香港中學政策（C07）亦要求事前授權，違規可按不誠實處理。",
      "case": {
        "id": "C07",
        "title": "荃灣聖芳濟中學：課業使用生成式 AI 校本政策",
        "region": "香港（鄰近地區）",
        "date": "2025-04-01",
        "source": "荃灣聖芳濟中學",
        "url": "https://www.sfxs.edu.hk/sites/default/files/files/school-based_policy_student_use_of_generative_ai_in_assignments_20250415.pdf",
        "note": "對照 C03 澳門教青局建議、C06 港大曾暫禁政策。"
      }
    },
    {
      "id": "s02",
      "title": "班群「行政長官推介投資」短片",
      "scene": "WhatsApp／社團群",
      "intro": "新聞樣短片也可能是深偽。投資話術要查證。",
      "story": "社團群流傳短片：看似新聞片段，內容卻是推介加密貨幣「穩賺」。",
      "q": "你應該？",
      "options": [
        "先入金再問老師",
        "不輕信、不轉發煽動性投資訊息，用官方渠道／反詐熱線查證",
        "因為畫面像新聞所以一定真"
      ],
      "answer": 1,
      "why": "2025-06 司警局通告：有人把公開活動新聞片段經 AI 深偽，假冒推介網上投資。",
      "case": {
        "id": "C02",
        "title": "警惕深度偽造新聞影片",
        "region": "澳門",
        "date": "2025-06-19",
        "source": "司法警察局",
        "url": "https://www.gov.mo/zh-hant/news/1152927/",
        "note": "本地官方案例，優先引用。"
      }
    },
    {
      "id": "s03",
      "title": "腦力激盪可以，代寫不行",
      "scene": "功課與專題研習",
      "intro": "許多學校允許 AI 協助構思／潤飾，但禁止冒充自己作品。使用聲明很重要。",
      "story": "小組專題用 AI 列大綱，成員自己寫段落，並在報告附「AI 使用聲明」。",
      "q": "這做法較接近哪一項？",
      "options": [
        "完全違規",
        "在獲准範圍內透明使用的良好示範",
        "只要有聲明就可以交 AI 全文"
      ],
      "answer": 1,
      "why": "透明＋教師授權範圍內使用，才符合學術誠信。可對照資訊素養架構對 AI 倫理的討論（C08）。",
      "case": {
        "id": "C03",
        "title": "教青局非高等教育 AI 使用建議",
        "region": "澳門",
        "date": "2023-05-10",
        "source": "DSEDJ",
        "url": "https://portal.dsedj.gov.mo/webdsejspace/addon/upload/Upload_viewfile_page.jsp?id=93493",
        "note": "另見 C07、C08。"
      }
    },
    {
      "id": "s04",
      "title": "電競隊語音假冒",
      "scene": "遊戲語音／電競",
      "intro": "深偽聲音可假冒隊友或家長。通關密語與雙重查證是基本功。",
      "story": "語音頻道有人用「隊長」聲音叫你分享戰隊帳號驗證碼。",
      "q": "最佳回應？",
      "options": [
        "立刻把驗證碼貼上",
        "用預先約定密語／另一通訊 App 向真隊長確認，並拒絕在語音公開敏感資料",
        "嘲笑他再把驗證碼給半隊人"
      ],
      "answer": 1,
      "why": "澳門已有深偽騙案（C01）。香港警隊青少年教材亦提醒深偽用於假冒推介可疑投資（C10）。",
      "case": {
        "id": "C01",
        "title": "本澳首現 AI 深偽詐騙",
        "region": "澳門",
        "date": "2025-05-28",
        "source": "澳門特區政府入口網站",
        "url": "https://www.gov.mo/zh-hant/news/1147515/",
        "note": "搭配 C10 防罪概念。"
      }
    },
    {
      "id": "s05",
      "title": "生成式 AI 的幻覺與課時",
      "scene": "科學館／AI 實驗",
      "intro": "模型會「一本正經地亂答」（幻覺）。課程指引建議中學每學年不少於 10 課時 AI 專題。",
      "story": "體驗課上，AI 給出一個看起來很真、但其實錯誤的澳門歷史年份。",
      "q": "負責任的態度是？",
      "options": [
        "模型寫的都可以直接引用",
        "把輸出當草稿，用可靠來源交叉查證",
        "幻覺只會發生在英文模型"
      ],
      "answer": 1,
      "why": "C04 把生成式 AI、虛假資訊風險納入指引；C05 說明科學館與教青局配套推動。",
      "case": {
        "id": "C04",
        "title": "資訊科技科課程指引（2025）AI 專題課時",
        "region": "澳門",
        "date": "2025",
        "source": "DSEDJ 課程發展",
        "url": "https://www.dsedj.gov.mo/crdc/guide/data/junior/IT_guide_2025c.pdf",
        "note": "初中／高中建議不少於 10 課時。"
      }
    },
    {
      "id": "s06",
      "title": "暑期工「輕鬆日薪」",
      "scene": "兼職招聘",
      "intro": "網上「輕鬆日薪」可能與被招攬參與騙案有關。要懂得拒絕與求助。",
      "story": "陌生人在社交平台以高日薪請你「只幫忙收款再轉帳」。",
      "q": "你應？",
      "options": [
        "先做一單試試",
        "拒絕可疑「代收款／轉帳」工作，並向家長／老師或警方諮詢渠道求助",
        "把朋友的銀行戶口借給對方"
      ],
      "answer": 1,
      "why": "香港警隊青少年防罪教材討論深偽騙案與青少年被招攬風險（C10）。不要參與可疑資金流轉。",
      "case": {
        "id": "C10",
        "title": "青少年罪行誌：深偽及網絡詐騙教材",
        "region": "香港（鄰近地區）",
        "date": "2024",
        "source": "香港警務處防止罪案科",
        "url": "https://www.police.gov.hk/info/img/pr/ycpb2024/cyper_osdf_tc.pdf",
        "note": "標明地區；強調防騙與勿參案。"
      }
    },
    {
      "id": "s07",
      "title": "升學自述誰來寫？",
      "scene": "報考／個人陳述",
      "intro": "面試官若追問細節，說不出自己的經歷就會穿幫。AI 可幫忙潤飾，但不能代替你的故事。",
      "story": "阿欣用 AI 寫完整個人陳述，自己沒改過經歷細節。",
      "q": "風險主要是？",
      "options": [
        "字數一定不夠",
        "面試說不清「自己」的內容，且可能違反誠信規定",
        "AI 一定會被所有學校自動偵測並錄取"
      ],
      "answer": 1,
      "why": "高等教育曾因評估誠信暫禁 AI（C06 港大，其後政策調整）。重點是：作品要代表你自己。",
      "case": {
        "id": "C06",
        "title": "港大曾暫禁 ChatGPT 用於課堂／功課／評估",
        "region": "香港（鄰近地區）",
        "date": "2023-02-17",
        "source": "香港大學 Teaching and Learning",
        "url": "https://tl.hku.hk/2023/02/about-chatgpt/",
        "note": "其後政策有調整；引用時標明時間點。"
      }
    },
    {
      "id": "s08",
      "title": "換臉 App「玩吓」？",
      "scene": "社交媒體與人臉",
      "intro": "把同學照片丟進換臉 App，即使「覺得好笑」，也可能未經同意傷害對方。重點：同意、勿轉發、求助。",
      "story": "有人把班相放進換臉 App，想在群組「玩吓」再傳出去。",
      "q": "正確做法是？",
      "options": [
        "先傳再說，被罵再刪",
        "沒有當事人明確同意就不要改、不要傳；若已流出要停轉並求助師長",
        "只有公開帳號的照片就可以隨便改"
      ],
      "answer": 1,
      "why": "鄰近地區曾發生校園深偽傷害事件（韓國，C09，國際案例）。香港私隱公署錦囊（C14）呼籲慎發人臉、制訂應變。本站不教如何製作。",
      "case": {
        "id": "C14",
        "title": "PCPD 深偽應對錦囊（學校及家長）",
        "region": "香港（鄰近地區）",
        "date": "2025-12-17",
        "source": "香港個人資料私隱專員公署",
        "url": "https://www.pcpd.org.hk/tc_chi/news_events/media_statements/press_20251217.html",
        "note": "C09 韓國案例僅作「換臉不是玩笑」警示，略去細節。"
      }
    },
    {
      "id": "s09",
      "title": "為流量跟熱門標籤",
      "scene": "短影音創作與演算法",
      "intro": "演算法會把內容推給可能包含更年幼觀眾的人群。成癮與注意力也是課題。",
      "story": "為了衝播放量，創作者跟風爭議標籤，影片被推到低年級學生。",
      "q": "較負責任的思考是？",
      "options": [
        "播放量大於一切",
        "考慮觀眾年齡與內容影響，並管理自己的使用時間",
        "演算法與我無關"
      ],
      "answer": 1,
      "why": "C11 顯示香港學生長時間螢幕消費與情緒、學業自我效能相關。初中指引亦有「我與短視頻」單元（C04）。",
      "case": {
        "id": "C11",
        "title": "Binge-watching 與學生身心學業研究",
        "region": "香港（鄰近地區）",
        "date": "2025-08-22",
        "source": "PLOS One",
        "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0329655",
        "note": "澳門本地大型統計待查證（T02）。"
      }
    },
    {
      "id": "s10",
      "title": "AI 圖／AI 歌參賽",
      "scene": "創作比賽與版權",
      "intro": "訓練資料是否獲授權、「風格像某歌手」都可能牽涉版權與比賽規則。",
      "story": "同學用 AI 生成一首「很像某歌手」的歌報名校內創作賽。",
      "q": "參賽前應先？",
      "options": [
        "不用管規則",
        "讀比賽規則與標示要求，思考訓練資料／風格模仿的爭議",
        "只要好聽就一定合法"
      ],
      "answer": 1,
      "why": "唱片公司曾控告 AI 音樂平台（C13）；《紐約時報》亦控告 OpenAI／Microsoft 訓練資料侵權（C12）。",
      "case": {
        "id": "C13",
        "title": "唱片公司控告 Suno、Udio",
        "region": "美國（國際）",
        "date": "2024-06-24",
        "source": "Reuters",
        "url": "https://www.reuters.com/technology/artificial-intelligence/music-labels-sue-ai-companies-suno-udio-us-copyright-infringement-2024-06-24/",
        "note": "訴訟／授權安排可能更新，引用標明日期。"
      }
    },
    {
      "id": "s11",
      "title": "報道作業與模型複述",
      "scene": "假新聞／深度報道作業",
      "intro": "模型可能輸出近似受版權保護的新聞語句。引用與查證是作者責任。",
      "story": "AI 幫你「寫」報道，段落讀起來很像某大報原文。",
      "q": "你應？",
      "options": [
        "直接貼上交功課",
        "視為不可靠草稿：查原始來源、改寫並正確引用，遵守老師規定",
        "刪掉引號就不會侵權"
      ],
      "answer": 1,
      "why": "C12 凸顯訓練資料與新聞版權爭議；本地假新聞影音查證見 C02。",
      "case": {
        "id": "C12",
        "title": "《紐約時報》控告 OpenAI、Microsoft",
        "region": "美國（國際）",
        "date": "2023-12-27",
        "source": "Reuters／The New York Times",
        "url": "https://www.reuters.com/legal/transactional/ny-times-sues-openai-microsoft-infringing-copyrighted-work-2023-12-27/",
        "note": "國際案例，標明地區。"
      }
    },
    {
      "id": "s12",
      "title": "草擬本校 AI 使用公約",
      "scene": "學生會／班規",
      "intro": "對照教青局建議與資訊素養架構，學生也可以參與訂班規。",
      "story": "學生會想提案：何時可用 AI、如何標註、私隱紅線是什麼。",
      "q": "公約草案最應包含哪一項？",
      "options": [
        "只寫「全面禁止所有科技」",
        "許可範圍、標註方法、私隱／人臉、學術誠信後果與求助渠道",
        "只抄外國公司的服務條款"
      ],
      "answer": 1,
      "why": "C03／C04 是澳門官方骨架；C08 香港資訊素養架構可作鄰近參考（須標明地區）。",
      "case": {
        "id": "C03",
        "title": "教青局 AI 使用建議",
        "region": "澳門",
        "date": "2023-05-10",
        "source": "DSEDJ",
        "url": "https://portal.dsedj.gov.mo/webdsejspace/addon/upload/Upload_viewfile_page.jsp?id=93493",
        "note": "對接 C04、C08。"
      }
    }
  ],
  "games": [
    {
      "id": "g_deepfake",
      "title": "深偽新聞查證",
      "desc": "判斷「新聞樣」短片該信還是該查。",
      "icon": "新聞"
    },
    {
      "id": "g_integrity",
      "title": "學術誠信與使用聲明",
      "desc": "排序：構思→寫作→標註→提交。",
      "icon": "誠信"
    },
    {
      "id": "g_face",
      "title": "換臉 App 倫理",
      "desc": "同意、勿轉發、求助——不做製作教學。",
      "icon": "私隱"
    },
    {
      "id": "g_algo",
      "title": "演算法與短影音",
      "desc": "看懂推薦為何讓你停不下來。",
      "icon": "推薦"
    },
    {
      "id": "g_copyright",
      "title": "版權與 AI 圖／歌",
      "desc": "訓練資料與參賽標示判斷。",
      "icon": "版權"
    }
  ],
  "resources": [
    {
      "id": "C01",
      "title": "本澳首現 AI 深偽技術詐騙案件",
      "region": "澳門",
      "date": "2025-05-28",
      "source": "澳門特區政府入口網站／新聞局",
      "url": "https://www.gov.mo/zh-hant/news/1147515/"
    },
    {
      "id": "C02",
      "title": "警惕深度偽造新聞影片",
      "region": "澳門",
      "date": "2025-06-19",
      "source": "司法警察局",
      "url": "https://www.gov.mo/zh-hant/news/1152927/"
    },
    {
      "id": "C03",
      "title": "非高等教育學校使用 AI 建議",
      "region": "澳門",
      "date": "2023-05-10",
      "source": "DSEDJ",
      "url": "https://portal.dsedj.gov.mo/webdsejspace/addon/upload/Upload_viewfile_page.jsp?id=93493"
    },
    {
      "id": "C04",
      "title": "資訊科技科課程指引（2025）AI 專題",
      "region": "澳門",
      "date": "2025",
      "source": "DSEDJ 課程發展",
      "url": "https://www.dsedj.gov.mo/crdc/guide/data/junior/IT_guide_2025c.pdf"
    },
    {
      "id": "C05",
      "title": "推動 AI 素養與科學館計劃",
      "region": "澳門",
      "date": "2025-02-13",
      "source": "Newsmacao／立法會附件",
      "url": "https://m.newsmacao.com/nd.jsp?id=958"
    },
    {
      "id": "C06",
      "title": "港大曾暫禁 ChatGPT",
      "region": "香港",
      "date": "2023-02-17",
      "source": "香港大學 T&L",
      "url": "https://tl.hku.hk/2023/02/about-chatgpt/"
    },
    {
      "id": "C07",
      "title": "中學生成式 AI 校本課業政策",
      "region": "香港",
      "date": "2025-04-01",
      "source": "荃灣聖芳濟中學",
      "url": "https://www.sfxs.edu.hk/sites/default/files/files/school-based_policy_student_use_of_generative_ai_in_assignments_20250415.pdf"
    },
    {
      "id": "C08",
      "title": "香港學生資訊素養學習架構（2024）",
      "region": "香港",
      "date": "2024-03-14",
      "source": "香港教育局",
      "url": "https://www.edb.gov.hk/attachment/tc/edu-system/primary-secondary/applicable-to-primary-secondary/it-in-edu/CM/2024/EDBCM0752024C.pdf"
    },
    {
      "id": "C09",
      "title": "韓國校園深偽危機（警示用）",
      "region": "韓國",
      "date": "2024-09-03",
      "source": "BBC／Yonhap",
      "url": "https://www.bbc.com/news/articles/cpdlpj9zn9go"
    },
    {
      "id": "C10",
      "title": "青少年防罪：深偽與網絡詐騙",
      "region": "香港",
      "date": "2024",
      "source": "香港警務處",
      "url": "https://www.police.gov.hk/info/img/pr/ycpb2024/cyper_osdf_tc.pdf"
    },
    {
      "id": "C11",
      "title": "長時間追劇／看片與學生福祉研究",
      "region": "香港",
      "date": "2025-08-22",
      "source": "PLOS One",
      "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0329655"
    },
    {
      "id": "C12",
      "title": "紐約時報控告 OpenAI／Microsoft",
      "region": "美國",
      "date": "2023-12-27",
      "source": "Reuters／NYT",
      "url": "https://www.reuters.com/legal/transactional/ny-times-sues-openai-microsoft-infringing-copyrighted-work-2023-12-27/"
    },
    {
      "id": "C13",
      "title": "唱片公司控告 Suno／Udio",
      "region": "美國",
      "date": "2024-06-24",
      "source": "Reuters",
      "url": "https://www.reuters.com/technology/artificial-intelligence/music-labels-sue-ai-companies-suno-udio-us-copyright-infringement-2024-06-24/"
    },
    {
      "id": "C14",
      "title": "深偽應對錦囊（學校及家長）",
      "region": "香港",
      "date": "2025-12-17",
      "source": "PCPD",
      "url": "https://www.pcpd.org.hk/tc_chi/news_events/media_statements/press_20251217.html"
    }
  ],
  "challenge": {
    "title": "校園 AI 倡議者挑戰",
    "intro": "綜合深偽查證、學術誠信、私隱同意、演算法與版權。結束後可複製結果，亦可作班規討論起點。",
    "ranks": [
      {
        "min": 90,
        "name": "校園 AI 倡議者",
        "tip": "你可以起草班規草案：許可範圍、標註、人臉紅線與求助渠道，提交學生會或班主任討論。"
      },
      {
        "min": 70,
        "name": "負責任使用者",
        "tip": "你已掌握多數原則。建議再做「學術誠信聲明」與「深偽新聞查證」遊戲，並閱讀資源頁 C03／C04。"
      },
      {
        "min": 0,
        "name": "風險意識起步",
        "tip": "先重溫關卡 1–4 與 8，記住：查證、同意、勿轉發、誠實標註。遇騙求助師長或官方渠道。"
      }
    ],
    "questions": [
      {
        "q": "略改 AI 長文交操卷，最主要風險？",
        "options": [
          "字體不好看",
          "違反校本誠信／未獲授權",
          "一定被自動偵測軟體抓到"
        ],
        "answer": 1,
        "explain": "關鍵是授權與誠信，不是「有沒有被抓」。"
      },
      {
        "q": "社團群「官員推介加密貨幣」新聞樣短片，你應？",
        "options": [
          "先入金",
          "不輕信、查官方／反詐渠道，勿煽動轉發",
          "畫面像新聞所以真"
        ],
        "answer": 1,
        "explain": "對接澳門司警局 C02 通告。"
      },
      {
        "q": "專題用 AI 列大綱、自己寫、附使用聲明。這是？",
        "options": [
          "一定違規",
          "透明且在准許範圍內的良好示範",
          "有聲明就可以交全文 AI"
        ],
        "answer": 1,
        "explain": "透明＋範圍內使用。"
      },
      {
        "q": "同學想把班相丟進換臉 App 再傳群。你應？",
        "options": [
          "一起玩",
          "阻止：無同意不改不傳；已流出則停轉並求助",
          "公開帳號就可以"
        ],
        "answer": 1,
        "explain": "同意與勿轉發；不涉及製作教學。"
      },
      {
        "q": "語音假冒隊長索取驗證碼。你應？",
        "options": [
          "貼上驗證碼",
          "密語／另一渠道確認，拒絕公開敏感資料",
          "半隊人一起收"
        ],
        "answer": 1,
        "explain": "雙重查證。"
      },
      {
        "q": "AI 歌「很像某歌手」想參賽。你應先？",
        "options": [
          "直接交",
          "讀規則與標示，思考版權爭議",
          "好聽就合法"
        ],
        "answer": 1,
        "explain": "對接 C13／比賽規則。"
      },
      {
        "q": "模型輸出很像某報原文。你應？",
        "options": [
          "直接貼",
          "查來源、改寫、正確引用、守規定",
          "刪引號即可"
        ],
        "answer": 1,
        "explain": "作者責任；對接 C12。"
      },
      {
        "q": "班規草案最應包含？",
        "options": [
          "全面禁止科技",
          "許可、標註、私隱、誠信後果、求助",
          "只抄外國服務條款"
        ],
        "answer": 1,
        "explain": "對接 C03／C04／C08。"
      },
      {
        "q": "短影音為流量跟爭議標籤，被推到低年級。你應考慮？",
        "options": [
          "播放量最大",
          "觀眾年齡與影響，並管理使用時間",
          "演算法無關"
        ],
        "answer": 1,
        "explain": "對接 C11／C04。"
      },
      {
        "q": "「輕鬆日薪代收款」邀約。你應？",
        "options": [
          "先做一單",
          "拒絕並向家長／老師或防詐渠道求助",
          "借朋友戶口"
        ],
        "answer": 1,
        "explain": "對接 C10 防罪意識。"
      }
    ]
  }
};
