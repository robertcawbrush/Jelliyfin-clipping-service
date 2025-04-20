import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import { loginUser, logoutUser } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const auth = useSelector((state: RootState) => state.auth);

  const login = async (username: string, password: string) => {
    try {
      await dispatch(loginUser({ username, password })).unwrap();
      // Navigate to clips list after successful login
      navigate('/clips');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    dispatch(logoutUser());
    navigate('/login');
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