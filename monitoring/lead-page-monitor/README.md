# Lead Page & Split Test 24-hour monitor

A read-only, net-zero health check for the live site (`https://emaanpowerclasses.com`).
Use it to confirm lead pages and split tests are *consistently* working — it keeps
hitting them over 24 hours and logs every failure with a timestamp.

## What it verifies each cycle

- **Split tests** (`/t/{slug}`): returns a `307` redirect to a `/p/{slug}` whose
  `st` matches the test and whose `v` is one of the test's real configured variants.
- **Lead pages** (`/p/{slug}`): returns `200` and a real rendered page — not a
  404, 500, or Next.js error screen.

Targets are auto-discovered from the database at startup (active split tests +
all lead pages), so you never have to maintain a URL list.

## Net-zero (why your analytics stay clean)

Both public routes bump a `views` counter on every GET, and `/t` also writes a
`split_test_events` VIEW row. The monitor:

1. tags every request with a sentinel visitor id (`__monitor_bot__`),
2. records the exact number of views it caused in a crash-safe ledger, and
3. reverses them at the end of each cycle (decrement by the exact count + delete
   the tagged events).

Because it subtracts exactly what it added, concurrent real traffic is never
affected. After a clean run your view counts and conversion rates are unchanged.

## Run it

```bash
cd "monitoring/lead-page-monitor"

# one validation cycle (funnels + full sweep), then exit
node monitor.mjs --once

# the full 24h loop (foreground)
node monitor.mjs
```

Cadence: split tests + their lead pages every **15 min**, full sweep of all lead
pages every **3 h**, auto-stops after **24 h** and writes a final summary.

### Watch progress

```bash
tail -f logs/summary.md          # human-readable live summary (uptime, failures, variant split)
tail -f logs/events-*.jsonl      # raw per-check event stream
cat logs/summary.json            # machine-readable snapshot
```

### Stop early

`Ctrl-C` (or `kill <pid>`) — it flushes the writeback and writes a final summary
before exiting.

## Options

| Flag / env | Default | Meaning |
|---|---|---|
| `--once` | — | Run a single funnel + sweep cycle, then exit |
| `--no-writeback` | — | Probe but do NOT reverse view bumps (leaves a footprint) |
| `MONITOR_BASE_URL` | `https://emaanpowerclasses.com` | Site to monitor |
| `MONITOR_DURATION_H` | `24` | Total run length (hours) |
| `MONITOR_FUNNEL_MIN` | `15` | Split-test + funnel-page interval (min) |
| `MONITOR_SWEEP_MIN` | `180` | Full lead-page sweep interval (min) |

## If it crashed hard (kill -9 / machine slept)

Auto-cleanup may not have run. Settle the footprint manually:

```bash
node cleanup.mjs
```

This reverts any outstanding view writes from the ledger and deletes every
`split_test_events` row tagged `__monitor_bot__`.
