#!/bin/bash
# 公司放假通知生成器 · 一键启动（macOS / Linux）

PORT=8899
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  公司放假通知生成器"
echo "============================================"
echo

PY=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done

if [ -z "$PY" ]; then
  echo "[!] 未找到 Python，直接打开页面（下载可能被浏览器拦截）"
  if command -v open >/dev/null 2>&1; then open "$DIR/index.html"; else xdg-open "$DIR/index.html"; fi
  exit 0
fi

echo "[1/2] 启动本地服务 端口 $PORT ..."
( cd "$DIR" && "$PY" -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 ) &
SRV=$!

echo "[2/2] 打开浏览器 ..."
sleep 2
URL="http://127.0.0.1:$PORT/index.html"
if command -v open >/dev/null 2>&1; then open "$URL"; else xdg-open "$URL"; fi

echo
echo "服务已启动：$URL"
echo "使用期间请保持本窗口开启，按 Ctrl+C 结束。"
echo
trap 'echo "正在停止服务..."; kill $SRV 2>/dev/null; exit 0' INT TERM
wait $SRV
