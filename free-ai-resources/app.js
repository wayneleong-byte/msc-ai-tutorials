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

const state = {
  data: null,
  q: "",
  type: "all",
  modelType: "all",
  card: "all"
};

async function load() {
  const res = await fetch("./data.json", { cache: "no-store" });
  state.data = await res.json();
  bindUI();
  render();
}

function bindUI() {
  document.getElementById("q").addEventListener("input", (e) => {
    state.q = e.target.value.trim().toLowerCase();
    render();
  });
  document.getElementById("type").addEventListener("change", (e) => {
    state.type = e.target.value;
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
  document.getElementById("reset").addEventListener("click", () => {
    state.q = "";
    state.type = "all";
    state.modelType = "all";
    state.card = "all";
    document.getElementById("q").value = "";
    document.getElementById("type").value = "all";
    document.getElementById("modelType").value = "all";
    document.getElementById("card").value = "all";
    render();
  });

  const meta = state.data.meta;
  document.getElementById("verified").textContent = `最後驗證：${meta.verifiedDate}（${meta.timezone}）`;
  document.getElementById("disclaimer").textContent = meta.disclaimer;
}

function filtered() {
  return state.data.resources.filter((r) => {
    if (state.type !== "all" && r.type !== state.type) return false;
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
      ].join(" ").toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  });
}

function renderCounters(list) {
  const all = state.data.resources;
  document.getElementById("count-total").textContent = all.length;
  document.getElementById("count-api").textContent = all.filter((r) => r.type === "api").length;
  document.getElementById("count-web").textContent = all.filter((r) => r.type === "website").length;
  document.getElementById("showing").textContent = `顯示 ${list.length}／${all.length}`;
}

function modelChips(models) {
  if (!models || !models.length) return '<span class="placeholder">（預留欄位）</span>';
  return models.map((m) => {
    const types = (m.types || []).map((t) => TYPE_LABEL[t] || t).join("、");
    return `<span class="model-chip">${escapeHtml(m.id)}${types ? `<small>${escapeHtml(types)}</small>` : ""}</span>`;
  }).join("");
}

function cardHtml(r) {
  const isApi = r.type === "api";
  const host = r.host || r.url || "";
  const typeBadge = isApi
    ? '<span class="badge api">API</span>'
    : '<span class="badge website">網站</span>';
  const cardBadge = r.cardRequired
    ? '<span class="badge warn">需綁卡</span>'
    : '<span class="badge ok">免信用卡</span>';
  const commercialBadge = r.commercialOk === false
    ? '<span class="badge no">非商用／非生產</span>'
    : "";

  const keyBtn = r.keyUrl
    ? `<a class="btn btn-accent" href="${escapeAttr(r.keyUrl)}" target="_blank" rel="noopener">申請 KEY</a>`
    : "";
  const siteBtn = (r.url || r.docsUrl)
    ? `<a class="btn" href="${escapeAttr(r.url || r.docsUrl)}" target="_blank" rel="noopener">${isApi ? "官方文件" : "開啟網站"}</a>`
    : "";

  const offers = !isApi && r.offers
    ? `<div><div class="field-label">提供內容</div><div class="free-text">${escapeHtml(r.offers)}</div></div>`
    : "";

  return `
  <article class="card" data-id="${escapeAttr(r.id)}">
    <div class="card-head">
      <h3>${escapeHtml(r.name)}</h3>
      <div class="badges">${typeBadge}${cardBadge}${commercialBadge}</div>
    </div>
    <div>
      <div class="field-label">${isApi ? "主機位址" : "網站網址"}</div>
      <div class="host-row">
        <code class="host" title="${escapeAttr(host)}">${escapeHtml(host)}</code>
        <button class="btn btn-copy" type="button" data-copy="${escapeAttr(host)}">複製</button>
      </div>
    </div>
    <div>
      <div class="field-label">模型／類型</div>
      <div class="models">${modelChips(r.models)}</div>
    </div>
    ${offers}
    <div>
      <div class="field-label">免費程度說明</div>
      <div class="free-text">${escapeHtml(r.freeSummary || "—")}</div>
      ${r.notes ? `<div class="free-text" style="margin-top:0.35rem;opacity:.85">${escapeHtml(r.notes)}</div>` : ""}
    </div>
    <div class="actions">${keyBtn}${siteBtn}</div>
    <div class="meta-row">
      <span>最後更新：${escapeHtml(r.verified || "—")}</span>
      ${(r.modelTypes || []).map((t) => `<span>${escapeHtml(TYPE_LABEL[t] || t)}</span>`).join("")}
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
      html += `<div class="change-item"><div>${escapeHtml(c.date)}</div><div class="tag-added">新增</div><div>${escapeHtml((c.items || []).join("、"))}</div></div>`;
    }
    if (!dels.length) {
      html += `<div class="change-item"><div>—</div><div class="tag-deleted">刪除</div><div class="placeholder">尚無刪除項目（預留）</div></div>`;
    } else {
      for (const c of dels) {
        html += `<div class="change-item"><div>${escapeHtml(c.date)}</div><div class="tag-deleted">刪除</div><div>${escapeHtml((c.items || []).join("、"))}</div></div>`;
      }
    }
  }
  box.innerHTML = html;
}

function render() {
  const list = filtered();
  renderCounters(list);
  renderChangelog();

  const api = list.filter((r) => r.type === "api");
  const web = list.filter((r) => r.type === "website");

  document.getElementById("api-grid").innerHTML = api.length
    ? api.map(cardHtml).join("")
    : '<div class="empty">沒有符合條件的 API 資源</div>';
  document.getElementById("web-grid").innerHTML = web.length
    ? web.map(cardHtml).join("")
    : '<div class="empty">沒有符合條件的網站資源</div>';

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add("copied");
        btn.textContent = "已複製";
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.textContent = "複製";
        }, 1200);
      } catch {
        btn.textContent = "失敗";
      }
    });
  });
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
  document.getElementById("api-grid").innerHTML =
    `<div class="empty">載入 data.json 失敗：${escapeHtml(err.message)}。請用本機伺服器開啟（見 README）。</div>`;
});
