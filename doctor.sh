#!/bin/sh
# Toolchain check for any agent or human:  npm run doctor
ok() { printf '  ✓ %s\n' "$1"; }
bad() { printf '  ✗ %s\n' "$1"; FAIL=1; }
FAIL=0
command -v node >/dev/null && ok "node $(node -v)" || bad "node missing (install Node 22+)"
command -v ffmpeg >/dev/null && ok "ffmpeg" || bad "ffmpeg missing"
command -v python3 >/dev/null && ok "python3 $(python3 -c 'import sys;print(sys.version.split()[0])')" || bad "python3 missing"
python3 -c "import numpy, scipy, soundfile, librosa, PIL" 2>/dev/null && ok "python libs" || bad "python libs missing → pip install -r requirements.txt"
node -e "require.resolve('playwright')" 2>/dev/null && ok "playwright" || bad "playwright missing → npm install"
node -e "require('playwright').chromium.launch().then(b=>b.close())" 2>/dev/null && ok "chromium launches" || bad "chromium missing → npx playwright install chromium"
[ $FAIL = 0 ] && echo "ready. next: npm test (5 s smoke render)" || { echo "fix the ✗ lines above"; exit 1; }
