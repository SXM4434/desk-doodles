#!/bin/zsh
# Sharded geomode sweep runner — works around the GL-context-exhaustion crash
# the single-browser run hits around ~37 shapes (370 renders). Each shard is a
# FRESH browser process over a small index window, well under the crash floor.
# READ-ONLY repo tool: drives tools/3d/catalog-visual-3d.mjs, never edits src.
#
#   ./run-geomode-sharded.sh    (uses VIS_URL on :4495, GROUP=geomode)
set -u
VIS_URL="${VIS_URL:-http://localhost:4495/tools/3d/catalog-visual-3d.html}"
SHARD_SIZE="${SHARD_SIZE:-25}"
TOTAL=197
i=0
while [ $i -lt $TOTAL ]; do
  hi=$(( i + SHARD_SIZE ))
  if [ $hi -gt $TOTAL ]; then hi=$TOTAL; fi
  out="/tmp/dd-geomode-s${i}"
  attempt=0
  ok=0
  while [ $attempt -lt 3 ]; do
    attempt=$(( attempt + 1 ))
    echo "=== SHARD [$i,$hi) attempt $attempt → $out ==="
    VIS_URL="$VIS_URL" OUT_DIR="$out" GROUP=geomode \
      MIN_INDEX=$i MAX_INDEX=$hi \
      node tools/3d/catalog-visual-3d.mjs > "${out}.log" 2>&1
    rc=$?
    if [ $rc -eq 0 ] && [ -f "${out}/summary.shard0.json" ]; then
      echo "    shard [$i,$hi) OK"
      ok=1
      break
    fi
    echo "    shard [$i,$hi) failed rc=$rc — retrying"
  done
  if [ $ok -eq 0 ]; then echo "!!! SHARD [$i,$hi) GAVE UP after 3 attempts"; fi
  i=$hi
done
echo "=== ALL SHARDS DONE ==="
