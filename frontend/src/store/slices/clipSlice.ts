import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axios';
import { Clip } from '../../types';

interface ClipState {
  clips: Clip[];
  currentClip: Clip | null;
  loading: boolean;
  error: string | null;
}

const initialState: ClipState = {
  clips: [],
  currentClip: null,
  loading: false,
  error: null
};

// Async thunk for creating a clip
export const createClip = createAsyncThunk(
  'clips/create',
  async ({ videoId, startTime, endTime }: { videoId: string; startTime: string; endTime: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/clips', { videoId, startTime, endTime });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create clip');
    }
  }
);

// Async thunk for fetching all clips
export const fetchClips = createAsyncThunk(
  'clips/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/clips');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch clips');
    }
  }
);

// Async thunk for fetching a single clip
export const fetchClipById = createAsyncThunk(
  'clips/fetchById',
  async (clipId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/clips/${clipId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch clip');
    }
  }
);

// Async thunk for deleting a clip
export const deleteClip = createAsyncThunk(
  'clips/delete',
  async (clipId: number, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/clips/${clipId}`);
      return clipId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete clip');
    }
  }
);

const clipSlice = createSlice({
  name: 'clips',
  initialState,
  reducers: {
    setCurrentClip: (state, action) => {
      state.currentClip = action.payload;
    },
    clearCurrentClip: (state) => {
      state.currentClip = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create clip
      .addCase(createClip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClip.fulfilled, (state, action) => {
        state.loading = false;
        state.clips.push(action.payload);
      })
      .addCase(createClip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch all clips
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
        state.error = action.payload as string;
      })
      // Fetch clip by ID
      .addCase(fetchClipById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClipById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentClip = action.payload;
      })
      .addCase(fetchClipById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete clip
      .addCase(deleteClip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteClip.fulfilled, (state, action) => {
        state.loading = false;
        state.clips = state.clips.filter(clip => clip.id !== action.payload);
        if (state.currentClip?.id === action.payload) {
          state.currentClip = null;
        }
      })
      .addCase(deleteClip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setCurrentClip, clearCurrentClip } = clipSlice.actions;
export default clipSlice.reducer; 