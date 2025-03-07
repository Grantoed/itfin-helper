import { HttpFactoryService } from '../http-factory.service';
import type { HttpService } from '../http.service';
import { IHttpConfig } from '../types';
import { MyTeamsResponse } from './types';

class TeamsService {
	constructor(private readonly httpService: HttpService) {
		this.httpService = httpService;
	}

	public async getMyTeamsResponse(
		config?: IHttpConfig
	): Promise<MyTeamsResponse> {
		const endpoint = 'teams/my';

		return this.httpService.get(endpoint.toString(), config);
	}
}

export const teamsService = new TeamsService(
	new HttpFactoryService().createHttpService()
);
