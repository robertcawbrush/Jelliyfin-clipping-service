import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchVideoDetails } from '../store/slices/videoSlice';

export const VideoDetails: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedVideo, loading, error } = useAppSelector((state) => state.videos);

  useEffect(() => {
    if (videoId) {
      dispatch(fetchVideoDetails(videoId));
    }
  }, [dispatch, videoId]);

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--color-dark-text)' }}>
        Loading video details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate('/videos')}
          className="px-4 py-2 rounded-md text-white"
          style={{ backgroundColor: 'var(--color-dark-primary)' }}
        >
          Back to Search
        </button>
      </div>
    );
  }

  if (!selectedVideo) {
    return (
      <div className="p-8">
        <div className="text-center mb-4" style={{ color: 'var(--color-dark-text)' }}>
          Video not found
        </div>
        <button
          onClick={() => navigate('/videos')}
          className="px-4 py-2 rounded-md text-white"
          style={{ backgroundColor: 'var(--color-dark-primary)' }}
        >
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <button
        onClick={() => navigate('/videos')}
        className="px-4 py-2 rounded-md text-white mb-6"
        style={{ backgroundColor: 'var(--color-dark-primary)' }}
      >
        Back to Search
      </button>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-dark-text)' }}>
          {selectedVideo.Name}
        </h1>

        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: 'var(--color-dark-primary)', color: 'white' }}>
            {selectedVideo.Type}
          </span>
          {selectedVideo.ProductionYear && (
            <span className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>
              {selectedVideo.ProductionYear}
            </span>
          )}
          {selectedVideo.RunTimeTicks && (
            <span className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>
              {Math.floor(selectedVideo.RunTimeTicks / 600000000)} minutes
            </span>
          )}
        </div>

        {selectedVideo.Type === 'Episode' && selectedVideo.SeriesName && (
          <div className="text-lg" style={{ color: 'var(--color-dark-text)' }}>
            Series: {selectedVideo.SeriesName}
          </div>
        )}

        {selectedVideo.Overview && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-dark-text)' }}>
              Overview
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>
              {selectedVideo.Overview}
            </p>
          </div>
        )}

        {selectedVideo.OfficialRating && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-dark-text)' }}>
              Rating
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>
              {selectedVideo.OfficialRating}
            </p>
          </div>
        )}

        {selectedVideo.MediaSources && selectedVideo.MediaSources.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-dark-text)' }}>
              Media Details
            </h2>
            <div className="space-y-2">
              {selectedVideo.MediaSources.map((source, index) => (
                <div
                  key={source.Id}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--color-dark-surface)' }}
                >
                  <div className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>
                    <div>Container: {source.Container}</div>
                    <div>Size: {Math.round(source.Size / 1024 / 1024)} MB</div>
                    <div>Bitrate: {Math.round(source.Bitrate / 1000)} kbps</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 