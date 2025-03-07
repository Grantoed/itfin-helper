import { HttpFactoryService } from '../http-factory.service';
import { IHttpConfig } from '../types';
import type { HttpService } from '../http.service';
import { CalendarEvent, GetVacationsResponseQuery } from './types';

class VacationService {
	constructor(private readonly httpService: HttpService) {
		this.httpService = httpService;
	}

	public async getVacationsResponse(
		q: GetVacationsResponseQuery,
		config?: IHttpConfig
	): Promise<Array<CalendarEvent>> {
		const endpoint = 'calendar';

		const queryString = Object.entries(q)
			.map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
			.join('&');

		const url = `${endpoint}?${queryString}`;

		return this.httpService.get(url.toString(), config);
	}
}

export const vacationService = new VacationService(
	new HttpFactoryService().createHttpService()
);
