#!/bin/bash
DB="postgresql://postgres:PGROlPewsCXdLjtvRxwAestaVJGldXmb@gondola.proxy.rlwy.net:24954/railway"
CRON_URL="https://webinar-platform-production.up.railway.app/api/cron/process-attendance-tags"
TOKEN="F1viPR8MgoVQzDVnK/vy1bqeH35qQB/xFa0azaiiHEI="

for i in $(seq 1 30); do
  curl -s --max-time 55 -X POST "$CRON_URL" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" > /dev/null

  TAGGED=$(PGPASSWORD=PGROlPewsCXdLjtvRxwAestaVJGldXmb psql -h gondola.proxy.rlwy.net -p 24954 -U postgres -d railway -t -A -c "SELECT COUNT(*) FROM registrations WHERE \"attendanceTagsApplied\" = true;" 2>/dev/null)
  PENDING=$(PGPASSWORD=PGROlPewsCXdLjtvRxwAestaVJGldXmb psql -h gondola.proxy.rlwy.net -p 24954 -U postgres -d railway -t -A -c "SELECT COUNT(*) FROM registrations WHERE \"attendanceTagsApplied\" = false AND \"scheduledStartTime\" IS NOT NULL;" 2>/dev/null)
  
  echo "Run $i: Tagged=$TAGGED | Pending=$PENDING"
  
  if [ "$PENDING" -le 10 ]; then
    echo "All done!"
    break
  fi
done
