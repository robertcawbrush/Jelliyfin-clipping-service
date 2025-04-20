import React from 'react';
import { useAppSelector } from '../hooks';
import { VideoSearch } from '../components/VideoSearch';
import { useNavigate } from 'react-router-dom';

export const VideoList: React.FC = () => {
  const { searchResults, loading, error, totalCount } = useAppSelector((state) => state.videos);
  const navigate = useNavigate();

  if (loading) {
    return <div style={{ color: 'var(--color-dark-text)' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--color-dark-text)' }}>Error: {error}</div>;
  }

  const handleVideoClick = (videoId: string) => {
    navigate(`/videos/${videoId}`);
  };

  return (
    <div className="space-y-8">
      <VideoSearch shouldNavigate={false} showResults={false} />

      <div className="space-y-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-dark-text)' }}>Search Results</h1>
        
        {totalCount > 0 && (
          <p className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>
            Found {totalCount} videos
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((video) => (
            <div
              key={video.Id}
              className="p-4 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--color-dark-surface)' }}
              onClick={() => handleVideoClick(video.Id)}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: 'var(--color-dark-primary)', color: 'white' }}>
                    {video.Type}
                  </span>
                  {video.ProductionYear && (
                    <span className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>
                      {video.ProductionYear}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--color-dark-text)' }}>
                  {video.Name}
                </h3>
                {video.Type === 'Episode' && video.SeriesName && (
                  <p className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>
                    Series: {video.SeriesName}
                  </p>
                )}
                {video.RunTimeTicks && (
                  <p className="text-sm mt-2" style={{ color: 'var(--color-dark-text-secondary)' }}>
                    Duration: {Math.floor(video.RunTimeTicks / 600000000)} minutes
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalCount === 0 && !loading && !error && (
          <p className="text-center text-lg" style={{ color: 'var(--color-dark-text-secondary)' }}>
            No videos found. Try a different search term.
          </p>
        )}
      </div>
    </div>
  );
}; 