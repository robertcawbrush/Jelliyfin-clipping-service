import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Hls from 'hls.js';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchVideoDetails } from '../store/slices/videoSlice';
import { createClip } from '../store/slices/clipSlice';
import axiosInstance from '../api/axios';

const ClipStudio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { videoDetails: video, loading, error } = useAppSelector(
    (state) => state.videos,
  );

  const userId = useAppSelector(state => state.auth.userId)

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:00');
  const [isCreating, setIsCreating] = useState(false);

  const ticksToTime = (ticks: number) => {
    const totalSeconds = Math.floor(ticks / 10000000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchVideoDetails(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (videoRef.current && video && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30, // Target buffer length in seconds
        maxMaxBufferLength: 60, // Max allowed buffer size
        maxBufferSize: 60 * 1000 * 1000, // (optional) max in bytes
        backBufferLength: 10, // Retain 10 seconds behind current playhead
      });
      hlsRef.current = hls;

      // Fetch playlist using axios instance
      axiosInstance
        .get(`/api/master-hls-playlist/${video.Id}`)
        .then((response) => {
          // Create a blob URL from the playlist content
          const blob = new Blob([response.data], {
            type: 'application/vnd.apple.mpegurl',
          });

          const url = URL.createObjectURL(blob);

          // Load the playlist URL into hls.js
          hls.loadSource(url);
          if (videoRef.current) {
            hls.attachMedia(videoRef.current);
          }

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (videoRef.current) {
              videoRef.current.play();
            }
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            console.error('HLS error:', data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error('Network error, trying to recover...');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error('Media error, trying to recover...');
                  hls.recoverMediaError();
                  break;
                default:
                  console.error('Fatal error, stopping HLS');
                  hls.destroy();
                  break;
              }
            }
          });
        })
        .catch((error) => {
          console.error('Failed to fetch HLS playlist:', error);
        });

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
      };
    }
  }, [video]);

  useEffect(() => {
    if (video) {
      // Set initial end time to video duration
      setEndTime(ticksToTime(video.RunTimeTicks));
    }
  }, [video]);

  const handleCreateClip = async () => {
    if (!video) return;

    setIsCreating(true);
    try {
      await dispatch(
        createClip({
          videoId: video.Id,
          startTime,
          endTime,
        }),
      ).unwrap();
      navigate('/clips');
    } catch (error) {
      console.error('Failed to create clip:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!video) {
    return <div className="text-center py-8">Video not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div
        className="rounded-lg shadow-lg overflow-hidden"
        style={{ backgroundColor: 'var(--color-dark-surface)' }}
      >
        <div className="p-6">
          <h1
            className="text-2xl font-bold mb-4"
            style={{ color: 'var(--color-dark-text)' }}
          >
            {video.Name}
          </h1>

          <div className="mb-6">
            <video
              ref={videoRef}
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: '70vh' }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-dark-text)' }}
              >
                Start Time
              </label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                style={{
                  backgroundColor: 'var(--color-dark-surface)',
                  borderColor: 'var(--color-dark-border)',
                  color: 'var(--color-dark-text)',
                }}
                placeholder="HH:MM:SS"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-dark-text)' }}
              >
                End Time
              </label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                style={{
                  backgroundColor: 'var(--color-dark-surface)',
                  borderColor: 'var(--color-dark-border)',
                  color: 'var(--color-dark-text)',
                }}
                placeholder="HH:MM:SS"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleCreateClip}
              disabled={isCreating}
              className="w-full px-4 py-2 text-white rounded transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-dark-primary)',
              }}
            >
              {isCreating ? 'Creating...' : 'Create Clip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClipStudio;
