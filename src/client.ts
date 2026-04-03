import { ListBeeApiError } from "./types.js";

/**
 * Thin fetch wrapper for the ListBee REST API.
 * All requests include Authorization header. Non-2xx throws ListBeeApiError.
 */
export class ListBeeClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, baseUrl = "https://api.listbee.so") {
    this.apiKey = apiKey;
    // Strip trailing slash
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  /**
   * Make an authenticated JSON request. Returns parsed response body.
   */
  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };

    const init: RequestInit = { method, headers };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);

    // Handle 204 No Content
    if (res.status === 204) {
      return undefined as T;
    }

    const json = await res.json();

    if (!res.ok) {
      throw new ListBeeApiError(res.status, json);
    }

    return json as T;
  }

  /**
   * Upload a file via multipart form data to /v1/files.
   */
  async uploadFile(fileBuffer: Uint8Array, filename: string): Promise<unknown> {
    const url = `${this.baseUrl}/v1/files`;
    const form = new FormData();
    const blob = new Blob([fileBuffer as BlobPart]);
    form.append("file", blob, filename);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: form,
    });

    const json = await res.json();

    if (!res.ok) {
      throw new ListBeeApiError(res.status, json);
    }

    return json;
  }
}
