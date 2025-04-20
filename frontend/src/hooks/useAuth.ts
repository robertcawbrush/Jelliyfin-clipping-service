import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { loginUser, logoutUser } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Auth state is now handled by the auth slice's loadState function
  }, []);

  const login = async (username: string, password: string) => {
    try {
      await dispatch(loginUser({ username, password })).unwrap();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    dispatch(logoutUser());
  };

  return {
    isAuthenticated: auth.isAuthenticated,
    userId: auth.userId,
    accessToken: auth.accessToken,
    loading: auth.loading,
    error: auth.error,
    login,
    logout
  };
}; 