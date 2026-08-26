# -*- coding: utf-8 -*-
"""喵咪备考 · 六级学习看板 · 站点生成器
从 Obsidian 六级知识库自动生成静态网站到 docs/（GitHub Pages 发布目录）。
运行：python build_site.py
"""
import os, re, json, shutil, datetime, sys
import html as htmlmod
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass
import markdown

BASE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(BASE, "site_assets")
OUT = os.path.join(BASE, "docs")

_md = markdown.Markdown(extensions=["tables", "fenced_code", "sane_lists"])

def md_to_html(text):
    _md.reset()
    html = _md.convert(text)
    html = re.sub(r"\[\[([^\]|]+)(\|[^\]]+)?\]\]", r"\1", html)
    return html

def strip_fm(text):
    m = re.match(r"^---\s*\n.*?\n---\s*\n?", text, re.DOTALL)
    return text[m.end():] if m else text

def parse_fm(text):
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    fm = {}
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                fm[k.strip()] = v.strip().strip('"').strip("'")
    return fm

def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()

def md_note(path):
    fn = os.path.basename(path)
    return {"title": os.path.splitext(fn)[0], "icon": "📄", "html": md_to_html(strip_fm(read(path)))}

def parse_table(text, header_keys=None, min_cells=2):
    """解析 markdown 表格，返回数据行（每行 list），自动跳过表头与分隔行"""
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [re.sub(r"\*\*|`", "", c.strip()) for c in line.strip("|").split("|")]
        if len(cells) < min_cells:
            continue
        if all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
            continue
        if header_keys and any(h in cells[0] for h in header_keys):
            continue
        rows.append(cells)
    return rows

def find_note(folder, filename):
    p = os.path.join(BASE, folder, filename)
    return p if os.path.exists(p) else None

# ---------- 配置 / 倒计时 ----------
def load_config():
    cfg = {"exam_date": "2026-12-12"}
    p = find_note("00-备考总览", "看板配置.md")
    if p:
        fm = parse_fm(read(p))
        if fm.get("exam_date"):
            cfg["exam_date"] = fm["exam_date"]
    return cfg

def countdown_days(exam_date):
    try:
        d = datetime.date.fromisoformat(str(exam_date).strip())
        return (d - datetime.date.today()).days
    except Exception:
        return 0

# ---------- 备考进度 ----------
_PROGRESS_DIMS = {"单词", "听力", "阅读", "写作", "翻译"}
def scan_progress():
    p = find_note("00-备考总览", "备考进度目标.md")
    if not p:
        return []
    rows = parse_table(read(p), header_keys=["维度"])
    out = []
    for r in rows:
        if len(r) < 3 or r[0] not in _PROGRESS_DIMS:
            continue
        dim = r[0]
        target = _to_int(r[1])
        done = _to_int(r[2]) if len(r) > 2 else 0
        pct = round(done / target * 100) if target else 0
        out.append({"dim": dim, "target": target, "done": done, "pct": min(100, max(0, pct))})
    return out

def _to_int(s):
    m = re.match(r"\s*(\d+(?:\.\d+)?)", str(s).replace(",", ""))
    try:
        return int(float(m.group(1)))
    except Exception:
        return 0

# ---------- 每日任务 / 本周打卡 ----------
_TASK_KEYS = {"words", "listening", "reading", "writing", "review"}
def scan_tasks_week():
    p = find_note("00-备考总览", "每日任务与打卡规则.md")
    tasks, week = [], []
    if not p:
        return tasks, week
    text = read(p)
    # 今日任务表
    for r in parse_table(text, header_keys=["任务"]):
        if r[0] in _TASK_KEYS:
            tasks.append({"key": r[0], "name": r[1] if len(r) > 1 else r[0],
                          "advice": r[2] if len(r) > 2 else ""})
    # 本周打卡记录表（一 ~ 日）
    for r in parse_table(text, header_keys=["一"]):
        if all(c in {"一", "二", "三", "四", "五", "六", "日"} for c in r):
            continue  # 表头
        if len(r) >= 7:
            week = [{"day": d, "done": (r[i] in ("☑", "✅", "🐾", "✔", "v"))} for i, d in enumerate(["一", "二", "三", "四", "五", "六", "日"])]
            break
    return tasks, week

# ---------- 词汇 ----------
def scan_words():
    p = find_note("01-词汇", "生词表.md")
    if not p:
        return []
    out = []
    for r in parse_table(read(p), header_keys=["单词"]):
        if len(r) < 2 or not r[0]:
            continue
        out.append({
            "word": r[0],
            "meaning": r[1] if len(r) > 1 else "",
            "example": r[2] if len(r) > 2 else "",
            "status": r[3] if len(r) > 3 and r[3] else "学习中",
            "review": _to_int(r[4]) if len(r) > 4 else 0,
            "last": r[5] if len(r) > 5 else "—",
        })
    return out

# ---------- 错题 ----------
_SUBJECTS = ["听力", "阅读", "词汇", "写作", "翻译"]
def scan_wrong():
    p = find_note("06-错题本", "错题记录模板.md")
    if not p:
        return []
    out = []
    for r in parse_table(read(p), header_keys=["科目"]):
        if len(r) < 2 or not r[0]:
            continue
        subj = r[0]
        out.append({
            "subject": subj if subj in _SUBJECTS else "其他",
            "source": r[1] if len(r) > 1 else "",
            "summary": r[2] if len(r) > 2 else "",
            "analysis": r[3] if len(r) > 3 else "",
            "status": r[4] if len(r) > 4 and r[4] else "待复习",
        })
    return out

# ---------- 分项训练 ----------
_SKILL_META = [
    ("02-听力", "听力学习指南.md", "🎧", "听力精听 · 四步法", "目标 40 套", "c1"),
    ("03-阅读", "阅读学习指南.md", "📖", "仔细阅读 · 先题后文", "目标 80 篇", "c3"),
    ("04-写作", "写作学习指南.md", "✍️", "三段式写作 · 主题词", "目标 30 篇", "c4"),
    ("05-翻译", "翻译学习指南.md", "🀄", "翻译四步法 · 高频考点", "目标 60 篇", "c2"),
]
def scan_skills():
    out = []
    for folder, fn, icon, desc, goal, cls in _SKILL_META:
        p = find_note(folder, fn)
        if not p:
            continue
        out.append({
            "key": folder[3:],
            "icon": icon,
            "title": os.path.splitext(fn)[0],
            "desc": desc,
            "goal": goal,
            "cls": cls,
            "html": md_to_html(strip_fm(read(p))),
        })
    return out

# ---------- 学习资料 ----------
def scan_materials():
    p = find_note("07-学习资料", "精选备考资料汇总.md")
    if not p:
        return []
    groups, cur = [], None
    for line in read(p).splitlines():
        if line.startswith("## "):
            cur = {"cat": line[3:].strip(), "items": []}
            groups.append(cur)
        elif line.startswith("- ") and cur:
            m = re.match(r"-\s*\*{0,2}(.+?)\*{0,2}\s*[：:]\s*\[([^\]]+)\]\(([^)]+)\)(?:\s*[（(]([^）)]*)[）)])?", line)
            if m:
                cur["items"].append({
                    "title": m.group(1).strip(),
                    "url": m.group(3).strip(),
                    "desc": re.sub(r"[`*]", "", (m.group(4) or "").strip()),
                })
    return [g for g in groups if g["items"]]

# ---------- AI 助手 ----------
def scan_ai():
    p = find_note("00-备考总览", "AI备考助手.md")
    if not p:
        return "<p>暂无 AI 建议，在豆包中告诉我你的进度即可生成。</p>"
    return md_to_html(strip_fm(read(p)))

# ---------- 知识库 ----------
_KB_META = [
    ("00-备考总览", "🎯", "目标、计划、打卡、AI 助手与工作台说明", "c1"),
    ("01-词汇", "📖", "生词本规则与生词表", "c2"),
    ("02-听力", "🎧", "听力精听方法", "c3"),
    ("03-阅读", "📚", "阅读做题方法", "c4"),
    ("04-写作", "✍️", "写作结构与主题词", "c5"),
    ("05-翻译", "🀄", "翻译步骤与考点", "c1"),
    ("06-错题本", "❌", "错题管理与复盘", "c2"),
    ("07-学习资料", "📎", "精选备考资料汇总", "c3"),
]
_SKIP_KB_FILES = {"看板配置.md"}

def _walk_notes(root):
    notes = []
    if not os.path.isdir(root):
        return notes
    for fn in sorted(os.listdir(root)):
        p = os.path.join(root, fn)
        if os.path.isfile(p) and fn.endswith(".md"):
            if fn in _SKIP_KB_FILES:
                continue
            notes.append(md_note(p))
    return notes

def scan_kb():
    kb = []
    for folder, icon, desc, cls in _KB_META:
        notes = _walk_notes(os.path.join(BASE, folder))
        groups = [{"title": "", "notes": notes}]
        kb.append({"icon": icon, "name": folder, "desc": desc, "cls": cls, "groups": groups})
    return kb

# ---------- 最近改动时间 ----------
_SKIP_DIRS = {".git", ".obsidian", ".trash", "docs", "site_assets", "__pycache__", ".workbuddy"}
def latest_mtime():
    latest = 0.0
    for root, dirs, files in os.walk(BASE):
        rel = os.path.relpath(root, BASE)
        if rel == "." or any(part in _SKIP_DIRS for part in rel.split(os.sep)):
            dirs[:] = [d for d in dirs if d not in _SKIP_DIRS]
            continue
        for fn in files:
            try:
                latest = max(latest, os.path.getmtime(os.path.join(root, fn)))
            except Exception:
                pass
    return datetime.datetime.fromtimestamp(latest) if latest else datetime.datetime.now()

# ---------- 组装 ----------
def build():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT, exist_ok=True)
    # 图片 / 图标 / PWA
    img_out = os.path.join(OUT, "assets")
    os.makedirs(img_out, exist_ok=True)
    img_src = os.path.join(ASSETS, "img")
    bg, av = {}, {}
    if os.path.isdir(img_src):
        for fn in sorted(os.listdir(img_src)):
            shutil.copy2(os.path.join(img_src, fn), os.path.join(img_out, fn))
            key = os.path.splitext(fn)[0]
            url = "assets/" + fn
            if fn.endswith("_bg.jpg"):
                bg[key.replace("_bg", "")] = url
            elif fn.endswith("_avatar.jpg"):
                av[key.replace("_avatar", "")] = url
    icon_src = os.path.join(ASSETS, "icons")
    if os.path.isdir(icon_src):
        for fn in os.listdir(icon_src):
            shutil.copy2(os.path.join(icon_src, fn), os.path.join(img_out, fn))
    for fname in ("manifest.json", "sw.js"):
        sp = os.path.join(ASSETS, fname)
        if os.path.exists(sp):
            shutil.copy2(sp, os.path.join(OUT, fname))

    cfg = load_config()
    progress = scan_progress()
    tasks, week = scan_tasks_week()
    words = scan_words()
    wrong = scan_wrong()
    skills = scan_skills()
    materials = scan_materials()
    ai = scan_ai()
    kb = scan_kb()

    days = countdown_days(cfg["exam_date"])
    mastered = sum(1 for w in words if w["status"] == "已掌握")
    checkin = sum(1 for w in week if w["done"])
    avg = round(sum(p["pct"] for p in progress) / len(progress)) if progress else 0

    stats = {"days": days, "checkin": checkin, "words": len(words), "mastered": mastered,
             "wrong": len(wrong), "avg": avg}

    data = {
        "updated": latest_mtime().strftime("%Y-%m-%d %H:%M"),
        "exam": {"date": cfg["exam_date"], "days": days},
        "stats": stats,
        "tasks": tasks,
        "week": week,
        "progress": progress,
        "words": words,
        "wrong": wrong,
        "skills": skills,
        "materials": materials,
        "ai": ai,
        "kb": kb,
        "images": {"bg": bg, "av": av},
    }

    css = read(os.path.join(ASSETS, "style.css"))
    body = read(os.path.join(ASSETS, "body.html"))
    js = read(os.path.join(ASSETS, "app.js"))
    data_json = json.dumps(data, ensure_ascii=False, indent=1)

    html_out = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>喵咪备考 · 六级学习看板</title>
<meta name="theme-color" content="#ffd0e2">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="assets/icon-192.png">
<style>
""" + css + """
</style>
</head>
""" + body + """
<script>
window.SITE_DATA = """ + data_json + """;
</script>
<script>
""" + js + """
</script>
<script>
if('serviceWorker' in navigator){ window.addEventListener('load', function(){ navigator.serviceWorker.register('sw.js'); }); }
</script>
</body>
</html>"""

    idx = os.path.join(OUT, "index.html")
    with open(idx, "w", encoding="utf-8") as f:
        f.write(html_out)

    kb_count = 0
    for k in kb:
        for g in k.get("groups", []):
            for n in g.get("notes", []):
                kb_count += len(n.get("children", [])) if "children" in n else 1
    print("✅ 六级看板已生成：", idx)
    print("   距考试:", days, "天 | 本周打卡:", checkin, "| 生词:", len(words),
          "(已掌握", mastered, ") | 错题:", len(wrong), "| 分项:", len(skills),
          "| 资料分组:", len(materials), "| 知识库条目:", kb_count)

if __name__ == "__main__":
    build()
