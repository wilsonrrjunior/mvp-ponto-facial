#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      MVP Ponto Facial — Startup      ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Backend ────────────────────────────────────────────────────────────────────
echo "▶ Verificando ambiente Python..."
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
  echo "  Criando virtualenv..."
  python3 -m venv .venv
fi

source .venv/bin/activate

echo "  Instalando dependências Python..."
pip install -q -r requirements.txt

echo "  Iniciando backend na porta 8001..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# ── Frontend ───────────────────────────────────────────────────────────────────
echo ""
echo "▶ Iniciando frontend (Vite)..."
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "  Instalando dependências Node..."
  npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Tudo no ar!"
echo "   Backend:  http://localhost:8001"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Pressione Ctrl+C para encerrar ambos os servidores."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Servidores encerrados.'" INT TERM
wait
