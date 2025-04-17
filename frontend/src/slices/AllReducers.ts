import { combineReducers } from "@reduxjs/toolkit";
import userSlice from './userSlice.ts';

const allReducers = combineReducers(
    {
                                        user: userSlice,
                                                                                                    });

export default allReducers;