import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Video } from '../types';
import { useAppSelector } from '../hooks';

const VideoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, accessToken } = useAppSelector((state) => state.auth);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        // Use our own API endpoint that calls Jellyfin
        const response = await axios.get<Video>(
          `${API_BASE_URL}/api/video-details/${id}`,
          {
            headers: {
              'X-User-Id': userId || '',
              'Authorization': `Bearer ${accessToken || ''}`
            }
          }
        );
        setVideo(response.data);
      } catch (err) {
        console.error('Error fetching video details:', err);
        setError('Failed to load video details');
      } finally {
        setLoading(false);
      }
    };

    if (id && userId) {
      fetchVideoDetails();
    } else if (!userId) {
      setError('User ID not found. Please log in again.');
      setLoading(false);
    }
  }, [id, userId, accessToken]);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error || !video) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error || 'Video not found'}</div>
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

  const formatDuration = (ticks: number) => {
    const hours = Math.floor(ticks / 36000000000);
    const minutes = Math.floor((ticks % 36000000000) / 600000000);
    const seconds = Math.floor((ticks % 600000000) / 10000000);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-white">{video.Name}</h1>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/clip-studio/${video.Id}`)}
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: 'var(--color-dark-primary)' }}
              >
                Create Clip
              </button>
              <button
                onClick={() => navigate('/videos')}
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: 'var(--color-dark-primary)' }}
              >
                Back to Search
              </button>
            </div>
          </div>
          
          {video.ImageTags?.Primary && (
            <img
              src={`${API_BASE_URL}/Items/${video.Id}/Images/Primary`}
              alt={video.Name}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-300">Overview</h3>
                <p className="text-gray-400">{video.Overview || 'No overview available'}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-300">Details</h3>
                <dl className="grid grid-cols-2 gap-2 text-gray-400">
                  <dt>Duration:</dt>
                  <dd>{formatDuration(video.RunTimeTicks)}</dd>
                  
                  <dt>Year:</dt>
                  <dd>{video.ProductionYear || 'N/A'}</dd>
                  
                  <dt>Rating:</dt>
                  <dd>{video.OfficialRating || 'N/A'}</dd>
                  
                  <dt>Container:</dt>
                  <dd>{video.Container || 'N/A'}</dd>
                  
                  {video.Type === 'Episode' && video.SeriesName && (
                    <>
                      <dt>Series:</dt>
                      <dd>{video.SeriesName}</dd>
                    </>
                  )}
                </dl>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-300">Media Information</h3>
                <dl className="grid grid-cols-2 gap-2 text-gray-400">
                  {video.MediaStreams?.map((stream, index) => (
                    <React.Fragment key={index}>
                      <dt className="col-span-2 font-semibold text-gray-300 mt-2">
                        {stream.Type} Stream {index + 1}
                      </dt>
                      <dt>Codec:</dt>
                      <dd>{stream.Codec}</dd>
                      {stream.Width && stream.Height && (
                        <>
                          <dt>Resolution:</dt>
                          <dd>{`${stream.Width}x${stream.Height}`}</dd>
                        </>
                      )}
                      {stream.BitRate && (
                        <>
                          <dt>Bitrate:</dt>
                          <dd>{`${Math.round(stream.BitRate / 1000)} kbps`}</dd>
                        </>
                      )}
                      {stream.AspectRatio && (
                        <>
                          <dt>Aspect Ratio:</dt>
                          <dd>{stream.AspectRatio}</dd>
                        </>
                      )}
                      {stream.AverageFrameRate && (
                        <>
                          <dt>Frame Rate:</dt>
                          <dd>{stream.AverageFrameRate.toFixed(2)} fps</dd>
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </dl>
              </div>
              
              {video.MediaSources && video.MediaSources.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-300">Media Sources</h3>
                  <dl className="grid grid-cols-2 gap-2 text-gray-400">
                    {video.MediaSources.map((source, index) => (
                      <React.Fragment key={index}>
                        <dt className="col-span-2 font-semibold text-gray-300 mt-2">
                          Source {index + 1}
                        </dt>
                        <dt>Container:</dt>
                        <dd>{source.Container || 'N/A'}</dd>
                        <dt>Size:</dt>
                        <dd>{source.Size ? `${Math.round(source.Size / (1024 * 1024))} MB` : 'N/A'}</dd>
                        <dt>Bitrate:</dt>
                        <dd>{source.Bitrate ? `${Math.round(source.Bitrate / 1000)} kbps` : 'N/A'}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetails; 