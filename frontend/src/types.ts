export interface ImageTag {
  Logo: string;
  Primary: string;
}

export interface MediaStreamDetails {
  AspectRatio?: string;
  AudioSpatialFormat: string;
  AverageFrameRate?: number;
  BitDepth?: number;
  BitRate: number;
  ChannelLayout?: string;
  Channels?: number;
  Codec: string;
  DisplayTitle: string;
  Height?: number;
  Index: number;
  IsAVC?: boolean;
  IsDefault: boolean;
  IsExternal: boolean;
  IsForced: boolean;
  IsHearingImpaired: boolean;
  IsInterlaced: boolean;
  IsTextSubtitleStream: boolean;
  Language?: string;
  Level: number;
  LocalizedDefault?: string;
  LocalizedExternal?: string;
  NalLengthSize?: string;
  PixelFormat?: string;
  Profile: string;
  RealFrameRate?: number;
  RefFrames?: number;
  ReferenceFrameRate?: number;
  SampleRate?: number;
  SupportsExternalStream: boolean;
  TimeBase: string;
  Title: string;
  Type: string;
  VideoRange: string;
  VideoRangeType: string;
  Width?: number;
}

export interface MediaSource {
  Protocol: string;
  Id: string;
  Path: string;
  Type: string;
  Container: string;
  Size: number;
  Name: string;
  IsRemote: boolean;
  ETag: string;
  RunTimeTicks: number;
  ReadAtNativeFramerate: boolean;
  IgnoreDts: boolean;
  IgnoreIndex: boolean;
  GenPtsInput: boolean;
  SupportsTranscoding: boolean;
  SupportsDirectStream: boolean;
  SupportsDirectPlay: boolean;
  IsInfiniteStream: boolean;
  UseMostCompatibleTranscodingProfile: boolean;
  RequiresOpening: boolean;
  RequiresClosing: boolean;
  RequiresLooping: boolean;
  SupportsProbing: boolean;
  VideoType: string;
  MediaStreams: MediaStreamDetails[];
  MediaAttachments: any[];
  Formats: string[];
  Bitrate: number;
  RequiredHttpHeaders: Record<string, string>;
  TranscodingSubProtocol: string;
  HasSegments: boolean;
}

export interface Video {
  Name: string;
  ServerId: string;
  Id: string;
  HasSubtitles: boolean;
  Container: string;
  PremiereDate: string;
  MediaSources: MediaSource[];
  CriticRating?: number;
  Path: string;
  OfficialRating?: string;
  ChannelId?: string | null;
  Overview: string;
  CommunityRating?: number;
  RunTimeTicks: number;
  ProductionYear?: number;
  IsFolder: boolean;
  Type: string;
  MediaStreams: MediaStreamDetails[];
  VideoType?: string;
  ImageTags: ImageTag;
  BackdropImageTags: string[];
  ImageBlurHashes?: {
    Backdrop?: Record<string, string>;
    Primary?: Record<string, string>;
    Logo?: Record<string, string>;
  };
  LocationType?: string;
  MediaType?: string;
  SeriesName?: string;
}

export interface JellyfinSearchResponse {
  Items: Video[];
  StartIndex: number;
  TotalRecordCount: number;
}
