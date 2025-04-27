import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axios';
import { JellyfinSearchResponse, Video } from '../../types';

interface VideoState {
  searchResults: Video[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  searchQuery: string;
  searchLimit: number;
}

const initialState: VideoState = {
  searchResults: [],
  loading: false,
  error: null,
  totalCount: 0,
  searchQuery: '',
  searchLimit: 20
};

// Async thunk for searching videos
export const searchVideos = createAsyncThunk(
  'videos/search',
  async ({ query, limit = 20 }: { query: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<JellyfinSearchResponse>('/api/video-search', {
        params: { query, limit }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to search videos');
    }
  }
);

// Async thunk for fetching video details
export const fetchVideoDetails = createAsyncThunk(
  'videos/fetchDetails',
  async (videoId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<Video>(`/api/video-details/${videoId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch video details');
    }
  }
);

const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.error = null;
      state.totalCount = 0;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setSearchLimit: (state, action) => {
      state.searchLimit = action.payload;
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
        state.searchResults = action.payload.Items || [];
        state.totalCount = action.payload.TotalRecordCount || 0;
      })
      .addCase(searchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch video details
      .addCase(fetchVideoDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideoDetails.fulfilled, (state, action) => {
        state.loading = false;
        // Update the video in search results if it exists
        const index = state.searchResults.findIndex(v => v.Id === action.payload.Id);
        if (index !== -1) {
          state.searchResults[index] = action.payload;
        }
      })
      .addCase(fetchVideoDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearSearchResults, setSearchQuery, setSearchLimit } = videoSlice.actions;
export default videoSlice.reducer;
