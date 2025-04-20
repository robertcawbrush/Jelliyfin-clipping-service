import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Clip {
  id: number;
  videoId: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath?: string;
}

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
      const response = await fetch('http://localhost:8000/api/clips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId, startTime, endTime }),
      });

      if (!response.ok) {
        return rejectWithValue('Failed to create clip');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

// Async thunk for fetching all clips
export const fetchClips = createAsyncThunk(
  'clips/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:8000/api/clips', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return rejectWithValue('Failed to fetch clips');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

// Async thunk for fetching a single clip
export const fetchClipById = createAsyncThunk(
  'clips/fetchById',
  async (clipId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:8000/api/clips/${clipId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return rejectWithValue('Failed to fetch clip');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

// Async thunk for deleting a clip
export const deleteClip = createAsyncThunk(
  'clips/delete',
  async (clipId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`http://localhost:8000/api/clips/${clipId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return rejectWithValue('Failed to delete clip');
      }

      return clipId;
    } catch (error) {
      return rejectWithValue('Network error');
    }
  }
);

const clipSlice = createSlice({
  name: 'clips',
  initialState,
  reducers: {
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
        state.currentClip = action.payload;
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

export const { clearCurrentClip } = clipSlice.actions;
export default clipSlice.reducer; 