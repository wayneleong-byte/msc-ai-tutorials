#!/usr/bin/env python3
"""
make_offline.py — 把一個 HTML 檔（例如飛象老師下載的課件）變成「單一、可離線開啟」的 HTML。

做法：下載所有外部 CSS / JS / 字型 / 圖片 / 音訊，全部內嵌（inline / data: URI）到同一個檔案。

處理範圍
  * <link rel=stylesheet>、<style>、style="" 屬性：@import 會遞迴展開，url(...) 會轉成 data: URI
  * Google Fonts：用新版 Chrome UA 取 woff2；預設只保留頁面實際用到的字元所在的 unicode-range 子集（--fonts used）
  * @font-face 若同時提供 woff2 與其他格式，只保留 woff2（減少體積）
  * <script src>（一般腳本）：無 defer/async → 直接內嵌文字；有 defer/async → data: URL（保留執行時序）
  * ES modules：<script type=module>、import/export from、import("...")、既有 importmap 的裸模組名
    → 遞迴抓取整個模組圖，把相對/根目錄路徑改成絕對 URL，再用一個合併的 <script type="importmap">
      把每個 URL 對應到 data: URL（可處理循環引用）
  * <img src/srcset>、<source>、<video poster/src>、<audio src>、<track>、<link rel=icon/preload>、SVG <image href>、
    <input type=image>、<object data>、<embed src>
  * 最後再掃一次整份文件（含 JS 字串）：任何仍是絕對網址、副檔名為圖片/音訊/字型/JSON 的字串，直接換成 data: URI
  * <meta http-equiv=Content-Security-Policy> 會補上 data: blob:，避免內嵌資源被擋
  * <iframe srcdoc="...">：飛象老師下載檔把真正內容放在 srcdoc 裡，會遞迴處理裡面的 HTML
  * 「本機開啟就跳轉到線上版」的腳本（檢查 location.protocol === 'file:' 再 location.replace）會被停用，
    否則離線時只會看到「無法連上這個網站」
  * 統計／埋點腳本（飛象 frog-sdk、Google Analytics、百度統計等）預設移除（離線無用）；--keep-analytics 可保留
做不到（會列在報告中）
  * 執行時才組出來的網址（例如 `https://dict.youdao.com/dictvoice?audio=${word}`）
  * 呼叫 AI / 後端 API（fetch/XHR/WebSocket）、資料回收、登入、分享、QR code 產生服務等，本質上需要聯網
  * Web Speech 語音辨識（Chrome 需聯網）；speechSynthesis 是否離線取決於作業系統是否有本機語音
  * iframe 內嵌的遠端頁面、Web Worker、wasm（import.meta.url）

用法
  python3 make_offline.py input.html [-o output.html] [--fonts used|all] [--max-asset-mb 25] [--cache DIR] [--keep-analytics]
  （Windows：py make_offline.py input.html，或把 HTML 拖到「拖放轉換.bat」上）
  輸入也可以是 http(s) 網址。輸出旁會產生 <output>.report.json。
"""
import argparse, base64, hashlib, json, mimetypes, os, re, sys, time
import html as html_lib
import urllib.request, urllib.error, urllib.parse

CHROME_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
             "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
ASSET_EXT = r"(?:png|jpe?g|gif|svg|webp|avif|bmp|ico|mp3|wav|ogg|oga|m4a|aac|flac|mp4|webm|woff2?|ttf|otf|eot|json|glb|gltf|obj|stl|cur)"
MIME_FIX = {".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".otf": "font/otf",
            ".eot": "application/vnd.ms-fontobject", ".svg": "image/svg+xml", ".webp": "image/webp",
            ".avif": "image/avif", ".mjs": "text/javascript", ".js": "text/javascript", ".css": "text/css",
            ".json": "application/json", ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg",
            ".wav": "audio/wav", ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".ico": "image/x-icon"}


class Offliner:
    ANALYTICS = ("frog-sdk.js", "init-frog.js", "frog.yuanfudao", "google-analytics.com", "googletagmanager.com",
                 "hm.baidu.com", "cnzz.com", "umeng.com", "clarity.ms", "hotjar.com")

    def __init__(self, base_url, fonts="used", max_asset_mb=25, cache_dir=None, verbose=True, image_max_px=1600,
                 keep_analytics=False):
        self.base_url = base_url
        self.keep_analytics = keep_analytics
        self.subdocs = []                 # processed srcdoc documents (for the final scan)
        self.depth = 0
        self.image_max_px = image_max_px
        self.shrunk = {}
        self.fonts_mode = fonts
        self.max_bytes = int(max_asset_mb * 1024 * 1024)
        self.cache_dir = cache_dir
        self.verbose = verbose
        self.mem = {}                     # url -> (bytes, content_type, final_url)
        self.report = {"inlined": [], "failed": [], "skipped_too_large": [], "warnings": [],
                       "remaining_external": [], "runtime_network_calls": [], "removed": []}
        self.used_chars = set()
        self.module_data = {}             # abs url -> data url
        self.module_final = {}            # requested url -> final url
        self.import_map = {}              # from existing importmaps (resolved)
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)

    # ---------------------------------------------------------------- fetch
    def log(self, *a):
        if self.verbose:
            print(*a, file=sys.stderr)

    def abs_url(self, ref, base):
        ref = ref.strip()
        if ref.startswith("//"):
            ref = "https:" + ref
        return urllib.parse.urljoin(base, ref)

    def fetch(self, url, ua=CHROME_UA):
        """return (bytes, content_type, final_url) or None"""
        if url in self.mem:
            return self.mem[url]
        res = None
        if url.startswith("file://"):
            path = urllib.request.url2pathname(urllib.parse.urlparse(url).path)
            try:
                with open(path, "rb") as f:
                    data = f.read()
                res = (data, self.guess_mime(url, ""), url)
            except OSError as e:
                self.report["failed"].append({"url": url, "error": str(e)})
        elif url.startswith(("http://", "https://")):
            ck = None
            if self.cache_dir:
                ck = os.path.join(self.cache_dir, hashlib.sha1((ua + url).encode()).hexdigest())
                if os.path.exists(ck) and os.path.exists(ck + ".json"):
                    meta = json.load(open(ck + ".json"))
                    res = (open(ck, "rb").read(), meta["ct"], meta["final"])
            if res is None:
                last = None
                for attempt in range(3):
                    try:
                        req = urllib.request.Request(url, headers={"User-Agent": ua, "Accept": "*/*"})
                        with urllib.request.urlopen(req, timeout=40) as r:
                            data = r.read()
                            res = (data, r.headers.get("Content-Type", ""), r.geturl())
                        break
                    except Exception as e:  # noqa
                        last = e
                        time.sleep(1 + attempt)
                if res is None:
                    self.report["failed"].append({"url": url, "error": str(last)})
                    self.log("  ✗ fetch failed", url, last)
                elif ck:
                    open(ck, "wb").write(res[0])
                    json.dump({"ct": res[1], "final": res[2]}, open(ck + ".json", "w"))
        self.mem[url] = res
        return res

    @staticmethod
    def bad_ref(ref):
        """template placeholders / garbage that must not be fetched"""
        return (not ref.strip() or any(t in ref for t in ("${", "{{", "}}", "[", "]", "<", ">", "url(", "\n"))
                or ref.strip() in ("/", "./", "about:blank"))

    def prefetch(self, urls):
        """download many URLs in parallel (fills the in-memory cache)"""
        todo = [u for u in dict.fromkeys(urls) if u not in self.mem and u.startswith(("http://", "https://"))]
        if len(todo) < 2:
            return
        from concurrent.futures import ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=8) as ex:
            list(ex.map(self.fetch, todo))

    def guess_mime(self, url, ct):
        ct = (ct or "").split(";")[0].strip().lower()
        path = urllib.parse.urlparse(url).path.lower()
        ext = os.path.splitext(path)[1]
        if ext in MIME_FIX:
            return MIME_FIX[ext]
        if ct and ct not in ("application/octet-stream", "binary/octet-stream", "text/plain"):
            return ct
        return mimetypes.guess_type(path)[0] or ct or "application/octet-stream"

    def data_uri(self, url, base=None, kind="asset"):
        """download url and return data: URI (or None)"""
        if url.startswith(("data:", "blob:", "#", "javascript:", "about:", "mailto:", "tel:")):
            return None
        if self.bad_ref(url):
            return None
        absu = self.abs_url(url, base or self.base_url)
        r = self.fetch(absu)
        if not r:
            return None
        data, ct, final = r
        if len(data) > self.max_bytes:
            self.report["skipped_too_large"].append({"url": absu, "bytes": len(data)})
            return None
        mime = self.guess_mime(final, ct)
        if mime in ("image/jpeg", "image/png", "image/webp") and self.image_max_px and len(data) > 200 * 1024:
            data, mime = self.shrink_image(data, mime, absu)
        if mime == "text/css":
            css = self.process_css(data.decode("utf-8", "replace"), final)
            data = css.encode("utf-8")
        self.report["inlined"].append({"url": absu, "bytes": len(data), "kind": kind})
        b64 = base64.b64encode(data).decode("ascii")
        return f"data:{mime};base64,{b64}"

    def shrink_image(self, data, mime, url):
        """downscale very large photos (AI-generated images are often 1-2 MB) — keeps format & alpha"""
        if url in self.shrunk:
            return self.shrunk[url]
        res = (data, mime)
        try:
            from PIL import Image
            import io
            im = Image.open(io.BytesIO(data))
            if getattr(im, "is_animated", False):
                return res
            w, h = im.size
            scale = min(1.0, self.image_max_px / max(w, h))
            if scale < 1.0:
                im = im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
            buf = io.BytesIO()
            if mime == "image/png" and im.mode in ("RGBA", "LA", "P"):
                im.save(buf, "PNG", optimize=True)
                out_mime = "image/png"
            else:
                im.convert("RGB").save(buf, "JPEG", quality=82, optimize=True, progressive=True)
                out_mime = "image/jpeg"
            if buf.tell() < len(data) * 0.9:
                self.report.setdefault("images_shrunk", []).append(
                    {"url": url, "from_bytes": len(data), "to_bytes": buf.tell(), "from_px": [w, h]})
                res = (buf.getvalue(), out_mime)
        except Exception as e:  # noqa
            self.report["warnings"].append(f"image shrink failed for {url}: {e}")
        self.shrunk[url] = res
        return res

    # ---------------------------------------------------------------- CSS
    RE_IMPORT = re.compile(
        r"""@import\s+(?:url\(\s*(["'])(.*?)\1\s*\)|url\(\s*([^)\s"']+)\s*\)|(["'])(.*?)\4)\s*([^;]*);""", re.I | re.S)
    RE_URL = re.compile(r"""url\(\s*(["']?)([^"')]+?)\1\s*\)""", re.I)
    RE_FONTFACE = re.compile(r"@font-face\s*{[^}]*}", re.I | re.S)

    def is_google_fonts(self, url):
        return "fonts.googleapis.com" in url

    def process_css(self, css, base, depth=0):
        if depth > 8:
            self.report["warnings"].append(f"@import too deep at {base}")
            return css

        def imp(m):
            ref = m.group(2) or m.group(3) or m.group(5) or ""
            media = (m.group(6) or "").strip()
            if ref.startswith("data:"):
                return m.group(0)
            absu = self.abs_url(ref, base)
            r = self.fetch(absu)
            if not r:
                return m.group(0)
            sub = self.process_css(r[0].decode("utf-8", "replace"), r[2], depth + 1)
            self.report["inlined"].append({"url": absu, "bytes": len(sub), "kind": "css@import"})
            return f"@media {media}{{\n{sub}\n}}" if media else sub

        css = self.RE_IMPORT.sub(imp, css)
        css = self.RE_FONTFACE.sub(lambda m: self.process_fontface(m.group(0), base), css)

        def u(m):
            ref = m.group(2).strip()
            if ref.startswith(("data:", "#", "blob:")):
                return m.group(0)
            d = self.data_uri(ref, base, "css-url")
            return f'url("{d}")' if d else m.group(0)

        self.prefetch([self.abs_url(m.group(2), base) for m in self.RE_URL.finditer(css)
                       if not m.group(2).strip().startswith(("data:", "#", "blob:")) and not self.bad_ref(m.group(2))])
        return self.RE_URL.sub(u, css)

    def process_fontface(self, block, base):
        # keep only the woff2 source when several formats are listed
        srcm = re.search(r"src\s*:\s*([^;}]+)", block, re.I)
        if srcm and "woff2" in srcm.group(1) and srcm.group(1).count("url(") > 1:
            parts = [p for p in re.split(r",(?![^(]*\))", srcm.group(1)) if "woff2" in p or "local(" in p]
            if parts:
                block = block.replace(srcm.group(1), ",".join(parts))
        # drop unicode-range subsets that the page never uses
        if self.fonts_mode == "used":
            ur = re.search(r"unicode-range\s*:\s*([^;}]+)", block, re.I)
            if ur and self.used_chars and not self.range_used(ur.group(1)):
                return "/* subset dropped by make_offline (unused unicode-range) */"
        return block

    def range_used(self, spec):
        for part in spec.split(","):
            part = part.strip().upper().replace("U+", "")
            try:
                if "?" in part:
                    lo, hi = int(part.replace("?", "0"), 16), int(part.replace("?", "F"), 16)
                elif "-" in part:
                    a, b = part.split("-")
                    lo, hi = int(a, 16), int(b, 16)
                else:
                    lo = hi = int(part, 16)
            except ValueError:
                return True
            if any(lo <= c <= hi for c in self.used_chars):
                return True
        return False

    def fetch_css_text(self, url):
        ua = CHROME_UA  # Chrome UA → Google Fonts returns woff2 + unicode-range subsets
        r = self.fetch(url, ua)
        if not r:
            return None, url
        return r[0].decode("utf-8", "replace"), r[2]

    # ---------------------------------------------------------------- JS modules
    RE_STATIC_IMPORT = re.compile(
        r"""(\b(?:import|export)\s*(?:[\w*$\s{},]*?\s*from\s*)?)(["'])([^"'\n]+)\2""")
    RE_DYN_IMPORT = re.compile(r"""(\bimport\s*\(\s*)(["'])([^"'\n]+)\2(\s*\))""")

    def resolve_spec(self, spec, base):
        if spec in self.import_map:
            return self.import_map[spec]
        for k, v in sorted(self.import_map.items(), key=lambda kv: -len(kv[0])):
            if k.endswith("/") and spec.startswith(k):
                return v + spec[len(k):]
        if spec.startswith(("./", "../", "/")) or re.match(r"^[a-z][a-z0-9+.-]*:", spec, re.I):
            if spec.startswith(("data:", "blob:")):
                return None
            return self.abs_url(spec, base)
        return None  # bare specifier with no mapping

    def rewrite_module_source(self, src, base, queue):
        def fix(m, dyn=False):
            spec = m.group(3)
            absu = self.resolve_spec(spec, base)
            if not absu:
                if not spec.startswith(("data:", "blob:")):
                    self.report["warnings"].append(f"unresolved bare module specifier '{spec}' in {base}")
                return m.group(0)
            queue.append(absu)
            if dyn:
                return f"{m.group(1)}{m.group(2)}{absu}{m.group(2)}{m.group(4)}"
            return f"{m.group(1)}{m.group(2)}{absu}{m.group(2)}"
        src = self.RE_STATIC_IMPORT.sub(lambda m: fix(m), src)
        src = self.RE_DYN_IMPORT.sub(lambda m: fix(m, True), src)
        if "import.meta.url" in src:
            self.report["warnings"].append(f"import.meta.url used in {base} (relative assets/workers may break)")
        if re.search(r"\bimport\s*\(\s*[^\"'\s)]", src):
            self.report["warnings"].append(f"dynamic import() with a non-literal argument in {base}")
        return src

    def load_module_graph(self, entry_urls):
        queue = list(entry_urls)
        done = set()
        while queue:
            url = queue.pop()
            if url in done or url in self.module_data:
                continue
            done.add(url)
            r = self.fetch(url)
            if not r:
                continue
            data, ct, final = r
            self.module_final[url] = final
            sub = []
            src = self.rewrite_module_source(data.decode("utf-8", "replace"), final, sub)
            b64 = base64.b64encode(src.encode("utf-8")).decode("ascii")
            du = f"data:text/javascript;base64,{b64}"
            self.module_data[url] = du
            self.module_data[final] = du
            self.report["inlined"].append({"url": url, "bytes": len(src), "kind": "es-module"})
            queue.extend(s for s in sub if s not in done)

    # ---------------------------------------------------------------- HTML
    RE_SEG = re.compile(r"(<!--.*?-->)|(<script\b[^>]*>)(.*?)(</script\s*>)|(<style\b[^>]*>)(.*?)(</style\s*>)",
                        re.I | re.S)
    RE_TAG = re.compile(r"<([a-zA-Z][a-zA-Z0-9:-]*)\b((?:[^>\"']|\"[^\"]*\"|'[^']*')*)>", re.S)
    RE_ATTR = re.compile(r"""([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?""")

    @staticmethod
    def get_attr(attrs, name):
        for m in Offliner.RE_ATTR.finditer(attrs):
            if m.group(1).lower() == name:
                v = m.group(2) if m.group(2) is not None else (m.group(3) if m.group(3) is not None else m.group(4))
                return v if v is not None else ""
        return None

    @staticmethod
    def set_attr(attrs, name, value):
        value = value.replace('"', "&quot;")
        pat = re.compile(r"""(\s)%s(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+))?""" % re.escape(name), re.I)
        if pat.search(attrs):
            return pat.sub(lambda m: f'{m.group(1)}{name}="{value}"', attrs, count=1)
        return attrs + f' {name}="{value}"'

    @staticmethod
    def del_attr(attrs, name):
        return re.sub(r"""\s%s(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>"']+))?""" % re.escape(name), "", attrs, flags=re.I)

    @staticmethod
    def unescape_attr(v):
        return v.replace("&amp;", "&").replace("&quot;", '"').replace("&#39;", "'")

    def process_srcset(self, val, base):
        out = []
        for part in val.split(","):
            bits = part.strip().split()
            if not bits:
                continue
            d = self.data_uri(self.unescape_attr(bits[0]), base, "img-srcset")
            out.append(" ".join([d or bits[0]] + bits[1:]))
        return ", ".join(out)

    def process_tag(self, tag, attrs, base):
        t = tag.lower()
        def inline_attr(a, kind):
            nonlocal attrs
            v = self.get_attr(attrs, a)
            if v and not v.startswith("data:"):
                d = self.data_uri(self.unescape_attr(v), base, kind)
                if d:
                    attrs = self.set_attr(attrs, a, d)
        if t == "link":
            rel = (self.get_attr(attrs, "rel") or "").lower()
            href = self.get_attr(attrs, "href")
            if not href or self.bad_ref(href):
                return f"<{tag}{attrs}>"
            href = self.unescape_attr(href)
            absu = self.abs_url(href, base)
            if "stylesheet" in rel:
                css, final = self.fetch_css_text(absu)
                if css is None:
                    return f"<{tag}{attrs}>"
                css = self.process_css(css, final)
                self.report["inlined"].append({"url": absu, "bytes": len(css), "kind": "stylesheet"})
                media = self.get_attr(attrs, "media")
                m = f' media="{media}"' if media else ""
                css = css.replace("</style", "<\\/style")
                return f'<style data-offline-from="{absu[:200]}"{m}>\n{css}\n</style>'
            if rel in ("preconnect", "dns-prefetch"):
                return ""  # useless offline
            if "modulepreload" in rel:
                return ""  # modules are in the importmap
            if any(k in rel for k in ("icon", "preload", "prefetch", "apple-touch-icon", "manifest")):
                if "preload" in rel and (self.get_attr(attrs, "as") or "") in ("style", "script", "font"):
                    return ""  # the real <link>/<script>/@font-face is inlined separately
                inline_attr("href", "link-" + rel)
            return f"<{tag}{attrs}>"
        if t in ("img", "source", "input", "track", "audio", "video", "embed", "iframe"):
            if t == "iframe":
                src = self.get_attr(attrs, "src")
                srcdoc = self.get_attr(attrs, "srcdoc")
                if srcdoc and self.depth < 3:
                    inner = self.process_subdoc(html_lib.unescape(srcdoc))
                    attrs = self.set_attr(attrs, "srcdoc", inner.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
                elif src and src.startswith(("http", "//")):
                    self.report["warnings"].append(f"iframe to remote page not inlined: {src}")
            else:
                inline_attr("src", t)
            if t in ("img", "source"):
                ss = self.get_attr(attrs, "srcset")
                if ss and "data:" not in ss:
                    attrs = self.set_attr(attrs, "srcset", self.process_srcset(ss, base))
            if t == "video":
                inline_attr("poster", "video-poster")
            if t in ("img", "iframe"):
                for a in ("loading",):
                    pass
        elif t in ("image", "use", "feimage"):
            for a in ("href", "xlink:href"):
                v = self.get_attr(attrs, a)
                if v and v.startswith(("http", "//")):
                    inline_attr(a, "svg-" + t)
        elif t == "object":
            inline_attr("data", "object")
        elif t == "meta":
            he = (self.get_attr(attrs, "http-equiv") or "").lower()
            if he == "content-security-policy":
                c = self.get_attr(attrs, "content") or ""
                attrs = self.set_attr(attrs, "content", self.relax_csp(self.unescape_attr(c)))
                self.report["warnings"].append("CSP meta relaxed to allow data:/blob: sources")
        # inline style attribute
        st = self.get_attr(attrs, "style")
        if st and "url(" in st:
            attrs = self.set_attr(attrs, "style", self.process_css(self.unescape_attr(st), base).replace('"', "'"))
        return f"<{tag}{attrs}>"

    def relax_csp(self, csp):
        out = []
        for d in csp.split(";"):
            d2 = d.strip()
            if not d2:
                continue
            name = d2.split()[0].lower()
            if name.endswith("-src") or name == "default-src":
                for tok in ("data:", "blob:", "'unsafe-inline'" if name in ("script-src", "style-src", "default-src") else None):
                    if tok and tok not in d2:
                        d2 += " " + tok
            out.append(d2)
        return "; ".join(out) + ";"

    def collect_import_maps(self, html, base):
        for m in re.finditer(r"<script\b[^>]*type\s*=\s*[\"']?importmap[\"']?[^>]*>(.*?)</script\s*>", html, re.I | re.S):
            try:
                im = json.loads(m.group(1))
            except Exception as e:  # noqa
                self.report["warnings"].append(f"cannot parse importmap: {e}")
                continue
            for k, v in (im.get("imports") or {}).items():
                self.import_map[k] = self.abs_url(v, base)
            if im.get("scopes"):
                self.report["warnings"].append("importmap 'scopes' are not supported (ignored)")

    def process_subdoc(self, html):
        """process an <iframe srcdoc> document with its own importmap state; base URL is inherited"""
        saved = (self.base_url, self.module_data, self.import_map, self.module_final)
        self.module_data, self.import_map, self.module_final = {}, {}, {}
        self.depth += 1
        try:
            out = self.process_html(html, top=False)
        finally:
            self.depth -= 1
            self.base_url, self.module_data, self.import_map, self.module_final = saved
        self.subdocs.append(out)
        self.report["warnings"].append("iframe srcdoc document processed recursively")
        return out

    def process_html(self, html, top=True):
        base = self.base_url
        bm = re.search(r"<base\b[^>]*href\s*=\s*[\"']([^\"']+)", html, re.I)
        if bm:
            base = self.abs_url(bm.group(1), base)
            html = re.sub(r"<base\b[^>]*>", "", html, flags=re.I)
        self.base_url = base
        self.used_chars |= set(ord(c) for c in html if ord(c) > 32)
        self.collect_import_maps(html, base)

        # pass 1: collect module entry points
        module_entries = []
        for m in self.RE_SEG.finditer(html):
            if m.group(2):
                attrs = m.group(2)[7:-1]
                typ = (self.get_attr(attrs, "type") or "").lower()
                if typ == "module":
                    src = self.get_attr(attrs, "src")
                    if src:
                        module_entries.append(self.abs_url(self.unescape_attr(src), base))
                    else:
                        q = []
                        self.rewrite_module_source(m.group(3), base, q)
                        module_entries.extend(q)
        if module_entries:
            self.load_module_graph(module_entries)

        out = []
        pos = 0
        for m in self.RE_SEG.finditer(html):
            out.append(self.process_plain(html[pos:m.start()], base))
            pos = m.end()
            if m.group(1):  # comment
                out.append(m.group(1))
            elif m.group(2):
                out.append(self.process_script(m.group(2), m.group(3), m.group(4), base))
            else:
                css = self.process_css(m.group(6), base)
                out.append(m.group(5) + css + m.group(7))
        out.append(self.process_plain(html[pos:], base))
        html = "".join(out)

        # importmap with every module → data: URL
        if self.module_data:
            imports = dict(self.module_data)
            for k, v in self.import_map.items():
                if v in self.module_data:
                    imports[k] = self.module_data[v]
            tag = '<script type="importmap">' + json.dumps({"imports": imports}) + "</script>"
            hm = re.search(r"<head\b[^>]*>", html, re.I)
            html = html[:hm.end()] + "\n" + tag + html[hm.end():] if hm else tag + html

        html = self.sweep_literals(html)
        if top:
            scan = re.sub(r'\ssrcdoc="[^"]*"', ' srcdoc=""', html)
            self.scan_remaining("\n".join([scan] + self.subdocs))
        return html

    def process_plain(self, chunk, base):
        # <noscript> content never renders when JS is on (often only tracking pixels) → leave untouched
        parts = re.split(r"(<noscript\b.*?</noscript\s*>)", chunk, flags=re.I | re.S)
        return "".join(p if i % 2 else self.RE_TAG.sub(lambda m: self.process_tag(m.group(1), m.group(2), base), p)
                       for i, p in enumerate(parts))

    @staticmethod
    def js_safe(js):
        return re.sub(r"</(script)", r"<\\/\1", js, flags=re.I).replace("<!--", "<\\!--")

    def process_script(self, open_tag, body, close_tag, base):
        attrs = open_tag[7:-1]
        typ = (self.get_attr(attrs, "type") or "").lower()
        src = self.get_attr(attrs, "src")
        if typ == "importmap":
            return ""  # merged into our own importmap
        if typ == "module":
            if src:
                absu = self.abs_url(self.unescape_attr(src), base)
                a2 = self.del_attr(attrs, "src")
                return f"<script{a2}>import {json.dumps(absu)};</script>"
            q = []
            return open_tag + self.js_safe(self.rewrite_module_source(body, base, q)) + close_tag
        if typ and typ not in ("text/javascript", "application/javascript", "text/ecmascript", "javascript"):
            return open_tag + body + close_tag  # templates, JSON, text/babel etc.
        if not src:
            if self.is_file_redirect(body):
                self.report["removed"].append({"what": "file:// → online redirect script", "snippet": body.strip()[:160]})
                return "<script>/* make_offline: removed a script that redirected file:// pages to the online copy */</script>"
            return open_tag + body + close_tag
        if not self.keep_analytics and any(k in src for k in self.ANALYTICS):
            self.report["removed"].append({"what": "analytics script", "url": src[:200]})
            return f"<!-- make_offline: analytics script removed: {src[:120]} -->"
        if self.bad_ref(src):
            return open_tag + body + close_tag
        absu = self.abs_url(self.unescape_attr(src), base)
        r = self.fetch(absu)
        if not r:
            return open_tag + body + close_tag
        js = r[0].decode("utf-8", "replace")
        self.report["inlined"].append({"url": absu, "bytes": len(js), "kind": "script"})
        a2 = self.del_attr(self.del_attr(self.del_attr(attrs, "src"), "integrity"), "crossorigin")
        if self.get_attr(attrs, "defer") is not None or self.get_attr(attrs, "async") is not None:
            b64 = base64.b64encode(js.encode("utf-8")).decode("ascii")
            return f'<script{a2} src="data:text/javascript;charset=utf-8;base64,{b64}" data-offline-from="{absu[:200]}"></script>'
        return f'<script{a2} data-offline-from="{absu[:200]}">' + self.js_safe(js) + "</script>"

    @staticmethod
    def is_file_redirect(js):
        return bool(re.search(r"protocol\s*={2,3}\s*['\"]file:['\"]", js) and
                    re.search(r"location\.(replace|assign)\s*\(|location(\.href)?\s*=[^=]", js))

    def sweep_literals(self, html):
        """replace remaining absolute asset URLs that appear as literals (JS strings, JSON, templates)"""
        pat = re.compile(r"""(?<![\w$])((?:https?:)?//[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[^\s"'`()<>\\{}$]*?\.""" + ASSET_EXT +
                         r"""(?:\?[^\s"'`()<>\\{}$]*)?)(?=["'`)\s\\,;]|$)""", re.I)
        cache = {}
        self.prefetch([self.abs_url(m.group(1).replace("&amp;", "&"), self.base_url) for m in pat.finditer(html)])
        def rep(m):
            u = m.group(1)
            if u not in cache:
                cache[u] = self.data_uri(u.replace("&amp;", "&"), self.base_url, "literal-sweep")
            return cache[u] or u
        return pat.sub(rep, html)

    KNOWN_ONLINE = {
        "musk-collect": "飛象「數據回收」腳本（學生作答資料上傳到飛象看板）— 離線時不會回收資料",
        "dict.youdao.com": "有道詞典發音 API（執行時才組網址）— 離線無聲",
        "api.qrserver.com": "線上 QR code 產生服務 — 離線無法產生 QR code",
        "pollinations.ai": "線上 AI 生圖服務 — 離線無圖",
        "speechSynthesis": "瀏覽器語音合成 — 離線時只能用作業系統內建語音（Chrome 的 Google 線上語音不可用）",
        "SpeechRecognition": "瀏覽器語音辨識 — Chrome 需聯網",
        "WebSocket(": "WebSocket 即時連線 — 需聯網",
        "/musk-ai-studio/api": "飛象後端 API（教育應用的 AI/資料庫功能）— 需聯網",
        "frog.yuanfudao": "飛象使用統計（frog 埋點）— 離線時不會上報（不影響使用）",
    }

    def scan_remaining(self, html):
        seen = set()
        self.report["online_only_features"] = [f"{k}: {v}" for k, v in self.KNOWN_ONLINE.items() if k in html]
        for m in re.finditer(r"""(?:https?:)?//[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:/[^\s"'`()<>\\]*)?""", html):
            u = m.group(0)
            if u in seen or "w3.org/" in u:
                continue
            if re.search(r'data-offline-from="$', html[max(0, m.start() - 20):m.start()]):
                continue  # our own provenance marker
            seen.add(u)
            ctx = html[max(0, m.start() - 60):m.start()]
            entry = {"url": u[:200], "context": ctx[-60:].replace("\n", " ")}
            if re.search(r"(fetch|XMLHttpRequest|WebSocket|axios|\.open)\s*\(\s*[\"'`]?$", ctx) or "${" in html[m.end():m.end() + 3]:
                self.report["runtime_network_calls"].append(entry)
            elif re.search(r"""(src|href|url\(|import|from)\s*=?\s*["'`(]?\s*$""", ctx, re.I):
                self.report["remaining_external"].append(entry)


def main():
    ap = argparse.ArgumentParser(description="Make an HTML file self-contained for offline use")
    ap.add_argument("input", help="HTML file path or http(s) URL")
    ap.add_argument("-o", "--output", help="output path (default: <name>.offline.html)")
    ap.add_argument("--fonts", choices=["used", "all"], default="used",
                    help="used = only unicode-range subsets the page uses (default); all = keep every subset")
    ap.add_argument("--max-asset-mb", type=float, default=25)
    ap.add_argument("--image-max-px", type=int, default=1600,
                    help="downscale JPEG/PNG/WebP larger than 200 KB to this longest side (0 = keep originals)")
    ap.add_argument("--cache", default=os.path.expanduser("~/.cache/make_offline"))
    ap.add_argument("--keep-analytics", action="store_true", help="keep analytics/tracking scripts (removed by default)")
    ap.add_argument("-q", "--quiet", action="store_true")
    a = ap.parse_args()

    if a.input.startswith(("http://", "https://")):
        base = a.input
        req = urllib.request.Request(a.input, headers={"User-Agent": CHROME_UA})
        html = urllib.request.urlopen(req, timeout=40).read().decode("utf-8", "replace")
        name = os.path.basename(urllib.parse.urlparse(a.input).path) or "page.html"
        out = a.output or os.path.splitext(name)[0] + ".offline.html"
    else:
        path = os.path.abspath(a.input)
        base = "file://" + urllib.request.pathname2url(path)
        html = open(path, encoding="utf-8", errors="replace").read()
        out = a.output or os.path.splitext(path)[0] + ".offline.html"

    o = Offliner(base, fonts=a.fonts, max_asset_mb=a.max_asset_mb, cache_dir=a.cache, verbose=not a.quiet,
                  image_max_px=a.image_max_px, keep_analytics=a.keep_analytics)
    result = o.process_html(html)
    with open(out, "w", encoding="utf-8") as f:
        f.write(result)
    rep = o.report
    rep["output"] = out
    rep["output_bytes"] = os.path.getsize(out)
    rep["summary"] = {k: len(v) for k, v in rep.items() if isinstance(v, list)}
    rep["inlined"] = sorted(rep["inlined"], key=lambda e: -e["bytes"])
    json.dump(rep, open(out + ".report.json", "w"), ensure_ascii=False, indent=1)
    print(json.dumps({"output": out, "bytes": rep["output_bytes"], **rep["summary"]}, ensure_ascii=False))
    for e in rep.get("removed", []):
        print("  [removed]", e.get("what"), e.get("url", ""), file=sys.stderr)
    for k in ("failed", "skipped_too_large", "remaining_external", "runtime_network_calls"):
        for e in rep[k][:15]:
            print(f"  [{k}] {e.get('url')}", file=sys.stderr)
    for x in rep.get("online_only_features", []):
        print("  [online-only]", x, file=sys.stderr)
    for w in sorted(set(rep["warnings"]))[:20]:
        print("  [warning]", w, file=sys.stderr)


if __name__ == "__main__":
    main()
