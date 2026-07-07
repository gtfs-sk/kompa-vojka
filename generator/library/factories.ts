import { SHA1 } from "bun";
import type { StationDeparture } from "../types/timetable";
import { restDays } from "./restdays";

const TODAY = new Date();

export function makeTrip(headsign: "Vojka nad Dunajom" | "Kyselica", tripId: number, stationDeparture: StationDeparture) {
	return {
		route_id: "kompa",
		service_id: [
			"service",
			stationDeparture.workDays ? "WRKD" : undefined,
			stationDeparture.restDays ? "RSTD" : undefined,
		].filter(Boolean).join("-"),
		trip_id: `trip-${tripId}`,
		trip_headsign: headsign,
		direction_id: headsign === "Vojka nad Dunajom" ? 1 : 0,
		shape_id: `shape_${headsign === "Vojka nad Dunajom" ? "kys_voj" : "voj_kys"}`,
		block_id: "kompa",
		wheelchair_accessible: 1,
		bikes_allowed: 1,
		cars_allowed: 1
	}
}

export function makeStopTimes(trip: ReturnType<typeof makeTrip>, stationDeparture: StationDeparture, travelTimeMinutes: number) {
	return [
		{
			trip_id: trip.trip_id,
			arrival_time: stationDeparture.departureTime,
			departure_time: stationDeparture.departureTime,
			stop_id: trip.direction_id === 0 ? "1" : "2",
			stop_sequence: 1,
			pickup_type: 0,
			drop_off_type: 0,
			timepoint: 1,
			shape_dist_traveled: "0"
		},
		{
			trip_id: trip.trip_id,
			arrival_time: addMinutesToTime(stationDeparture.departureTime, travelTimeMinutes),
			departure_time: addMinutesToTime(stationDeparture.departureTime, travelTimeMinutes),
			stop_id: trip.direction_id === 0 ? "2" : "1",
			stop_sequence: 2,
			pickup_type: 0,
			drop_off_type: 0,
			timepoint: 1,
			shape_dist_traveled: "0.559"
		}
	]
}

export function makeFeedInfo(feedHash: string) {
	return [
		{
			feed_publisher_name: "gtfs.sk",
			feed_publisher_url: "https://gtfs.sk",
			feed_lang: "sk",
			feed_start_date: `${TODAY.getFullYear()}${String(TODAY.getMonth() + 1).padStart(2, '0')}${String(TODAY.getDate()).padStart(2, '0')}`,
			feed_end_date: "",
			feed_version: `${process.env.GITHUB_RUN_ID ?? 0}-${SHA1.hash(feedHash, "hex").slice(0, 8)}`,
		}
	]
}

export function makeCalendars() {
	const aDistantDate = new Date(TODAY);
	aDistantDate.setFullYear(aDistantDate.getFullYear() + 1);
	let aDistantDateString = `${aDistantDate.getFullYear()}${String(aDistantDate.getMonth() + 1).padStart(2, '0')}${String(aDistantDate.getDate()).padStart(2, '0')}`;
	let todayString = `${TODAY.getFullYear()}${String(TODAY.getMonth() + 1).padStart(2, '0')}${String(TODAY.getDate()).padStart(2, '0')}`;
	return {
		calendar: [
			{ service_id: "service-WRKD-RSTD", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1, start_date: todayString, end_date: aDistantDateString },
			{ service_id: "service-RSTD", monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 1, sunday: 1, start_date: todayString, end_date: aDistantDateString },
			{ service_id: "service-WRKD", monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 0, sunday: 0, start_date: todayString, end_date: aDistantDateString }
		],
		calendar_dates: [
			restDays.map(([day, month]) => {
				const holidayDate = new Date(TODAY.getFullYear(), month - 1, day);
				const holidayDateString = `${holidayDate.getFullYear()}${String(holidayDate.getMonth() + 1).padStart(2, '0')}${String(holidayDate.getDate()).padStart(2, '0')}`;
				return [
					{ service_id: "service-WRKD", date: holidayDateString, exception_type: 2 },
					{ service_id: "service-RSTD", date: holidayDateString, exception_type: 1 },
				]
			}),
			restDays.map(([day, month]) => {
				const holidayDate = new Date(aDistantDate.getFullYear(), month - 1, day);
				const holidayDateString = `${holidayDate.getFullYear()}${String(holidayDate.getMonth() + 1).padStart(2, '0')}${String(holidayDate.getDate()).padStart(2, '0')}`;
				return [
					{ service_id: "service-WRKD", date: holidayDateString, exception_type: 2 },
					{ service_id: "service-RSTD", date: holidayDateString, exception_type: 1 },
				]
			})
			].flat(3)
	}
}

function addMinutesToTime(time: string, minutesToAdd: number): string {
	const [hours, minutes, seconds] = time.split(':').map(Number);
	const date = new Date(TODAY);
	date.setHours(hours ?? 0);
	date.setMinutes((minutes ?? 0) + minutesToAdd);
	return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
