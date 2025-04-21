// Types for the getItems API parameters
export interface JellyfinGetItemsParams {
  // Most commonly used parameters
  searchTerm?: string;
  includeItemTypes?: Array<'Movie' | 'Series' | 'Episode' | 'Video'>;
  sortBy?: Array<'Name' | 'DateCreated' | 'PremiereDate' | 'PlayCount' | 'Random'>;
  sortOrder?: Array<'Ascending' | 'Descending'>;
  limit?: number;
  startIndex?: number;
  recursive?: boolean;
  parentId?: string;
  fields?: Array<'Overview' | 'Path' | 'MediaSources' | 'MediaStreams'>;
  enableImages?: boolean;
  enableUserData?: boolean;
  imageTypeLimit?: number;
  // Add more parameters as needed
}

export interface JellyfinMediaStream {
  Codec: string;
  Type: 'Video' | 'Audio' | 'Subtitle';
  // Add more properties as needed
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
  // Add more properties as needed
}

export interface JellyfinItemsResponse {
  Items: JellyfinItem[];
  TotalRecordCount: number;
  StartIndex: number;
}

import { Jellyfin } from "@jellyfin/sdk";

export class JellyfinClient {
  private baseUrl: string;
  private apiKey: string;
  private sdkApi: any | null = null;
  private jellyfin: any | null = null;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  // Get the Jellyfin SDK API instance
  getSdkApi() {
    console.log(`🔑 Getting SDK API instance...`);
    
    if (!this.sdkApi) {
      console.log(`🔑 Creating new SDK API instance...`);
      
      // Initialize Jellyfin SDK if not already initialized
      if (!this.jellyfin) {
        this.jellyfin = new Jellyfin({
          clientInfo: {
            name: 'JellyfinClippingService',
            version: '1.0.0'
          },
          deviceInfo: {
            name: 'BackendServer',
            id: 'backend-server-1'
          }
        });
        console.log(`🔑 Jellyfin SDK initialized with base URL: ${this.baseUrl}`);
      }
      
      // Create an API instance with the server address
      this.sdkApi = this.jellyfin.createApi(this.baseUrl);
      
      console.log(`🔑 API instance created, setting API key in headers...`);
      
      // Set the API key in the headers
      this.sdkApi.configuration.headers = {
        ...this.sdkApi.configuration.headers,
        'X-MediaBrowser-Token': this.apiKey
      };
      
      console.log(`🔑 API key set in headers:`, this.sdkApi.configuration.headers);
    } else {
      console.log(`🔑 Using existing SDK API instance`);
    }
    
    return this.sdkApi;
  }

  async authenticate(username: string, password: string): Promise<{ accessToken: string; userId: string }> {
    try {
      console.log(`🔑 Authenticating user: ${username}`);
      const api = this.getSdkApi();
      const authResult = await api.authenticateUserByName(username, password);
      
      if (!authResult.data.User) {
        throw new Error('User data not found in authentication response');
      }
      
      console.log(`✅ Authentication successful for user: ${username}`);
      return {
        accessToken: authResult.data.AccessToken,
        userId: authResult.data.User.Id
      };
    } catch (error: any) {
      console.error(`❌ Authentication failed: ${error.message}`);
      throw error;
    }
  }

  async getItems(params: JellyfinGetItemsParams): Promise<JellyfinItemsResponse> {
    try {
      console.log(`🔍 Getting items with params:`, params);
      const api = this.getSdkApi();
      const response = await api.items.getItems(params);
      
      if (!response.data.Items) {
        throw new Error('No items found in the response');
      }
      
      console.log(`✅ Found ${response.data.Items.length} items`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Failed to get items: ${error.message}`);
      throw error;
    }
  }

  async searchVideos(searchTerm?: string, limit = 20): Promise<JellyfinItemsResponse> {
    return this.getItems({
      searchTerm,
      includeItemTypes: ['Movie', 'Episode', 'Video'],
      recursive: true,
      limit,
      fields: ['Path', 'Overview', 'MediaSources', 'MediaStreams'],
      enableImages: true,
      imageTypeLimit: 1,
      sortBy: ['Name'],
      sortOrder: ['Ascending']
    });
  }

  async getRecentVideos(limit = 20): Promise<JellyfinItemsResponse> {
    return this.getItems({
      includeItemTypes: ['Movie', 'Episode', 'Video'],
      recursive: true,
      limit,
      fields: ['Path', 'Overview', 'MediaSources', 'MediaStreams'],
      enableImages: true,
      imageTypeLimit: 1,
      sortBy: ['DateCreated'],
      sortOrder: ['Descending']
    });
  }
}

export async function initJellyfinClient(): Promise<JellyfinClient> {
  const JELLYFIN_URL = Deno.env.get("JELLYFIN_URL")?.replace(/\/$/, '');
  const JELLYFIN_API_KEY = Deno.env.get("JELLYFIN_API_KEY");

  if (!JELLYFIN_URL || !JELLYFIN_API_KEY) {
    throw new Error("Missing Jellyfin configuration!");
  }

  return new JellyfinClient(JELLYFIN_URL, JELLYFIN_API_KEY);
} 