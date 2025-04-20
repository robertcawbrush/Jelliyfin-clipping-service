import { configureStore } from '@reduxjs/toolkit';
import clipsReducer from './slices/clipsSlice';

export const store = configureStore({
  reducer: {
    clips: clipsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 