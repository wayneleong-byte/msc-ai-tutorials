const TYPE_LABEL = {
  chat: "對話",
  vision: "視覺",
  embedding: "嵌入",
  image: "圖像",
  audio: "音訊",
  code: "程式",
  rerank: "重排",
  other: "其他"
};

const PROMPT_STATUS_LABEL = {
  attachment_only_telegram_login_required: "僅附件（需 Telegram）",
  mentioned_in_post_no_full_text: "帖文提及（無全文）",
  notion_login_wall: "Notion 無法匿名讀取",
  file_link_available: "有公開檔案連結",
  prompt_extracted: "已取得正文"
};

const state = {
  data: null,
  tab: "api",
  q: "",
  modelType: "all",
  card: "all",
  jbModel: "all"
};

async function load() {
  const res = await fetch("./data.json", { cache: "no-store" });
  state.data = await res.json();
  bindUI();
  populateJbModels();
  render();
}

function bindUI() {
  document.getElementById("q").addEventListener("input", (e) => {
    state.q = e.target.value.trim().toLowerCase();
    render();
  });
  document.getElementById("modelType").addEventListener("change", (e) => {
    state.modelType = e.target.value;
    render();
  });
  document.getElementById("card").addEventListener("change", (e) => {
    state.card = e.target.value;
    render();
  });
  document.getElementById("jbModel").addEventListener("change", (e) => {
    state.jbModel = e.target.value;
    render();
  });
  document.getElementById("reset").addEventListener("click", () => {
    state.q = "";
    state.modelType = "all";
    state.card = "all";
    state.jbModel = "all";
    document.getElementById("q").value = "";
    document.getElementById("modelType").value = "all";
    document.getElementById("card").value = "all";
    document.getElementById("jbModel").value = "all";
    render();
  });

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.getAttribute("data-tab")));
  });

  const meta = state.data.meta;
  document.getElementById("verified").textContent =
    `最後驗證：${meta.verifiedDate}（${meta.timezone}）`;
  document.getElementById("disclaimer").textContent = meta.disclaimer;
}

function setTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".tab").forEach((btn) => {
    const on = btn.getAttribute("data-tab") === tab;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  ["api", "website", "news", "jailbreak"].forEach((t) => {
    document.getElementById(`panel-${t}`).classList.toggle("hidden", tab !== t);
    const f = document.getElementById(`filters-${t}`);
    if (f) f.classList.toggle("hidden", tab !== t);
  });
  const placeholders = {
    api: "搜尋關鍵字：服務商、模型、主機、說明…",
    website: "搜尋關鍵字：網站名稱、網址、說明、來源…",
    news: "搜尋關鍵字：新聞、教學、提示詞資源…",
    jailbreak: "搜尋關鍵字：標題、模型、輔助操作、來源…"
  };
  document.getElementById("q").placeholder = placeholders[tab] || "搜尋關鍵字…";
  render();
}

function populateJbModels() {
  const select = document.getElementById("jbModel");
  const models = new Set();
  for (const j of state.data.jailbreaks || []) {
    if (j.model) models.add(j.model);
  }
  const sorted = [...models].sort((a, b) => a.localeCompare(b, "zh-Hant"));
  for (const m of sorted) {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    select.appendChild(opt);
  }
  const optNone = document.createElement("option");
  optNone.value = "__none__";
  optNone.textContent = "（未標模型）";
  select.appendChild(optNone);
}

function allWebsites() {
  if (state.data.websites && state.data.websites.length) {
    return state.data.websites.map((r) => ({
      ...r,
      fromXinyuan: r.source === "鑫源AI分享",
      verifiedOk: r.verified !== false
    }));
  }
  // fallback legacy
  const existing = (state.data.resources || []).filter((r) => r.type === "website");
  return existing.map((r) => ({ ...r, fromXinyuan: false, verifiedOk: true }));
}

function allNews() {
  return (state.data.newsTeaching || []).map((r) => ({
    ...r,
    fromXinyuan: r.source === "鑫源AI分享",
    verifiedOk: r.verified !== false
  }));
}

function filterApis() {
  return (state.data.resources || []).filter((r) => {
    if (r.type !== "api") return false;
    if (state.card === "no" && r.cardRequired) return false;
    if (state.card === "yes" && !r.cardRequired) return false;
    if (state.modelType !== "all") {
      const types = r.modelTypes || [];
      if (!types.includes(state.modelType)) return false;
    }
    if (state.q) {
      const hay = [
        r.name,
        r.host || "",
        r.url || "",
        r.freeSummary || "",
        r.notes || "",
        r.offers || "",
        ...(r.models || []).map((m) => m.id),
        ...(r.modelTypes || [])
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  });
}

function filterByQuery(list) {
  return list.filter((r) => {
    if (!state.q) return true;
    const hay = [
      r.name,
      r.url || "",
      r.host || "",
      r.freeSummary || "",
      r.offers || "",
      r.notes || "",
      r.source || "",
      r.firstSeen || ""
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(state.q);
  });
}

function filterJailbreaks() {
  return (state.data.jailbreaks || []).filter((j) => {
    if (state.jbModel === "__none__") {
      if (j.model) return false;
    } else if (state.jbModel !== "all" && j.model !== state.jbModel) {
      return false;
    }
    if (state.q) {
      const hay = [
        j.title || "",
        j.model || "",
        j.prompt_summary || "",
        j.usage_from_post || "",
        j.ops_help || "",
        j.prompt || "",
        j.prompt_status || "",
        j.post_url || "",
        j.notion_url || "",
        j.file_link || "",
        j.date || ""
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  });
}

function renderCounters() {
  const apis = (state.data.resources || []).filter((r) => r.type === "api");
  document.getElementById("count-api").textContent = apis.length;
  document.getElementById("count-web").textContent = allWebsites().length;
  document.getElementById("count-news").textContent = allNews().length;
  document.getElementById("count-jb").textContent = (state.data.jailbreaks || []).length;
}

function modelChips(models) {
  if (!models || !models.length) return '<span class="placeholder">（預留欄位）</span>';
  return models
    .map((m) => {
      const types = (m.types || []).map((t) => TYPE_LABEL[t] || t).join("、");
      const id = m.id || "";
      return `<span class="model-chip"><span class="model-id">${escapeHtml(id)}</span>${
        types ? `<small>${escapeHtml(types)}</small>` : ""
      }<button class="btn btn-copy btn-copy-model" type="button" data-copy="${escapeAttr(
        id
      )}" title="複製模型名">複製</button></span>`;
    })
    .join("");
}

function apiCardHtml(r) {
  const host = r.host || r.url || "";
  const cardBadge = r.cardRequired
    ? '<span class="badge warn">需綁卡</span>'
    : '<span class="badge ok">免信用卡</span>';
  const commercialBadge =
    r.commercialOk === false ? '<span class="badge no">非商用／非生產</span>' : "";
  const keyBtn = r.keyUrl
    ? `<a class="btn btn-accent" href="${escapeAttr(r.keyUrl)}" target="_blank" rel="noopener">申請 KEY</a>`
    : "";
  const siteBtn =
    r.url || r.docsUrl
      ? `<a class="btn" href="${escapeAttr(r.url || r.docsUrl)}" target="_blank" rel="noopener">官方文件</a>`
      : "";

  return `
  <article class="card" data-id="${escapeAttr(r.id)}">
    <div class="card-head">
      <h3>${escapeHtml(r.name)}</h3>
      <div class="badges"><span class="badge api">API</span>${cardBadge}${commercialBadge}</div>
    </div>
    <div>
      <div class="field-label">主機位址</div>
      <div class="host-row">
        <code class="host" title="${escapeAttr(host)}">${escapeHtml(host)}</code>
        <button class="btn btn-copy" type="button" data-copy="${escapeAttr(host)}">複製</button>
      </div>
    </div>
    <div>
      <div class="field-label">模型／類型</div>
      <div class="models">${modelChips(r.models)}</div>
    </div>
    <div>
      <div class="field-label">免費程度說明</div>
      <div class="free-text">${escapeHtml(r.freeSummary || "—")}</div>
      ${
        r.notes
          ? `<div class="free-text" style="margin-top:0.35rem;opacity:.85">${escapeHtml(r.notes)}</div>`
          : ""
      }
    </div>
    <div class="actions">${keyBtn}${siteBtn}</div>
    <div class="meta-row">
      <span>最後更新：${escapeHtml(r.verified || "—")}</span>
      ${(r.modelTypes || [])
        .map((t) => `<span>${escapeHtml(TYPE_LABEL[t] || t)}</span>`)
        .join("")}
    </div>
  </article>`;
}

function siteLikeCardHtml(r, kind) {
  const host = r.url || r.host || "";
  const kindBadge =
    kind === "news"
      ? '<span class="badge api">新聞／教學</span>'
      : '<span class="badge website">網站</span>';
  const sourceBadge =
    r.fromXinyuan || r.source === "鑫源AI分享"
      ? '<span class="badge website">鑫源AI分享</span>'
      : '<span class="badge website">示範站</span>';
  const statusBadge = '<span class="badge ok">已驗證</span>';
  const siteBtn = host
    ? `<a class="btn btn-accent" href="${escapeAttr(host)}" target="_blank" rel="noopener">開啟網站</a>`
    : "";
  const offers = r.offers || r.freeSummary
    ? `<div><div class="field-label">提供內容</div><div class="free-text">${escapeHtml(
        r.offers || r.freeSummary || ""
      )}</div></div>`
    : "";
  const notes = r.notes
    ? `<div class="free-text" style="opacity:.85">${escapeHtml(r.notes)}</div>`
    : "";
  const sourceRow =
    r.fromXinyuan || r.source === "鑫源AI分享"
      ? `<div class="meta-row">
          <span>來源：鑫源AI分享</span>
          ${r.firstSeen ? `<span>首次見過：${escapeHtml(r.firstSeen)}</span>` : ""}
          ${
            r.sourcePostUrl
              ? `<a href="${escapeAttr(r.sourcePostUrl)}" target="_blank" rel="noopener">來源帖</a>`
              : ""
          }
        </div>`
      : `<div class="meta-row"><span>最後更新：${escapeHtml(
          r.verifiedDate || r.verified || "—"
        )}</span></div>`;

  return `
  <article class="card" data-id="${escapeAttr(r.id || r.name)}">
    <div class="card-head">
      <h3>${escapeHtml(r.name)}</h3>
      <div class="badges">${kindBadge}${sourceBadge}${statusBadge}</div>
    </div>
    <div>
      <div class="field-label">網址</div>
      <div class="host-row">
        <code class="host" title="${escapeAttr(host)}">${escapeHtml(host)}</code>
        <button class="btn btn-copy" type="button" data-copy="${escapeAttr(host)}">複製</button>
      </div>
    </div>
    ${offers}
    ${notes}
    <div class="actions">${siteBtn}</div>
    ${sourceRow}
  </article>`;
}

function truncate(s, n) {
  const t = (s || "").trim();
  if (t.length <= n) return t;
  return t.slice(0, n).trimEnd() + "…";
}

function jbCardHtml(j) {
  const status = PROMPT_STATUS_LABEL[j.prompt_status] || j.prompt_status || "未知";
  const modelBadge = j.model
    ? `<span class="badge api">${escapeHtml(j.model)}</span>`
    : '<span class="badge">未標模型</span>';
  const links = [];
  if (j.post_url || j.source_url) {
    links.push(
      `<a class="btn btn-accent" href="${escapeAttr(
        j.post_url || j.source_url
      )}" target="_blank" rel="noopener">Telegram 來源</a>`
    );
  }
  if (j.notion_url) {
    links.push(
      `<a class="btn" href="${escapeAttr(j.notion_url)}" target="_blank" rel="noopener">Notion</a>`
    );
  }
  if (j.file_link && j.file_link !== j.notion_url && j.file_link !== j.post_url && j.file_link !== j.source_url) {
    links.push(
      `<a class="btn" href="${escapeAttr(j.file_link)}" target="_blank" rel="noopener">檔案連結</a>`
    );
  } else if (j.file_link && j.prompt_status === "file_link_available") {
    // already added if different; if same as post, still show label via status
  }
  if (j.prompt_file) {
    links.push(
      `<a class="btn" href="${escapeAttr(j.prompt_file)}" target="_blank" rel="noopener">下載正文</a>`
    );
  }

  const promptBlock = j.prompt
    ? `<details class="usage-fold" open>
        <summary>提示詞正文</summary>
        <pre class="prompt-body">${escapeHtml(j.prompt)}</pre>
      </details>`
    : j.prompt_status === "attachment_only_telegram_login_required"
      ? `<div class="free-text">需 Telegram 打開附件以取得全文。</div>`
      : j.prompt_status === "notion_login_wall"
        ? `<div class="free-text">Notion 匿名驗證無法讀取正文；請自行打開 Notion 連結（可能需登入）。</div>`
        : "";

  const ops =
    j.ops_help
      ? `<div><div class="field-label">輔助操作</div><div class="free-text">${escapeHtml(
          j.ops_help
        )}</div></div>`
      : "";

  const summary = j.prompt_summary
    ? `<div><div class="field-label">索引說明</div><div class="free-text">${escapeHtml(
        j.prompt_summary
      )}</div></div>`
    : "";

  const usage = truncate(j.usage_from_post || "", 280);
  const usageBlock = usage
    ? `<details class="usage-fold">
        <summary>帖文摘要</summary>
        <div class="free-text">${escapeHtml(usage)}</div>
      </details>`
    : "";

  return `
  <article class="card" data-id="${escapeAttr(j.id)}">
    <div class="card-head">
      <h3>${escapeHtml(j.title || "未命名")}</h3>
      <div class="badges">${modelBadge}<span class="badge warn">${escapeHtml(status)}</span></div>
    </div>
    ${ops}
    ${summary}
    ${promptBlock}
    ${usageBlock}
    <div class="actions">${links.join("")}</div>
    <div class="meta-row">
      <span>${escapeHtml(j.date || "—")}</span>
      ${j.attachment_size ? `<span>附件 ${escapeHtml(j.attachment_size)}</span>` : ""}
    </div>
  </article>`;
}

function renderChangelog() {
  const box = document.getElementById("changelog");
  const adds = state.data.changelog || [];
  const dels = state.data.deletions || [];
  let html = "<h2>最近新增／刪除</h2>";
  if (!adds.length && !dels.length) {
    html += '<p class="placeholder">尚無異動紀錄（預留）</p>';
  } else {
    for (const c of adds.slice(0, 8)) {
      const tag =
        c.action === "removed"
          ? '<div class="tag-deleted">刪除</div>'
          : c.action === "updated"
            ? '<div class="tag-added">更新</div>'
            : '<div class="tag-added">新增</div>';
      html += `<div class="change-item"><div>${escapeHtml(c.date)}</div>${tag}<div>${escapeHtml(
        (c.items || []).join("、")
      )}</div></div>`;
    }
    for (const c of (dels || []).slice(0, 3)) {
      const parts = (c.items || []).map((it) => {
        if (typeof it === "string") return it;
        const name = it.name || it.id || "";
        const reason = it.reason ? `：${it.reason}` : "";
        return `${name}${reason}`;
      });
      html += `<div class="change-item"><div>${escapeHtml(
        c.date
      )}</div><div class="tag-deleted">刪除</div><div>${escapeHtml(parts.join("；"))}</div></div>`;
    }
  }
  box.innerHTML = html;
}

function bindCopyButtons(root) {
  root.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add("copied");
        const prev = btn.textContent;
        btn.textContent = "已複製";
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.textContent = prev === "已複製" ? "複製" : prev;
          if (btn.classList.contains("btn-copy-model")) btn.textContent = "複製";
        }, 1200);
      } catch {
        btn.textContent = "失敗";
      }
    });
  });
}

function render() {
  renderCounters();
  renderChangelog();

  if (state.tab === "api") {
    const list = filterApis();
    const total = (state.data.resources || []).filter((r) => r.type === "api").length;
    document.getElementById("showing").textContent = `顯示 ${list.length}／${total}`;
    const grid = document.getElementById("api-grid");
    grid.innerHTML = list.length
      ? list.map(apiCardHtml).join("")
      : '<div class="empty">沒有符合條件的 API 資源</div>';
    bindCopyButtons(grid);
  } else if (state.tab === "website") {
    const list = filterByQuery(allWebsites());
    const total = allWebsites().length;
    document.getElementById("showing-web").textContent = `顯示 ${list.length}／${total}`;
    const grid = document.getElementById("web-grid");
    grid.innerHTML = list.length
      ? list.map((r) => siteLikeCardHtml(r, "website")).join("")
      : '<div class="empty">沒有符合條件的網站資源</div>';
    bindCopyButtons(grid);
  } else if (state.tab === "news") {
    const list = filterByQuery(allNews());
    const total = allNews().length;
    document.getElementById("showing-news").textContent = `顯示 ${list.length}／${total}`;
    const grid = document.getElementById("news-grid");
    grid.innerHTML = list.length
      ? list.map((r) => siteLikeCardHtml(r, "news")).join("")
      : '<div class="empty">沒有符合條件的新聞／教學資源</div>';
    bindCopyButtons(grid);
  } else {
    const list = filterJailbreaks();
    const total = (state.data.jailbreaks || []).length;
    document.getElementById("showing-jb").textContent = `顯示 ${list.length}／${total}`;
    const grid = document.getElementById("jb-grid");
    grid.innerHTML = list.length
      ? list.map(jbCardHtml).join("")
      : '<div class="empty">沒有符合條件的越獄目錄項目</div>';
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll("'", "&#39;");
}

load().catch((err) => {
  document.getElementById("api-grid").innerHTML = `<div class="empty">載入 data.json 失敗：${escapeHtml(
    err.message
  )}。請用本機伺服器開啟。</div>`;
});
