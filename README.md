# kompa-vojka

GTFS feed generator for the Vojka nad Dunajom–Kyselica ferry service operated by Vodohospodárska výstavba, š. p.

The feed is rebuilt automatically every day and published to a static URL so transit apps (Google Maps, etc.) can consume it.

**Static feed URL:** [`https://github.gtfs.sk/kompa-vojka/gtfs.zip`](https://github.gtfs.sk/kompa-vojka/gtfs.zip)

---

## How it works

1. The GitHub Actions workflow runs daily at 01:00 UTC.
2. `generator/` fetches the live timetable from the [kompa-vojka.sk](https://kompa-vojka.sk) API.
3. If the timetable data changed (detected via SHA1 hash stored in `keep/hash`), a new GTFS feed is written into `fragment/`.
4. The updated `fragment/` files are committed back to the repo, zipped, and deployed to GitHub Pages.

```
kompa-vojka.sk API
       │
       ▼
  generator/          ← TypeScript + Bun
       │  writes
       ▼
  fragment/           ← GTFS text files + gtfs.zip
       │  deployed via GitHub Pages
       ▼
https://gtfs-sk.github.io/kompa-vojka/gtfs.zip
```

## Repository layout

```
.github/workflows/
  build-feed.yml      # Daily CI: build → commit → release → deploy
generator/            # Feed generator source (TypeScript, runs on Bun)
  base/               # Static GTFS files (agency, stops, routes, fares)
  library/            # Business logic (API client, factories, holidays)
  index.ts            # Entry point
fragment/             # Generated GTFS feed (committed by CI, gitignored locally)
keep/
  hash                # SHA1 of last processed timetable — used to skip unchanged runs
```

## Generated GTFS files

| File | Description |
|---|---|
| `agency.txt` | Ferry operator info |
| `stops.txt` | Two terminals: Vojka nad Dunajom and Kyselica |
| `routes.txt` | Single ferry route |
| `trips.txt` | One trip per departure, in both directions |
| `stop_times.txt` | Departure + arrival times (10 min crossing) |
| `calendar.txt` | Weekday / weekend / all-day service patterns |
| `calendar_dates.txt` | Slovak public holiday exceptions |
| `fare_attributes.txt` / `fare_rules.txt` | Fare info |
| `feed_info.txt` | Feed version (SHA1-derived) and validity dates |

## Running locally

```bash
cd generator
bun install
bun .
```

The generated files will appear in `fragment/`. See [`generator/README.md`](generator/README.md) for more detail.

## CI workflow

The workflow in `.github/workflows/build-feed.yml` has two jobs:

- **build** — runs the generator, commits any changed `fragment/` files, packages `gtfs.zip`, and uploads it as a workflow artifact.
- **deploy** — downloads the artifact and publishes it to GitHub Pages.

Both jobs only do meaningful work when the feed actually changed (or when triggered manually via `workflow_dispatch`).
