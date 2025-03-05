import { HttpFactoryService } from "../http-factory.service";
import { IHttpConfig } from "../types";
import type { HttpService } from "../http.service";
import { EmployeeRecord, GetTrackingResponseQuery } from "./types";

class TrackingService {
  constructor(private readonly httpService: HttpService) {
    this.httpService = httpService;
  }

  public async getTrackingResponse(
    q: GetTrackingResponseQuery,
    config?: IHttpConfig
  ): Promise<Array<EmployeeRecord>> {
    const endpoint = "teams/28/tracking";

    const queryString = Object.entries(q)
      .map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
      .join("&");

    const url = `${endpoint}?${queryString}`;

    console.log(url.toString());

    return this.httpService.get(url.toString(), config);
  }
}

export const trackingService = new TrackingService(
  new HttpFactoryService().createHttpService()
);
