/* 喵咪备考 · 六级看板 写回中转站（腾讯云 SCF Web 函数）
 * ---------------------------------------------------------
 * 用法：在腾讯云「云函数 SCF」新建 Web 函数（Node.js 16+），
 *       把本文件内容粘到 index.js，配置两个环境变量后部署。
 *
 * 环境变量：
 *   GITHUB_TOKEN  = GitHub 令牌（需对 WenXue-10/CET6-Dashboard 有写权限）
 *   APP_KEY       = 站点钥匙（自定义一串随机字符串，网页端 BRIDGE.key 与之相同）
 *
 * 前端配置：site_assets/app.js 里 BRIDGE = { url:"<本函数访问地址>", key:"<APP_KEY>" }
 *
 * 支持的 action：
 *   add_word          { word, meaning, example }           追加到 01-词汇/生词表.md
 *   set_word_status   { word, status:已掌握|学习中 }        更新生词状态
 *   add_wrong         { subject, source, summary, analysis } 追加到 06-错题本/错题记录模板.md
 *   set_progress      { dim, done }                         更新 00-备考总览/备考进度目标.md 已完成数
 *   checkin           {}                                    在 00-备考总览/每日任务与打卡规则.md 标记今天 ☑
 */
'use strict';
const http = require("http");

const REPO = "WenXue-10/CET6-Dashboard";
const BRANCH = "main";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Content-Type": "application/json" };

const FILES = {
  add_word:        "01-词汇/生词表.md",
  set_word_status: "01-词汇/生词表.md",
  add_wrong:       "06-错题本/错题记录模板.md",
  set_progress:    "00-备考总览/备考进度目标.md",
  checkin:         "00-备考总览/每日任务与打卡规则.md",
};
const SUBJECTS = ["听力", "阅读", "词汇", "写作", "翻译"];
const CHECKS = ["☐", "☑", "✅", "🐾", "✔", "v", "V"];

function decodeB64(s) { return Buffer.from(s, "base64").toString("utf8"); }
function encodeB64(s) { return Buffer.from(s, "utf8").toString("base64"); }
function escCell(v) { return String(v == null ? "" : v).replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim(); }
function send(res, code, obj) { res.writeHead(code, CORS); res.end(JSON.stringify(obj)); }

/* 在第一个表格分隔行（|----|）之后插入一行 */
function insertRowAfterSep(content, rowLine) {
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith("|") && /^\|[\s:|-]+\|$/.test(t) && t.includes("---")) {
      lines.splice(i + 1, 0, rowLine);
      return lines.join("\n");
    }
  }
  return "NOTFOUND";
}

/* 今天星期几（中文：日/一/二/.../六），0=周日；用北京时间 UTC+8（云函数默认 UTC 会偏一天） */
function todayWeekdayCN() {
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  return ["日", "一", "二", "三", "四", "五", "六"][now.getUTCDay()];
}

function applyAction(content, action, b) {
  if (action === "add_word") {
    const row = "| " + escCell(b.word) + " | " + escCell(b.meaning) + " | " + escCell(b.example) + " | 学习中 | 0 | — |";
    return insertRowAfterSep(content, row);
  }
  if (action === "set_word_status") {
    const word = String(b.word || "").trim();
    const status = b.status === "已掌握" ? "已掌握" : "学习中";
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const cells = lines[i].split("|").map(c => c.trim());
      if (cells.length >= 5 && cells[1] === word && cells[4] !== status) {
        cells[4] = status;
        lines[i] = "| " + cells.slice(1, -1).join(" | ") + " |";
        return lines.join("\n");
      }
    }
    return "NOCHANGE";
  }
  if (action === "add_wrong") {
    const subj = SUBJECTS.includes(b.subject) ? b.subject : "其他";
    const row = "| " + subj + " | " + escCell(b.source) + " | " + escCell(b.summary) + " | " + escCell(b.analysis) + " | 待复习 |";
    return insertRowAfterSep(content, row);
  }
  if (action === "set_progress") {
    const dim = String(b.dim || "").trim();
    let done = parseInt(b.done, 10); if (isNaN(done) || done < 0) done = 0;
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\|\s*([^|]+?)\s*\|/);
      if (m && m[1].trim() === dim) {
        const cells = lines[i].split("|");
        if (cells.length >= 5) {
          const target = parseInt((cells[2] || "").replace(/[^0-9]/g, ""), 10) || 0;
          const pct = target ? Math.round(done / target * 100) : 0;
          cells[3] = " " + done + " ";
          cells[4] = " " + pct + "% ";
          lines[i] = cells.join("|");
          return lines.join("\n");
        }
      }
    }
    return "NOCHANGE";
  }
  if (action === "checkin") {
    const day = todayWeekdayCN();
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|$/);
      if (m) {
        const cols = m.slice(1).map(s => s.trim());
        if (cols.every(c => CHECKS.includes(c))) {   // 只改打卡数据行，不动表头
          const idx = ["一", "二", "三", "四", "五", "六", "日"].indexOf(day);
          if (idx >= 0 && cols[idx] !== "☑") {
            cols[idx] = "☑";
            lines[i] = "| " + cols.join(" | ") + " |";
            return lines.join("\n");
          }
          break;
        }
      }
    }
    return "NOCHANGE";
  }
  return "BAD_ACTION";
}

async function handle(req, res) {
  if (req.method === "OPTIONS") { send(res, 200, { ok: true }); return; }
  if (req.method !== "POST") { send(res, 405, { ok: false, error: "method" }); return; }
  let raw = ""; for await (const chunk of req) raw += chunk;
  let b; try { b = JSON.parse(raw || "{}"); } catch (e) { send(res, 400, { ok: false, error: "bad json" }); return; }
  const APP_KEY = process.env.APP_KEY, GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!APP_KEY || b.key !== APP_KEY) { send(res, 403, { ok: false, error: "forbidden" }); return; }
  const action = String(b.action || "");
  const file = FILES[action];
  if (!file) { send(res, 400, { ok: false, error: "bad action" }); return; }
  const H = { Authorization: "token " + GITHUB_TOKEN, "User-Agent": "cet6-site", Accept: "application/vnd.github+json" };
  const enc = encodeURIComponent(file);
  try {
    const getRes = await fetch("https://api.github.com/repos/" + REPO + "/contents/" + enc + "?ref=" + BRANCH, { headers: H });
    if (!getRes.ok) { send(res, 502, { ok: false, error: "read fail " + getRes.status }); return; }
    const meta = await getRes.json();
    const content = decodeB64(meta.content);
    const updated = applyAction(content, action, b);
    if (updated === "NOTFOUND") { send(res, 422, { ok: false, error: "format not found" }); return; }
    if (updated === "BAD_ACTION") { send(res, 400, { ok: false, error: "bad action data" }); return; }
    if (updated === "NOCHANGE") { send(res, 200, { ok: true, noChange: true }); return; }
    const putRes = await fetch("https://api.github.com/repos/" + REPO + "/contents/" + enc, {
      method: "PUT",
      headers: Object.assign({}, H, { "Content-Type": "application/json" }),
      body: JSON.stringify({ message: "喵咪备考·写回：" + action, content: encodeB64(updated), sha: meta.sha, branch: BRANCH })
    });
    if (!putRes.ok) { send(res, 502, { ok: false, error: "write fail " + putRes.status }); return; }
    send(res, 200, { ok: true, action: action });
  } catch (e) { send(res, 500, { ok: false, error: "server error" }); }
}

http.createServer(handle).listen(9000);
console.log("cet6-bridge listening on 9000");
