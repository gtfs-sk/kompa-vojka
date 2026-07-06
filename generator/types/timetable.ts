interface StationInformation {
	id: number;
	name: string;
	description: string;
}

export interface StationDeparture {
	departureTime: `${number}:${number}:${number}`; // i.e. "06:00:00"
	workDays: boolean;
	restDays: boolean;
}

export interface StationTimetable {
	station: StationInformation;
	departures: StationDeparture[];
}
