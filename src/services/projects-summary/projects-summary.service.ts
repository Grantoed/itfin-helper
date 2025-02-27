import { HttpFactoryService } from "../http-factory.service";
import { IHttpConfig } from "../types";
import type { HttpService } from "../http.service";
import { ITFinResponse, GetProjectsSummaryResponseQuery } from "./types";

class ProjectsSummaryService {
  constructor(private readonly httpService: HttpService) {
    this.httpService = httpService;
  }

  public async getProjectsSummaryResponse(
    q: GetProjectsSummaryResponseQuery,
    config?: IHttpConfig
  ): Promise<ITFinResponse> {
    const endpoint = "tracking/projects-summary";

    const queryString = Object.entries(q)
      .map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
      .join("&");

    const url = `${endpoint}?${queryString}`;

    console.log(url.toString());

    return this.httpService.get(url.toString(), config);
  }
}

export const projectsSummaryService = new ProjectsSummaryService(
  new HttpFactoryService().createHttpService()
);
