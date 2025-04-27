import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchVideoDetails } from '../store/slices/videoSlice';
import { Video } from '../types';

const VideoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { searchResults, loading, error } = useAppSelector((state) => state.videos);
  const video = searchResults.find(v => v.Id === id);

  useEffect(() => {
    if (id) {
      dispatch(fetchVideoDetails(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return <div className="text-center py-8" style={{ color: 'var(--color-dark-text)' }}>Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!video) {
    return <div className="text-center py-8" style={{ color: 'var(--color-dark-text)' }}>Video not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-lg shadow-lg overflow-hidden" style={{ backgroundColor: 'var(--color-dark-surface)' }}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: 'var(--color-dark-primary)', color: 'white' }}>
              {video.Type}
            </span>
            {video.ProductionYear && (
              <span className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>
                {video.ProductionYear}
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-dark-text)' }}>{video.Name}</h1>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              {video.Type === 'Episode' && video.SeriesName && (
                <p className="text-lg" style={{ color: 'var(--color-dark-text-secondary)' }}>
                  Series: {video.SeriesName}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate(`/clip-studio/${video.Id}`)}
              className="px-4 py-2 rounded-md text-white transition-colors ml-auto"
              style={{ backgroundColor: 'var(--color-dark-primary)' }}
            >
              Create Clip
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={video.ImageTags?.Primary ? `/api/items/${video.Id}/images/Primary` : '/placeholder.jpg'}
                alt={video.Name}
                className="w-full rounded-lg"
              />
            </div>
            <div className="space-y-4">
              <p className="text-base" style={{ color: 'var(--color-dark-text-secondary)' }}>{video.Overview}</p>
              
              <div className="space-y-2">
                <p><span className="font-semibold" style={{ color: 'var(--color-dark-text)' }}>Type:</span> <span style={{ color: 'var(--color-dark-text-secondary)' }}>{video.Type}</span></p>
                <p><span className="font-semibold" style={{ color: 'var(--color-dark-text)' }}>Year:</span> <span style={{ color: 'var(--color-dark-text-secondary)' }}>{video.ProductionYear}</span></p>
                <p><span className="font-semibold" style={{ color: 'var(--color-dark-text)' }}>Duration:</span> <span style={{ color: 'var(--color-dark-text-secondary)' }}>{Math.floor(video.RunTimeTicks / 10000000 / 60)} minutes</span></p>
                {video.OfficialRating && (
                  <p><span className="font-semibold" style={{ color: 'var(--color-dark-text)' }}>Rating:</span> <span style={{ color: 'var(--color-dark-text-secondary)' }}>{video.OfficialRating}</span></p>
                )}
                {video.CommunityRating && (
                  <p><span className="font-semibold" style={{ color: 'var(--color-dark-text)' }}>Community Rating:</span> <span style={{ color: 'var(--color-dark-text-secondary)' }}>{video.CommunityRating.toFixed(1)}/5</span></p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetails; 