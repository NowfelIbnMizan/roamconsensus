#!/usr/bin/env bash
# Runs `prisma migrate deploy`, retrying while another build holds the migration lock.
# Preview and production builds both migrate the same database; if one is merged while the
# other is still building, Prisma gives up after 10s with P1002. Waiting it out beats a failed deploy.
set -uo pipefail

for attempt in 1 2 3 4 5 6; do
  output=$(npx prisma migrate deploy 2>&1)
  status=$?
  echo "$output"
  [ $status -eq 0 ] && exit 0
  if ! grep -q "P1002" <<<"$output" || [ $attempt -eq 6 ]; then exit $status; fi
  echo "Migration lock busy (another build is migrating). Retry $attempt of 5 in 30s..."
  sleep 30
done
