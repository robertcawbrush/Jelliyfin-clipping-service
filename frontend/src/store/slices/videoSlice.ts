import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Video {
  Id: string;
  Name: string;
  Path: string;
  Type: string;
  MediaType: string;
  RunTimeTicks?: number;
  Size?: number;
  Container?: string;
  MediaStreams?: Array<{
    Codec: string;
    Type: 'Video' | 'Audio' | 'Subtitle';
  }>;
}

interface VideoState {
  searchResults: Video[];
  currentVideo: Video | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
}

const initialState: VideoState = {
  searchResults: [],
  currentVideo: null,
  loading: false,
  error: null,
  totalCount: 0
};

// Async thunk for searching videos
export const searchVideos = createAsyncThunk(
  'videos/search',
  async ({ query, limit = 20 }: { query: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:8000/api/videos/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return rejectWithValue('Failed to search videos');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

// Async thunk for getting video details
export const getVideoDetails = createAsyncThunk(
  'videos/getDetails',
  async (videoId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:8000/api/video?id=${videoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return rejectWithValue('Failed to get video details');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

// Async thunk for getting recent videos
export const getRecentVideos = createAsyncThunk(
  'videos/getRecent',
  async (limit = 20, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:8000/api/videos/recent?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return rejectWithValue('Failed to get recent videos');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    clearCurrentVideo: (state) => {
      state.currentVideo = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.totalCount = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Search videos
      .addCase(searchVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.Items;
        state.totalCount = action.payload.TotalRecordCount;
      })
      .addCase(searchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get video details
      .addCase(getVideoDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVideoDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVideo = action.payload;
      })
      .addCase(getVideoDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Get recent videos
      .addCase(getRecentVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRecentVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.Items;
        state.totalCount = action.payload.TotalRecordCount;
      })
      .addCase(getRecentVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCurrentVideo, clearSearchResults } = videoSlice.actions;
export default videoSlice.reducer; 