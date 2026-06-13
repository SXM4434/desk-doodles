#!/bin/zsh
# Sequential full-197 vis3d run in 4 index chunks (fresh browser per chunk to
# dodge the long-run browser-close crash that killed the prior single-pass run
# at shape 90). Each chunk → its own OUT_DIR (so report files don't clobber);
# cells share one dir for the merge. SHARDS=1 SHARD=0 always (the index filter
# is i%SHARDS===SHARD; only MIN/MAX_INDEX windows the chunk). READ-ONLY.
set -e
export VIS_URL="http://localhost:4493/tools/3d/catalog-visual-3d.html"
export SHARDS=1
export SHARD=0
CHUNKS=(0 50 100 150 197)
i=0
while [ $i -lt 4 ]; do
  lo=${CHUNKS[$((i+1))]}
  hi=${CHUNKS[$((i+2))]}
  echo "=== CHUNK $i : indices [$lo,$hi) ==="
  OUT_DIR=/tmp/dd-vis3d-full/c$i MIN_INDEX=$lo MAX_INDEX=$hi node tools/3d/catalog-visual-3d.mjs 2>&1
  echo "=== CHUNK $i DONE ==="
  i=$((i+1))
done
echo "=== ALL CHUNKS DONE ==="
