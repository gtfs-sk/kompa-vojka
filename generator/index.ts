import { SHA1 } from "bun";
import fs from "fs/promises";
import type { StationTimetable } from "./types/timetable";
import { getTimetableForStation } from "./library/APIClient";
import { makeCalendars, makeFeedInfo, makeStopTimes, makeTrip } from "./library/factories";
import Papa from 'papaparse';
import { isLastCommitTooOld } from "./library/isLastCommitTooOld";

const FERRY_TRAVEL_TIME_MINUTES = 10; // Time it takes for the ferry to travel from one station to another, in minutes

console.timeLog("CREATE `kompa-vojka` feed")

const KEPTHash = await fs.readFile("../keep/hash", "utf-8")
	.catch((reason: ErrnoException) => {
		// Catch case if given Hash file doesn't exist, means we haven't made a Feed before
		if (reason.code === 'ENOENT') return "" 
		else throw reason // throw for any other error
	})

const StationTimetable = {
	Vojka: await getTimetableForStation("1"),
	Kyselica: await getTimetableForStation("2"),
	hash: ""
}

StationTimetable.hash = calculateKeptHash(StationTimetable.Vojka, StationTimetable.Kyselica)
if (StationTimetable.hash === KEPTHash || isLastCommitTooOld()) { // Check if the hash of the fetched data is the same as the last kept hash, if so, skip feed generation
	console.log("No changes detected, skipping feed generation")
	process.exit(0)
}

// Make a diirectory where the resulting feed will reside in for publishing
await fs.mkdir("../fragment")

// Copy feed base files into resulting "feed fragment" folder
let feedBaseContents = await fs.readdir("./base")
for (const file of feedBaseContents) {
	await fs.copyFile(`./base/${file}`, `../fragment/${file}`)
}

// Generate trips and stop_times from the fetched timetable data
const tripCounter = { Vojka: -1, Kyselica: 0 }
const trips = []
const stopTimes = []
for (const departures of StationTimetable.Vojka.departures) {
	tripCounter.Vojka += 2;
	let trip = makeTrip("Kyselica", tripCounter.Vojka, departures)
	trips.push(trip)
	stopTimes.push(...makeStopTimes(trip, departures, FERRY_TRAVEL_TIME_MINUTES))
}
for (const departures of StationTimetable.Kyselica.departures) {
	tripCounter.Kyselica += 2;
	let trip = makeTrip("Vojka nad Dunajom", tripCounter.Kyselica, departures)
	trips.push(trip)
	stopTimes.push(...makeStopTimes(trip, departures, FERRY_TRAVEL_TIME_MINUTES))
}

await fs.writeFile("../fragment/trips.txt", Papa.unparse(trips, { header: true, delimiter: "," }))
await fs.writeFile("../fragment/stop_times.txt", Papa.unparse(stopTimes, { header: true, delimiter: "," }))
await fs.writeFile("../fragment/feed_info.txt", Papa.unparse(makeFeedInfo(StationTimetable.hash), { header: true, delimiter: "," }))

const calendar = makeCalendars()
await fs.writeFile("../fragment/calendar.txt", Papa.unparse(calendar.calendar, { header: true, delimiter: "," }))
await fs.writeFile("../fragment/calendar_dates.txt", Papa.unparse(calendar.calendar_dates, { header: true, delimiter: "," }))

await fs.writeFile("../keep/hash", StationTimetable.hash)

console.timeEnd("CREATE `kompa-vojka` feed")

// Create a Hash for this run from fetched data
function calculateKeptHash(station1: StationTimetable, station2: StationTimetable): string {
	const hash1 = SHA1.hash(JSON.stringify(station1), "hex")
	const hash2 = SHA1.hash(JSON.stringify(station2), "hex")
	return `S1:${hash1}/S2:${hash2}`
}
