import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { searchVideos, clearSearchResults } from '../store/slices/videoSlice';
import { useNavigate } from 'react-router-dom';

interface VideoSearchProps {
  shouldNavigate?: boolean;
  showResults?: boolean;
}

export const VideoSearch: React.FC<VideoSearchProps> = ({ 
  shouldNavigate = true,
  showResults = true 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useAppDispatch();
  const { searchResults, loading, error, totalCount } = useAppSelector((state) => state.videos);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      await dispatch(searchVideos({ query: searchQuery, limit: 10 }));
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
      
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
                key={video.id}
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-dark-surface)' }}
              >
                {video.thumbnailUrl && (
                  <img 
                    src={video.thumbnailUrl} 
                    alt={video.title}
                    className="w-full h-48 object-cover rounded-md mb-3"
                  />
                )}
                <h3 className="font-semibold" style={{ color: 'var(--color-dark-text)' }}>{video.title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>{video.description}</p>
                {video.duration && (
                  <p className="text-sm mt-2" style={{ color: 'var(--color-dark-text-secondary)' }}>
                    Duration: {video.duration}
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