import type { AxiosRequestConfig } from "axios";
import type { IHttpClient, IResponse } from "./types";

export class HttpService {
  constructor(
    private readonly fetchingService: IHttpClient,
    private readonly baseUrl = "https://keenethics.itfin.io/api/v1"
  ) {
    this.fetchingService = fetchingService;
    this.baseUrl = baseUrl;
  }

  public createQueryLink(
    base: string,
    searchParams: Record<string, string>
  ): string {
    return `${base}?${new URLSearchParams(searchParams).toString()}`;
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log(config.headers);
    return this.fetchingService
      .get<IResponse<T>>(this.getFullApiUrl(url), config)
      .then((result) => {
        return result.data;
      });
  }

  public async post<T, TD>(
    url: string,
    data?: TD,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.fetchingService
      .post<IResponse<T>, TD>(this.getFullApiUrl(url), data, config)
      .then((result) => {
        return result.data;
      });
  }

  public async put<T, TD>(
    url: string,
    data: TD,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.fetchingService
      .put<IResponse<T>, TD>(this.getFullApiUrl(url), data, config)
      .then((result) => {
        return result.data;
      });
  }

  public async patch<T, TD>(
    url: string,
    data: TD,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.fetchingService
      .patch<IResponse<T>, TD>(this.getFullApiUrl(url), data, config)
      .then((result) => {
        return result.data;
      });
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.fetchingService
      .delete<IResponse<T>>(this.getFullApiUrl(url), config)
      .then((result) => {
        return result.data;
      });
  }

  public getFullApiUrl(url: string): string {
    return `${this.baseUrl}/${url}`;
  }
}
