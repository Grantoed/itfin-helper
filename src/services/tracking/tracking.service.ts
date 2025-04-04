import { HttpFactoryService } from '../http-factory.service';
import { IHttpConfig } from '../types';
import type { HttpService } from '../http.service';
import {
	EmployeeRecord,
	EmploymentType,
	GetTrackingResponseQuery,
} from './types';

class TrackingService {
	constructor(private readonly httpService: HttpService) {
		this.httpService = httpService;
	}

	public async getTrackingResponse(
		teamId: string,
		q: GetTrackingResponseQuery,
		config?: IHttpConfig
	): Promise<Array<EmployeeRecord>> {
		const endpoint = `teams/${teamId}/tracking`;

		const queryString = Object.entries(q)
			.map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
			.join('&');

		const url = `${endpoint}?${queryString}`;

		return this.httpService.get(url.toString(), config);
	}

	public async getEmploymentType(
		teamId: string,
		q: GetTrackingResponseQuery,
		config?: IHttpConfig
	): Promise<EmploymentType> {
		const endpoint = `teams/${teamId}/agreements`;

		const queryString = Object.entries(q)
			.map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
			.join('&');

		const url = `${endpoint}?${queryString}`;

		return this.httpService.get(url.toString(), config);
	}
}

export const trackingService = new TrackingService(
	new HttpFactoryService().createHttpService()
);
