import { HttpFactoryService } from "../http-factory.service";
import { IHttpConfig } from "../types";
import type { HttpService } from "../http.service";
import { ITFinResponse } from "./types";

class ProjectsSummaryService {
  constructor(private readonly httpService: HttpService) {
    this.httpService = httpService;
  }

  public async getProjectsSummaryResponse(
    q: string,
    config?: IHttpConfig
  ): Promise<ITFinResponse> {
    const url = new URL("tracking/projects-summary");

    if (Boolean(q)) {
      url.searchParams.append("q", q!);
    }

    return this.httpService.get(url.toString(), config);
  }
}

export const projectsSummaryService = new ProjectsSummaryService(
  new HttpFactoryService().createHttpService()
);
