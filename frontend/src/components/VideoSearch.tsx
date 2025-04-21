import React from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { searchVideos, clearSearchResults, setSearchQuery, setSearchLimit } from '../store/slices/videoSlice';
import { useNavigate } from 'react-router-dom';

interface VideoSearchProps {
  shouldNavigate?: boolean;
  showResults?: boolean;
}

export const VideoSearch: React.FC<VideoSearchProps> = ({ 
  shouldNavigate = true,
  showResults = true 
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { 
    searchResults, 
    loading, 
    error, 
    totalCount,
    searchQuery,
    searchLimit
  } = useAppSelector((state) => state.videos);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await dispatch(searchVideos({ query: searchQuery, limit: searchLimit }));
      if (shouldNavigate) {
        navigate('/videos');
      }
    } else {
      dispatch(clearSearchResults());
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--color-dark-text)' }}>Search Videos</h2>
      
      <form onSubmit={handleSearch} className="flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search for videos..."
            className="flex-1 px-4 py-2 rounded-md"
            style={{ 
              backgroundColor: 'var(--color-dark-bg)',
              color: 'var(--color-dark-text)',
              borderColor: 'var(--color-dark-text-secondary)'
            }}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md text-white"
            style={{ backgroundColor: 'var(--color-dark-primary)' }}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="limit" className="text-sm" style={{ color: 'var(--color-dark-text)' }}>
            Results per page:
          </label>
          <select
            id="limit"
            value={searchLimit}
            onChange={(e) => dispatch(setSearchLimit(Number(e.target.value)))}
            className="px-2 py-1 rounded-md"
            style={{ 
              backgroundColor: 'var(--color-dark-bg)',
              color: 'var(--color-dark-text)',
              borderColor: 'var(--color-dark-text-secondary)'
            }}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </form>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {showResults && (
        <>
          {totalCount > 0 && (
            <p className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>
              Found {totalCount} videos
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((video) => (
              <div
                key={video.Id}
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-dark-surface)' }}
              >
                <h3 className="font-semibold" style={{ color: 'var(--color-dark-text)' }}>{video.Name}</h3>
                <p className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>{video.Overview}</p>
                {video.RunTimeTicks && (
                  <p className="text-sm mt-2" style={{ color: 'var(--color-dark-text-secondary)' }}>
                    Duration: {Math.floor(video.RunTimeTicks / 600000000)} minutes
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}; 