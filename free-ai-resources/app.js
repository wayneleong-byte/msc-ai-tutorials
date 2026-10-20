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
  attachment_only_telegram_login_required: "僅附件（需 Telegram 登入）",
  mentioned_in_post_no_full_text: "帖文提及（無全文）",
  notion_login_wall: "Notion 牆（需登入）"
};

const state = {
  data: null,
  tab: "api",
  q: "",
  modelType: "all",
  card: "all",
  verified: "all",
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
  document.getElementById("verifiedFilter").addEventListener("change", (e) => {
    state.verified = e.target.value;
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
    state.verified = "all";
    state.jbModel = "all";
    document.getElementById("q").value = "";
    document.getElementById("modelType").value = "all";
    document.getElementById("card").value = "all";
    document.getElementById("verifiedFilter").value = "all";
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
  document.getElementById("panel-api").classList.toggle("hidden", tab !== "api");
  document.getElementById("panel-website").classList.toggle("hidden", tab !== "website");
  document.getElementById("panel-jailbreak").classList.toggle("hidden", tab !== "jailbreak");
  document.getElementById("filters-api").classList.toggle("hidden", tab !== "api");
  document.getElementById("filters-website").classList.toggle("hidden", tab !== "website");
  document.getElementById("filters-jailbreak").classList.toggle("hidden", tab !== "jailbreak");
  const placeholders = {
    api: "搜尋關鍵字：服務商、模型、主機、說明…",
    website: "搜尋關鍵字：網站名稱、網址、說明、來源…",
    jailbreak: "搜尋關鍵字：標題、模型、摘要、來源…"
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
  const existing = (state.data.resources || []).filter((r) => r.type === "website");
  const xy = (state.data.xinyuanWebsites || []).map((r) => ({
    ...r,
    fromXinyuan: true
  }));
  return [...existing.map((r) => ({ ...r, fromXinyuan: false, verified: r.verified !== false })), ...xy];
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

function filterWebsites() {
  return allWebsites().filter((r) => {
    const ok = r.verified === true || r.verified === undefined;
    if (state.verified === "yes" && !ok) return false;
    if (state.verified === "no" && ok) return false;
    if (state.q) {
      const hay = [
        r.name,
        r.url || "",
        r.host || "",
        r.freeSummary || "",
        r.offers || "",
        r.notes || "",
        r.verifyFailReason || "",
        r.source || "",
        r.firstSeen || ""
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
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
        j.prompt_status || "",
        j.post_url || "",
        j.notion_url || "",
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
  const webs = allWebsites();
  const jbs = state.data.jailbreaks || [];
  document.getElementById("count-api").textContent = apis.length;
  document.getElementById("count-web").textContent = webs.length;
  document.getElementById("count-jb").textContent = jbs.length;
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

function webCardHtml(r) {
  const ok = r.verified === true || (r.verified === undefined && !r.fromXinyuan);
  const fail = r.verified === false;
  const host = r.url || r.host || "";
  const statusBadge = ok
    ? '<span class="badge ok">已驗證</span>'
    : fail
      ? '<span class="badge no">未通過</span>'
      : '<span class="badge warn">未核對</span>';
  const sourceBadge = r.fromXinyuan || r.source === "鑫源AI分享"
    ? '<span class="badge website">鑫源AI分享</span>'
    : '<span class="badge website">示範站</span>';
  const cardClass = fail ? "card card-failed" : "card";
  const failReason =
    fail && (r.verifyFailReason || r.notes)
      ? `<div class="fail-reason"><div class="field-label">未通過原因</div><div class="free-text">${escapeHtml(
          r.verifyFailReason || r.notes
        )}</div></div>`
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
      : `<div class="meta-row"><span>最後更新：${escapeHtml(r.verified || r.verifiedDate || "—")}</span></div>`;

  const siteBtn = host
    ? `<a class="btn ${fail ? "" : "btn-accent"}" href="${escapeAttr(host)}" target="_blank" rel="noopener">開啟網站</a>`
    : "";

  const offers = r.offers || r.freeSummary
    ? `<div><div class="field-label">提供內容</div><div class="free-text">${escapeHtml(
        r.offers || r.freeSummary || ""
      )}</div></div>`
    : "";

  const notes =
    r.notes && !fail
      ? `<div class="free-text" style="opacity:.85">${escapeHtml(r.notes)}</div>`
      : "";

  return `
  <article class="${cardClass}" data-id="${escapeAttr(r.id || r.name)}">
    <div class="card-head">
      <h3>${escapeHtml(r.name)}</h3>
      <div class="badges">${sourceBadge}${statusBadge}</div>
    </div>
    <div>
      <div class="field-label">網站網址</div>
      <div class="host-row">
        <code class="host" title="${escapeAttr(host)}">${escapeHtml(host)}</code>
        <button class="btn btn-copy" type="button" data-copy="${escapeAttr(host)}">複製</button>
      </div>
    </div>
    ${offers}
    ${notes}
    ${failReason}
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
  const usage = truncate(j.usage_from_post || "", 280);
  const summary = j.prompt_summary || "";
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
    ${
      summary
        ? `<div><div class="field-label">索引說明</div><div class="free-text">${escapeHtml(
            summary
          )}</div></div>`
        : ""
    }
    ${usageBlock}
    <div class="actions">${links.join("")}</div>
    <div class="meta-row">
      <span>${escapeHtml(j.date || "—")}</span>
      ${j.attachment_size ? `<span>附件 ${escapeHtml(j.attachment_size)}</span>` : ""}
      <span>不含提示詞正文</span>
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
    for (const c of adds) {
      const tag =
        c.action === "removed"
          ? '<div class="tag-deleted">刪除</div>'
          : '<div class="tag-added">新增</div>';
      html += `<div class="change-item"><div>${escapeHtml(c.date)}</div>${tag}<div>${escapeHtml(
        (c.items || []).join("、")
      )}</div></div>`;
    }
    if (!dels.length) {
      html += `<div class="change-item"><div>—</div><div class="tag-deleted">刪除</div><div class="placeholder">尚無刪除項目（預留）</div></div>`;
    } else {
      for (const c of dels) {
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
    const list = filterWebsites();
    const total = allWebsites().length;
    document.getElementById("showing-web").textContent = `顯示 ${list.length}／${total}`;
    const grid = document.getElementById("web-grid");
    grid.innerHTML = list.length
      ? list.map(webCardHtml).join("")
      : '<div class="empty">沒有符合條件的網站資源</div>';
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
