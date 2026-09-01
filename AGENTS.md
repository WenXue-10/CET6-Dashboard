---
title: Agent 路由
source: CET-6 Learning
date: 2026-09-01
tags: [路由, Agent, 系统]
---

# AGENTS.md · CET-6 Learning

> 本文档定义 Codex 在六级备考项目中的触发规则、执行路径和约束。

**项目路径：D:\Obsidian\CET-6 Learning**

---

## 项目概述

六级备考知识库 + 网页看板数据源。
- 在线看板：https://wenxue-10.github.io/CET6-Dashboard/
- 每 10 分钟自动同步到看板（通过 cloud function）
- 本知识库修改后，网页自动更新

---

## 渐进式上下文加载

| 任务类型 | 加载上下文 | 说明 |
|---|---|---|
| **快速任务**（查规则/打卡） | AGENTS.md + 00-备考总览/每日任务与打卡规则.md | 打卡、查规则 |
| **常规任务**（记录学习） | 快速任务 + 对应分类笔记 | 生词记录、错题补录 |
| **深度任务**（看板维护） | 常规任务 + 99-系统与规则/*.py + build_site.py | 构建/部署相关 |

**禁止**：全量扫描所有笔记。

---

## 会话启动协议

1. 读 AGENTS.md
2. 读 00-备考总览/备考总览.md（了解考试日期、目标）
3. 判断任务类型，按需加载
4. 执行任务
5. 更新对应笔记
6. `git add -A && git commit -m "描述" && git push origin main`

---

## 触发词路由

| 用户说 | 执行动作 |
|---|---|
| "打卡" / "今日任务" | 读取 00-备考总览/每日任务与打卡规则.md，协助确认完成状态 |
| "记生词" / "add word" | 追加到 01-词汇/生词表.md |
| "补错题" | 追加到 06-错题本/错题记录模板.md |
| "构建/Build" | 运行 `python build_site.py` 更新网页数据 |
| "部署/Deploy" | 运行相关部署脚本，推送更新 |
| "检查看板" | 访问 https://wenxue-10.github.io/CET6-Dashboard/ 查看状态 |
| 其他 | 询问用户意图 |

---

## 构建与部署

```powershell
# 构建网页数据
python build_site.py

# 推送 git（已有 git 仓库）
git add -A
git commit -m "[CET-6] 描述"
git push origin main

# 部署脚本（按需）
powershell -File update_site.ps1
```

---

## 笔记规范

1. **追加不覆盖**：生词表、错题本只追加，不删改已有记录
2. **标注日期**：每条记录以日期为标题
3. **分类准确**：生词→01-词汇，错题→06-错题本，听力素材→02-听力
4. **禁用 git commit 外的写回**：不要修改 99-系统与规则/ 下的部署脚本，除非用户明确要求

---

## 约束

1. 禁止编造无法确认的备考资料
2. 考试日期：2026-12-12（周六），以此计算倒计时
3. 遵守全局 C:\Users\22814\.codex\AGENTS.md 执行准则
4. 每次修改后必须 git commit + push

---

> 最后更新：2026-09-01