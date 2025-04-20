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
}

export class JellyfinClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private buildUrl(endpoint: string, params: Record<string, any> = {}): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(','));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });

    return url.toString();
  }

  async authenticate(username: string, password: string): Promise<{ accessToken: string; userId: string }> {
    const url = this.buildUrl('/Users/AuthenticateByName');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MediaBrowser-Token': this.apiKey
      },
      body: JSON.stringify({
        Username: username,
        Pw: password
      })
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    return {
      accessToken: data.AccessToken,
      userId: data.User.Id
    };
  }

  async getItems(params: JellyfinGetItemsParams): Promise<JellyfinItemsResponse> {
    const url = this.buildUrl('/Items', params);
    
    const response = await fetch(url, {
      headers: {
        'X-MediaBrowser-Token': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    return await response.json();
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