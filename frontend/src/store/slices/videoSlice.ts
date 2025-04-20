import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { JellyfinSearchResponse, Video } from '../../types';

interface VideoState {
  searchResults: Video[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

const initialState: VideoState = {
  searchResults: [],
  loading: false,
  error: null,
  totalCount: 0,
};

export const searchVideos = createAsyncThunk(
  'videos/search',
  async ({ query, limit = 10 }: { query: string; limit?: number }) => {
    const response = await axios.get<JellyfinSearchResponse>(
      `${API_BASE_URL}/api/videos/search`,
      {
        params: {
          q: query,
          limit,
        },
      },
    );
    return response.data;
  },
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
  },
  extraReducers: (builder) => {
    builder
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
        state.error = action.error.message || 'Failed to search videos';
      });
  },
});

export const { clearSearchResults } = videoSlice.actions;
export default videoSlice.reducer;
