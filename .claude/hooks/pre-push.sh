#!/usr/bin/env bash
# Cohort pre-push hook — enforce brand consistency + safety + lint before push
# Per cohort repo conventions (see CLAUDE.md, docs/handoff-20260611/)
#
# Install: ensure this file is chmod +x. To wire as actual git pre-push:
#   ln -sf ~/Development/cohort/.claude/hooks/pre-push.sh ~/Development/cohort/.git/hooks/pre-push
# Or use Husky / lefthook for declarative hook management.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "═══════════════════════════════════════════"
echo "  Cohort pre-push checks"
echo "═══════════════════════════════════════════"

# ─── Check 1: Brand mapping (no legacy Joon references in src/)
echo ""
echo "[1/5] Brand mapping scan (legacy 준/Joon/joon-mate references)..."

if [ -d "src" ]; then
  LEGACY_REFS=$(grep -rn -E "(^|[^가-힣])준\s|(Joon[^a-z]|joon-mate|joon_chat|JoonAvatar|JoonChatBubble|JoonNarration|joon-prompt)" src/ 2>/dev/null | grep -v "// HISTORICAL" | grep -v "// LEGACY" || true)
  if [ -n "$LEGACY_REFS" ]; then
    echo "  FAIL — Legacy brand references found in src/:"
    echo "$LEGACY_REFS" | head -10
    echo ""
    echo "  Per cohort brand rules (CLAUDE.md, vault 38-brief if available locally),"
    echo "  all 준/Joon references must be mapped to Cohort/Aurora/Vesper."
    echo "  If intentional HISTORICAL comment, add // HISTORICAL marker."
    exit 1
  fi
  echo "  PASS — No legacy brand references"
else
  echo "  SKIP — src/ not yet scaffolded"
fi

# ─── Check 2: Strategic Decision 0 Option B compliance
echo ""
echo "[2/5] Strategic Decision 0 Option B compliance scan..."

if [ -d "src" ]; then
  # Exclusions (Ray-approved 2026-06-11, mirrored in .github/workflows/ci.yml):
  # test files = adversarial safety-filter inputs; privacy/terms = legal disclaimer
  # quotes; enforcement-layer files (safety-filter regex + persona prompts) quote
  # them in NEVER-say instructions (behavior gated by safety-filter tests in 5/5);
  # OPTION-B-ALLOWED = vetted negation/educational copy.
  FORBIDDEN=$(grep -rn -E "(추천|권장|매수하세요|파세요|비중\s*[0-9]+%|지금\s*매수|timing입니다)" src/ \
    --exclude-dir=__tests__ --exclude='*.test.ts' --exclude='*.test.tsx' 2>/dev/null \
    | grep -v "src/app/privacy/" | grep -v "src/app/terms/" \
    | grep -v "src/lib/claude/safety-filter.ts" | grep -v "src/lib/claude/vesper-prompt.ts" \
    | grep -v "src/lib/aurora/aurora-prompt.ts" | grep -v "src/lib/aurora/chat-prompt.ts" \
    | grep -v "OPTION-B-ALLOWED" | grep -v "// EXAMPLE" | grep -v "// FORBIDDEN" || true)
  if [ -n "$FORBIDDEN" ]; then
    echo "  FAIL — Option B forbidden phrases found:"
    echo "$FORBIDDEN" | head -10
    echo ""
    echo "  Strategic Decision 0 LOCKED to Option B (Information + Tool + Decision Support)."
    echo "  See ~/Development/cohort/CLAUDE.md § Strategic constraints"
    exit 1
  fi
  echo "  PASS — No forbidden advisory phrases"
else
  echo "  SKIP — src/ not yet scaffolded"
fi

# ─── Check 3: TypeScript typecheck
echo ""
echo "[3/5] TypeScript typecheck..."

if [ -f "package.json" ] && grep -q "\"typecheck\"" package.json; then
  pnpm typecheck || { echo "  FAIL — TypeScript errors"; exit 1; }
  echo "  PASS — TypeScript clean"
else
  echo "  SKIP — typecheck script not configured yet"
fi

# ─── Check 4: ESLint
echo ""
echo "[4/5] ESLint..."

if [ -f "package.json" ] && grep -q "\"lint\"" package.json; then
  pnpm lint || { echo "  FAIL — ESLint errors"; exit 1; }
  echo "  PASS — ESLint clean"
else
  echo "  SKIP — lint script not configured yet"
fi

# ─── Check 5: Safety filter unit tests (W4+ when test suite exists)
echo ""
echo "[5/5] Safety filter unit tests..."

if [ -f "src/lib/claude/safety-filter.ts" ] && [ -f "src/lib/claude/__tests__/safety-filter.test.ts" ]; then
  pnpm vitest run src/lib/claude/__tests__/safety-filter.test.ts || { echo "  FAIL — Safety filter regression"; exit 1; }
  echo "  PASS — Safety filter tests pass"
else
  echo "  SKIP — safety-filter.ts or tests not yet implemented (W4+ phase)"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  All pre-push checks passed"
echo "═══════════════════════════════════════════"
