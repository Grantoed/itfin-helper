import { HttpService } from "./http.service";
import { mainAxios } from "./main-axios";

export class HttpFactoryService {
  public createHttpService(): HttpService {
    return new HttpService(mainAxios);
  }
}
