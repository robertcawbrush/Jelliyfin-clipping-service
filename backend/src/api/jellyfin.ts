import { getDynamicHlsApi } from "@jellyfin/sdk/lib/utils/api/dynamic-hls-api.js";
import { getSessionApi } from "@jellyfin/sdk/lib/utils/api/session-api.js";
import { getDevicesApi } from "@jellyfin/sdk/lib/utils/api/devices-api.js";

export interface JellyfinGetItemsParams {
  searchTerm?: string;
  includeItemTypes?: Array<"Movie" | "Series" | "Episode" | "Video">;
  sortBy?: Array<
    "Name" | "DateCreated" | "PremiereDate" | "PlayCount" | "Random"
  >;
  sortOrder?: Array<"Ascending" | "Descending">;
  limit?: number;
  startIndex?: number;
  recursive?: boolean;
  parentId?: string;
  fields?: Array<"Overview" | "Path" | "MediaSources" | "MediaStreams">;
  enableImages?: boolean;
  enableUserData?: boolean;
  imageTypeLimit?: number;
}

export interface JellyfinMediaStream {
  Codec: string;
  Type: "Video" | "Audio" | "Subtitle";
}

export interface JellyfinItem {
  Id: string;
  Name: string;
  Path: string;
  Type: string;
  MediaType: string;
  RunTimeTicks?: number;
  Size?: number;
  Container?: string;
  MediaStreams?: JellyfinMediaStream[];
}

export interface JellyfinItemsResponse {
  Items: JellyfinItem[];
  TotalRecordCount: number;
  StartIndex: number;
}

import { Jellyfin } from "@jellyfin/sdk";
import { AxiosResponse } from "npm:axios@1.8.4";
import { CLIENT_NAME, DEVICE_NAME } from "./constants.ts";

export class JellyfinClient {
  private baseUrl: string;
  private apiKey: string;
  public jcsurl: string;
  private sdkApi: any | null = null;
  private jellyfin: any | null = null;

  constructor(baseUrl: string, apiKey: string, jcsurl: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.jcsurl = jcsurl;
  }

  getSdkApi() {
    if (!this.sdkApi) {
      console.log(`🔑 Creating new SDK API instance...`);

      if (!this.jellyfin) {
        this.jellyfin = new Jellyfin({
          clientInfo: {
            name: CLIENT_NAME,
            version: "1.0.0",
          },
          deviceInfo: {
            name: DEVICE_NAME,
            id: "jelly-clipping-service",
          },
        });
        console.log(
          `🔑 Jellyfin SDK initialized with base URL: ${this.baseUrl}`,
        );
      }

      // Create an API instance with the server address
      this.sdkApi = this.jellyfin.createApi(this.baseUrl);

      console.log(`🔑 API instance created, setting API key in headers...`);

      // Set the API key in the headers
      this.sdkApi.configuration.headers = {
        ...this.sdkApi.configuration.headers,
        "X-MediaBrowser-Token": this.apiKey,
      };

    }

    return this.sdkApi;
  }

  async getItems(
    params: JellyfinGetItemsParams,
  ): Promise<JellyfinItemsResponse> {
    try {
      console.log(`🔍 Getting items with params:`, params);
      const api = this.getSdkApi();
      const response = await api.items.getItems(params);

      if (!response.data.Items) {
        throw new Error("No items found in the response");
      }

      console.log(`✅ Found ${response.data.Items.length} items`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to get items: ${error.message}`);
      throw error;
    }
  }

  async getSessions(): Promise<any> {
    try {
      const api = this.getSdkApi();
      const sessionApi = getSessionApi(api);

     const sessionsResponse = await sessionApi.getSessions();

      if(!sessionsResponse) {
        throw new Error("No sessions found")
      }

      return sessionsResponse.data;
    } catch (error: any) {
      console.error(`❌ Failed to get sessions from jellyfin: ${error.message}`);
      throw error;
    }
  }

  async getHlsMasterPlaylist(
    videoId: string,
    mediaSourceId: string,
  ): Promise<any> {
    const api = this.getSdkApi();
    const dynamicHlsApi = getDynamicHlsApi(api);

    return await dynamicHlsApi.getMasterHlsVideoPlaylist(
      {
        itemId: videoId,
        mediaSourceId: mediaSourceId,
      },
    );
  }

  async getHlsVariantPlaylist(
      mediaSourceId: string,
  ): Promise<any> {
    const api = this.getSdkApi();
    const dynamicHlsApi = getDynamicHlsApi(api);

    return await dynamicHlsApi.getVariantHlsVideoPlaylist(
        {
          itemId: mediaSourceId,
          mediaSourceId: mediaSourceId,
        },
    );
  }
  async getHlsVideoSegment(
      itemId: string,
      segmentId: number,
      container: string,
      runtimeTicks: number,
      actualSegmentLengthTicks: number,
      sessionId: string,
      playlistId: string,
  ): Promise<AxiosResponse<File, any>> {
    const api = this.getSdkApi();
    const dynamicHlsApi = getDynamicHlsApi(api);

    const uuid = crypto.randomUUID();
    const randomNumber = Math.random * 100;
    return await dynamicHlsApi.getHlsVideoSegment(
        {
          itemId,
          playlistId: `hls${uuid + randomNumber}`,
          segmentId,
          container,
          runtimeTicks,
          actualSegmentLengthTicks,
          deviceId: `jelly-clipping-service-device-id`,
          mediaSourceId: itemId,
          maxWidth: 1920,
          videoCodec: "copy",
          audioCodec: "copy",
          // playSessionId: sessionId,
          playSessionId: "0b6d910c07ad4b7886cd9be0e949dde1",
        },
        { responseType: "arraybuffer" },
    );
  }

}

export async function initJellyfinClient(): Promise<JellyfinClient> {
  const JELLYFIN_URL = Deno.env.get("JELLYFIN_URL")?.replace(/\/$/, "");
  const JELLYFIN_API_KEY = Deno.env.get("JELLYFIN_API_KEY");
  const JCS_URL = Deno.env.get("JCS_URL");
  const JCS_PORT = Deno.env.get("JCS_PORT");

  if (!JELLYFIN_URL || !JELLYFIN_API_KEY || !JCS_URL || !JCS_PORT) {
    throw new Error("Missing Jellyfin configuration!");
  }

  const jcsurl = `${JCS_URL}:${JCS_PORT}`;

  return new JellyfinClient(JELLYFIN_URL, JELLYFIN_API_KEY, jcsurl);
}
