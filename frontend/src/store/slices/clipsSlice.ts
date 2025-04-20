import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';

export interface Clip {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  startTime: number;
  endTime: number;
  createdAt: string;
}

interface ClipsState {
  clips: Clip[];
  loading: boolean;
  error: string | null;
}

const initialState: ClipsState = {
  clips: [],
  loading: false,
  error: null,
};

export const fetchClips = createAsyncThunk(
  'clips/fetchClips',
  async () => {
    const response = await fetch('/api/clips');
    if (!response.ok) {
      throw new Error('Failed to fetch clips');
    }
    return response.json();
  }
);

const clipsSlice = createSlice({
  name: 'clips',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClips.fulfilled, (state, action) => {
        state.loading = false;
        state.clips = action.payload;
      })
      .addCase(fetchClips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch clips';
      });
  },
});

export const selectClips = (state: RootState) => state.clips.clips;
export const selectClipsLoading = (state: RootState) => state.clips.loading;
export const selectClipsError = (state: RootState) => state.clips.error;

export default clipsSlice.reducer; 