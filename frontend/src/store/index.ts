import { configureStore } from "@reduxjs/toolkit";
import allReducers from "../slices/AllReducers.ts";

export const store = configureStore({
     reducer: { ...allReducers },
     devTools: process.env.NODE_ENV !== 'production'
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
