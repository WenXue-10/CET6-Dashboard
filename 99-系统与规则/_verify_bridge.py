# -*- coding: utf-8 -*-
import re, sys
sys.stdout.reconfigure(encoding="utf-8")
d = open(r'D:\Obsidian\CET-6 Learning\docs\index.html', encoding='utf-8').read()
i = d.find('var BRIDGE = { url:"https://1473705102')
print("bridge url injected:", i > 0)
# 找所有 var BRIDGE 实际声明
for m in re.finditer(r'var BRIDGE = \{', d):
    seg = d[m.start():m.start()+150]
    if '你的云函数' not in seg:
        print("REAL at", m.start(), ":", seg[:140])
