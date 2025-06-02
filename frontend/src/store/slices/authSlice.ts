import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axios';

interface AuthState {
    isAuthenticated: boolean;
    accessToken: string | null;
    userId: string | null;
    loading: boolean;
    error: string | null;
    sessionId: string | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    accessToken: null,
    userId: null,
    loading: false,
    error: null,
    sessionId: null,
};

// Load initial state from localStorage if available
const loadState = () => {
    try {
        const serializedState = localStorage.getItem('auth');
        if (serializedState === null) {
            return initialState;
        }
        return JSON.parse(serializedState);
    }
    catch (err) {
        return initialState;
    }
};

export const loginUser = createAsyncThunk(
    'auth/login',
    async ({username, password}: {username: string; password: string}, {rejectWithValue}) => {
        try {
            const response = await axiosInstance.post('/api/auth/login', {username, password});
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'Authentication failed');
        }
    },
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async () => {
        // Clear localStorage
        localStorage.removeItem('auth');
        return null;
    },
);


export const fetchSession = createAsyncThunk(
    'auth/session',
    async (
        _,
        {rejectWithValue}) => {
        try {
            const response = await axiosInstance.get('/api/sessions/');
            return response.data;
        }
        catch (error: any) {
            return rejectWithValue(error.response?.data?.error || 'session fetching failed');
        }
    },
);

const authSlice = createSlice({
                                  name: 'auth',
                                  initialState: loadState(),
                                  reducers: {
                                      hydrate: (state, action) => {
                                          return {...state, ...action.payload};
                                      },
                                  },
                                  extraReducers: (builder) => {
                                      builder
                                          // Login
                                          .addCase(loginUser.pending, (state) => {
                                              state.loading = true;
                                              state.error = null;
                                          })
                                          .addCase(loginUser.fulfilled, (state, action) => {
                                              state.loading = false;
                                              state.isAuthenticated = true;
                                              state.accessToken = action.payload.accessToken;
                                              state.userId = action.payload.userId;
                                              // Save to localStorage
                                              localStorage.setItem('auth', JSON.stringify({
                                                                                              isAuthenticated: true,
                                                                                              accessToken: action.payload.accessToken,
                                                                                              userId: action.payload.userId,
                                                                                          }));
                                          })
                                          .addCase(loginUser.rejected, (state, action) => {
                                              state.loading = false;
                                              state.error = action.payload as string;
                                          })
                                          // Logout
                                          .addCase(logoutUser.fulfilled, (state) => {
                                              state.isAuthenticated = false;
                                              state.accessToken = null;
                                              state.userId = null;
                                              state.error = null;
                                          })
                                          .addCase(fetchSession.pending, (state) => {
                                              state.loading = true;
                                              state.error = null;
                                          })
                                          .addCase(fetchSession.fulfilled, (state, action) => {
                                              state.loading = false;
                                              state.sessionId = action.payload;
                                          })
                                          .addCase(fetchSession.rejected, (state, action) => {
                                              state.loading = false;
                                              state.error = action.payload as string;
                                          })
                                  },
                              });

export default authSlice.reducer; 