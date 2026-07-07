# generator

TypeScript application (runs on [Bun](https://bun.sh)) that fetches the live timetable from the kompa-vojka.sk API and produces a GTFS feed in `../fragment/`.

## Usage

```bash
bun install
bun .
```

Output files are written to `../fragment/`. The generator exits silently with no writes if the timetable hasn't changed since the last run.

## Source layout

```
index.ts                   # Entry point
base/                      # Static GTFS files copied verbatim into fragment/
  agency.txt
  stops.txt
  routes.txt
  fare_attributes.txt
  fare_rules.txt
  attributions.txt
library/
  APIClient.ts             # Fetches timetable JSON from kompa-vojka.sk
  factories.ts             # Builds GTFS trips, stop_times, calendar rows
  restdays.ts              # Slovak public holiday definitions
  isLastCommitTooOld.ts    # Returns true if last commit is >365 days old
types/
  timetable.ts             # TypeScript interfaces for the API response
```

## Change detection

Each run computes `SHA1(station1_timetable) + SHA1(station2_timetable)` and compares it to `../keep/hash`. If the hash matches and the last commit is recent, the generator exits early without touching `fragment/`. The new hash is written to `keep/hash` after a successful feed generation.

## Service patterns

Three GTFS calendar services are generated:

| service_id | Days active |
|---|---|
| `service-WRKD-RSTD` | Every day |
| `service-WRKD` | Weekdays only (Mon–Fri) |
| `service-RSTD` | Weekends only (Sat–Sun) |

The API marks each departure as workday-only or rest-day-only. Slovak public holidays are applied as `calendar_dates.txt` exceptions, removing workday service and adding rest-day service on those dates.

## Trip IDs

Trip IDs are sequential odd integers (`1, 3, 5, …`). Each departure from either terminal becomes one trip with two stop_time rows (departure terminal → arrival terminal, 10 min crossing time).
