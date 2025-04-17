import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  user: IUser | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  User: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login(state, action: PayloadAction<any>) {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.userInfo = null;
    },
    // Add support for external actions if needed
    externalLogin(state, action: PayloadAction<any>) {
      return { ...state, isAuthenticated: true, user: action.payload };
    },
    externalLogout(state) {
      return { ...state, isAuthenticated: false, userInfo: null };
    },
  },
});

export const { login, logout, externalLogin, externalLogout } =
  userSlice.actions;
export default userSlice.reducer;
