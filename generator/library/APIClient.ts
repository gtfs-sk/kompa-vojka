import { type StationTimetable } from "../types/timetable";

const BASE_Headers = {
	'User-Agent': `at-gtfs-sk-generator-kompa-vojka/${1} (+https://github.com/gtfs-sk/kompa-vojka, this bot is checking for service availability)`,
}

function baseFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
	if (options.headers) {
		options.headers = {
			...options.headers,
			...BASE_Headers
		};
	} else {
		options.headers = BASE_Headers;
	}
	
	return fetch(url, options).then((response) => {
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return response.json() as Promise<T>;
	});
}

export function getTimetableForStation(stationId: "1" | "2"): Promise<StationTimetable> {
	return baseFetch<StationTimetable>(`https://kompa-vojka.sk/api/public/time-table/${stationId}`);
}
