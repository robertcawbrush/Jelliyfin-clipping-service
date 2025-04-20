import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logoutUser } from '../store/slices/authSlice';
import { AppDispatch } from '../store';

const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <header
      className="shadow-md"
      style={{ backgroundColor: 'var(--color-dark-surface)' }}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold"
            style={{ color: 'var(--color-dark-text)' }}
          >
            Jellyfin Clipping Service
          </Link>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/clips"
                  className="hover:opacity-80"
                  style={{ color: 'var(--color-dark-text)' }}
                >
                  Clips
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded transition-colors"
                  style={{ backgroundColor: 'var(--color-dark-primary)' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:opacity-80"
                  style={{ color: 'var(--color-dark-text)' }}
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
