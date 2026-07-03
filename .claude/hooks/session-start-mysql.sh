#!/bin/bash
# ============================================================
# SessionStart Hook: クラウド環境でネイティブ MySQL を自動セットアップ
# Docker 不要。apt + tarball で MySQL 8.0 を直接起動する。
#
# 設定ファイル駆動:
#   .claude/cloud-env.json にプロジェクト固有の設定を記載。
#   このスクリプト自体は変更不要で他プロジェクトにコピー可能。
# ============================================================
set -euo pipefail

# ── プロジェクトディレクトリ & 設定読み込み ──────────────────
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
CONFIG_FILE="${PROJECT_DIR}/.claude/cloud-env.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo '{"decision":"approve","reason":"cloud-env.json not found, skipping cloud setup"}'
  exit 0
fi

# JSON から設定値を読み取る（node を使用）
read_config() {
  node -e "
    const c = require('${CONFIG_FILE}');
    const val = '$1'.split('.').reduce((o, k) => o?.[k], c);
    console.log(val ?? '');
  " 2>/dev/null
}

# ── 設定値の取得 ──────────────────────────────────────────────
DB_TYPE=$(read_config "db")
DB_NAME=$(read_config "dbName")
MIGRATE_CMD=$(read_config "migrateCommand")

# MySQL 固有定数
MYSQL_VERSION="8.0.42"
MYSQL_TARBALL="mysql-${MYSQL_VERSION}-linux-glibc2.17-x86_64-minimal"
MYSQL_URL="https://dev.mysql.com/get/Downloads/MySQL-8.0/${MYSQL_TARBALL}.tar.xz"
MYSQL_BASE="/tmp/${MYSQL_TARBALL}"
MYSQL_DATA="/tmp/mysql-data"
MYSQL_SOCK="/tmp/mysql.sock"
MYSQL_PORT=3306
ENV_LOCAL="${PROJECT_DIR}/.env.local"
LOCK_FILE="/tmp/mysql-setup.lock"

# ── ログ関数 ──────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
DIM='\033[2m'
RESET='\033[0m'

step()  { printf "${CYAN}▸ %-50s${RESET}" "$1"; }
ok()    { printf "${GREEN}✓${RESET} ${DIM}%s${RESET}\n" "${1:-}"; }
skip()  { printf "${YELLOW}⊘ skip${RESET} ${DIM}%s${RESET}\n" "$1"; }
fail()  { printf "${RED}✗ FAIL${RESET} %s\n" "$1"; }
header(){ printf "\n${GREEN}━━━ %s ━━━${RESET}\n" "$1"; }

# ── .env.local 生成（cloud-env.json の envVars から動的生成）──
generate_env_local() {
  node -e "
    const c = require('${CONFIG_FILE}');
    const vars = c.envVars || {};
    const dbName = c.dbName || 'app';
    console.log('# Cloud CI environment - auto-generated from cloud-env.json');
    for (const [k, v] of Object.entries(vars)) {
      // \${dbName} プレースホルダーを展開
      const resolved = v.replace(/\\\$\{dbName\}/g, dbName);
      console.log(k + '=' + resolved);
    }
  " 2>/dev/null
}

# ── DB 種別チェック ──────────────────────────────────────────
if [ "$DB_TYPE" != "mysql" ]; then
  echo "Unsupported db type: ${DB_TYPE}. Currently only 'mysql' is supported."
  echo '{"decision":"approve","reason":"unsupported db type"}'
  exit 0
fi

# ── 多重実行防止 ───────────────────────────────────────────────
if [ -f "$LOCK_FILE" ]; then
  pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo '{"decision":"approve","suppress_output":true}'
    exit 0
  fi
  rm -f "$LOCK_FILE"
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

# ── 1) Docker 環境チェック（Docker が使えるなら何もしない）────
header "MySQL Cloud Setup"
step "Docker 利用可否チェック..."
if docker info >/dev/null 2>&1; then
  ok "Docker 利用可能 → このスクリプトは不要"
  echo '{"decision":"approve"}'
  exit 0
fi
skip "Docker 未起動 → ネイティブ MySQL で代替"

# ── 2) mysqld が既に起動しているかチェック ─────────────────────
step "mysqld 起動状態チェック..."
if [ -S "$MYSQL_SOCK" ] && "${MYSQL_BASE}/bin/mysqladmin" --socket="$MYSQL_SOCK" -u root ping >/dev/null 2>&1; then
  ok "既に起動中"
  # .env.local だけ確認して終了
  if [ -f "$ENV_LOCAL" ]; then
    echo '{"decision":"approve"}'
    exit 0
  fi
  # .env.local がなければ作成だけして終了
  step ".env.local 作成..."
  generate_env_local > "$ENV_LOCAL"
  ok
  echo '{"decision":"approve"}'
  exit 0
fi
skip "未起動 → セットアップ開始"

# ── 3) apt プロキシ設定 ────────────────────────────────────────
step "apt プロキシ設定..."
if [ -n "${http_proxy:-}" ]; then
  cat > /etc/apt/apt.conf.d/99proxy <<PROXYEOF
Acquire::http::Proxy "${http_proxy}";
Acquire::https::Proxy "${http_proxy}";
PROXYEOF
  ok "$(echo "$http_proxy" | cut -c1-40)..."
else
  skip "http_proxy 未設定"
fi

# ── 4) 依存ライブラリ ─────────────────────────────────────────
step "libaio / libnuma インストール..."
if ldconfig -p 2>/dev/null | grep -q libaio && ldconfig -p 2>/dev/null | grep -q libnuma; then
  skip "インストール済み"
else
  apt-get update -qq >/dev/null 2>&1
  apt-get install -y -qq libaio1t64 libnuma1 >/dev/null 2>&1
  ok
fi

# libaio.so.1 symlink（Ubuntu 24.04 は libaio.so.1t64）
step "libaio.so.1 symlink..."
if [ -e /usr/lib/x86_64-linux-gnu/libaio.so.1 ]; then
  skip "既に存在"
elif [ -e /usr/lib/x86_64-linux-gnu/libaio.so.1t64 ]; then
  ln -sf /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1
  ok
else
  fail "libaio が見つかりません"
fi

# libncurses.so.5 symlink（mysql client 用）
step "libncurses.so.5 symlink..."
if [ -e /usr/lib/x86_64-linux-gnu/libncurses.so.5 ]; then
  skip "既に存在"
elif [ -e /usr/lib/x86_64-linux-gnu/libncurses.so.6 ]; then
  ln -sf /usr/lib/x86_64-linux-gnu/libncurses.so.6 /usr/lib/x86_64-linux-gnu/libncurses.so.5
  ln -sf /usr/lib/x86_64-linux-gnu/libtinfo.so.6 /usr/lib/x86_64-linux-gnu/libtinfo.so.5 2>/dev/null || true
  ok
else
  skip "libncurses6 も無し（mysql client は使えない可能性あり）"
fi

# ── 5) MySQL tarball ダウンロード・展開 ────────────────────────
step "MySQL ${MYSQL_VERSION} バイナリ..."
if [ -x "${MYSQL_BASE}/bin/mysqld" ]; then
  skip "展開済み"
else
  printf "\n"
  step "  ダウンロード中..."
  if curl -L --retry 3 --retry-delay 2 -o "/tmp/${MYSQL_TARBALL}.tar.xz" "$MYSQL_URL" 2>/dev/null; then
    ok "$(du -h "/tmp/${MYSQL_TARBALL}.tar.xz" | cut -f1)"
  else
    fail "ダウンロード失敗"
    echo '{"decision":"approve","reason":"MySQL tarball download failed"}'
    exit 0
  fi
  step "  展開中..."
  tar xf "/tmp/${MYSQL_TARBALL}.tar.xz" -C /tmp
  rm -f "/tmp/${MYSQL_TARBALL}.tar.xz"
  ok
fi

# ── 6) MySQL 初期化 ───────────────────────────────────────────
step "MySQL データディレクトリ初期化..."
if [ -d "${MYSQL_DATA}/mysql" ]; then
  skip "初期化済み"
else
  mkdir -p "$MYSQL_DATA"
  "${MYSQL_BASE}/bin/mysqld" \
    --initialize-insecure \
    --user=root \
    --basedir="$MYSQL_BASE" \
    --datadir="$MYSQL_DATA" >/dev/null 2>&1
  ok
fi

# ── 7) mysqld 起動 ────────────────────────────────────────────
step "mysqld 起動..."
"${MYSQL_BASE}/bin/mysqld" \
  --user=root \
  --basedir="$MYSQL_BASE" \
  --datadir="$MYSQL_DATA" \
  --socket="$MYSQL_SOCK" \
  --port="$MYSQL_PORT" \
  --default-authentication-plugin=mysql_native_password \
  --skip-mysqlx \
  --bind-address=127.0.0.1 \
  --log-error=/tmp/mysqld.log \
  --daemonize >/dev/null 2>&1 || true

# 起動待ち（最大 15 秒）
waited=0
while [ $waited -lt 15 ]; do
  if "${MYSQL_BASE}/bin/mysqladmin" --socket="$MYSQL_SOCK" -u root ping >/dev/null 2>&1; then
    ok "${waited}s で起動完了"
    break
  fi
  sleep 1
  waited=$((waited + 1))
done

if [ $waited -ge 15 ]; then
  fail "タイムアウト（15s）。ログ: /tmp/mysqld.log"
  tail -5 /tmp/mysqld.log 2>/dev/null || true
  echo '{"decision":"approve","reason":"mysqld startup timeout"}'
  exit 0
fi

# ── 8) DB 作成 ────────────────────────────────────────────────
step "データベース '${DB_NAME}' 作成..."
if "${MYSQL_BASE}/bin/mysql" --socket="$MYSQL_SOCK" -u root -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};" 2>/dev/null; then
  ok
else
  # mysql client が動かない場合は mysqladmin で代替
  "${MYSQL_BASE}/bin/mysqladmin" --socket="$MYSQL_SOCK" -u root create "$DB_NAME" 2>/dev/null || skip "既に存在"
fi

# ── 9) .env.local 作成 ────────────────────────────────────────
step ".env.local 作成..."
if [ -f "$ENV_LOCAL" ]; then
  skip "既に存在"
else
  generate_env_local > "$ENV_LOCAL"
  ok
fi

# ── 10) マイグレーション ──────────────────────────────────────
if [ -n "$MIGRATE_CMD" ]; then
  step "マイグレーション (${MIGRATE_CMD})..."
  cd "$PROJECT_DIR"
  if DATABASE_URL="mysql://root:@127.0.0.1:${MYSQL_PORT}/${DB_NAME}" $MIGRATE_CMD >/dev/null 2>&1; then
    ok
  else
    fail "マイグレーション失敗（後で手動実行: DATABASE_URL=... ${MIGRATE_CMD}）"
  fi
fi

# ── 11) Playwright ブラウザ ───────────────────────────────────
step "Playwright ブラウザ確認..."
# 必要なリビジョンを取得（npm / pnpm / yarn 全対応）
REQUIRED_REV=$(node -e "
  const fs = require('fs');
  const path = require('path');
  const candidates = [
    path.join('${PROJECT_DIR}', 'node_modules/playwright-core/browsers.json'),
  ];
  // pnpm の .pnpm ディレクトリも探索
  try {
    const pnpmDir = path.join('${PROJECT_DIR}', 'node_modules/.pnpm');
    const dirs = fs.readdirSync(pnpmDir).filter(d => d.startsWith('playwright-core@'));
    dirs.forEach(d => candidates.push(path.join(pnpmDir, d, 'node_modules/playwright-core/browsers.json')));
  } catch {}
  for (const f of candidates) {
    try {
      const b = JSON.parse(fs.readFileSync(f, 'utf8'));
      const cr = b.browsers.find(x => x.name === 'chromium');
      if (cr) { console.log(cr.revision); process.exit(0); }
    } catch {}
  }
  console.log('');
" 2>/dev/null)

if [ -z "$REQUIRED_REV" ]; then
  skip "リビジョン不明（Playwright 未使用）"
else
  CACHE_DIR="${HOME}/.cache/ms-playwright"
  CHROMIUM_DIR="${CACHE_DIR}/chromium-${REQUIRED_REV}"
  if [ -d "$CHROMIUM_DIR" ]; then
    skip "chromium-${REQUIRED_REV} 配置済み"
  else
    # プリインストール版を探す
    EXISTING=$(ls -d "${CACHE_DIR}"/chromium-*/chrome-linux/chrome 2>/dev/null | head -1 || true)
    if [ -n "$EXISTING" ]; then
      SRC_DIR=$(dirname "$EXISTING")
      mkdir -p "$CHROMIUM_DIR"
      cp -a "$SRC_DIR" "${CHROMIUM_DIR}/chrome-linux"
      touch "${CHROMIUM_DIR}/INSTALLATION_COMPLETE" "${CHROMIUM_DIR}/DEPENDENCIES_VALIDATED"
      ok "既存 chromium を ${REQUIRED_REV} にコピー"

      # headless shell も同様（新旧どちらのディレクトリ構造にも対応）
      HS_EXISTING=$(ls -d "${CACHE_DIR}"/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | head -1 || true)
      if [ -z "$HS_EXISTING" ]; then
        HS_EXISTING=$(ls -d "${CACHE_DIR}"/chromium_headless_shell-*/chrome-headless-shell-linux64/headless_shell 2>/dev/null | head -1 || true)
      fi
      if [ -z "$HS_EXISTING" ]; then
        HS_EXISTING=$(ls -d "${CACHE_DIR}"/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | head -1 || true)
      fi
      if [ -n "$HS_EXISTING" ]; then
        HS_DIR="${CACHE_DIR}/chromium_headless_shell-${REQUIRED_REV}/chrome-headless-shell-linux64"
        mkdir -p "$HS_DIR"
        cp -a "$(dirname "$HS_EXISTING")"/* "$HS_DIR/"
        # Playwright が期待するバイナリ名でシンボリックリンク作成
        if [ -f "${HS_DIR}/headless_shell" ] && [ ! -f "${HS_DIR}/chrome-headless-shell" ]; then
          ln -sf "${HS_DIR}/headless_shell" "${HS_DIR}/chrome-headless-shell"
        fi
        touch "${CACHE_DIR}/chromium_headless_shell-${REQUIRED_REV}/INSTALLATION_COMPLETE"
        touch "${CACHE_DIR}/chromium_headless_shell-${REQUIRED_REV}/DEPENDENCIES_VALIDATED"
      fi
    else
      skip "プリインストール版なし（npx playwright install chromium を手動実行）"
    fi
  fi
fi

# ── 完了 ──────────────────────────────────────────────────────
header "セットアップ完了"
printf "${DIM}  MySQL %s  →  127.0.0.1:%s/%s${RESET}\n" "$MYSQL_VERSION" "$MYSQL_PORT" "$DB_NAME"
printf "${DIM}  ログ        →  /tmp/mysqld.log${RESET}\n"
printf "${DIM}  停止        →  kill \$(cat /tmp/mysql-data/*.pid)${RESET}\n\n"

echo '{"decision":"approve"}'
exit 0
