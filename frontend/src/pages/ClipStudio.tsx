import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Hls from 'hls.js';
import { API_BASE_URL } from '../config';
import { Video } from '../types';
import { useAppSelector } from '../hooks';

interface TimeInput {
  hours: number;
  minutes: number;
  seconds: number;
}

const ClipStudio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, accessToken } = useAppSelector((state) => state.auth);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<TimeInput>({ hours: 0, minutes: 0, seconds: 0 });
  const [endTime, setEndTime] = useState<TimeInput>({ hours: 0, minutes: 0, seconds: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Convert ticks to hours, minutes, seconds
  const ticksToTime = (ticks: number): TimeInput => {
    const totalSeconds = Math.floor(ticks / 10000000); // Convert ticks to seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  // Convert time to seconds
  const timeToSeconds = (time: TimeInput): number => {
    return time.hours * 3600 + time.minutes * 60 + time.seconds;
  };

  // Get max time based on video duration
  const getMaxTime = (): TimeInput => {
    if (!video) return { hours: 0, minutes: 0, seconds: 0 };
    return ticksToTime(video.RunTimeTicks);
  };

  // Format time for display
  const formatTime = (time: TimeInput): string => {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`;
  };

  // Handle time input changes
  const handleTimeChange = (
    type: 'start' | 'end',
    field: keyof TimeInput,
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    const maxTime = getMaxTime();
    
    if (type === 'start') {
      const newStartTime = { ...startTime, [field]: numValue };
      setStartTime(newStartTime);
      
      // If end time is before start time, update it
      if (timeToSeconds(endTime) < timeToSeconds(newStartTime)) {
        setEndTime(newStartTime);
      }
    } else {
      const newEndTime = { ...endTime, [field]: numValue };
      // Ensure end time doesn't exceed video duration
      if (timeToSeconds(newEndTime) <= timeToSeconds(maxTime)) {
        setEndTime(newEndTime);
      }
    }
  };

  // Handle video errors
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e);
    setVideoError('Failed to load video. Please try refreshing the page.');
  };

  // Handle video loading
  const handleVideoLoad = () => {
    setVideoError(null);
  };

  // Initialize HLS player
  useEffect(() => {
    if (videoRef.current && video && Hls.isSupported()) {
      const videoElement = videoRef.current;
      const hls = new Hls({
        debug: true,
        enableWorker: true,
        lowLatencyMode: true,
      });

      hlsRef.current = hls;

      // Construct the stream URL with required parameters
      const params = new URLSearchParams({
        DeviceId: 'TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEzMC4wLjAuMCBTYWZhcmkvNTM3LjM2fDE3MzA5NTY4OTU3NTA1',
        MediaSourceId: video.MediaSources[0].Id,
        VideoCodec: 'h264',
        AudioCodec: 'copy',
        AudioStreamIndex: '1',
        VideoBitrate: '9872296',
        AudioBitrate: '127704',
        AudioSampleRate: '44100',
        MaxFramerate: '29.96605',
        MaxWidth: '1680',
        PlaySessionId: 'ef92ff51bf1f4b1f8eac1cc32de2bd76',
        SubtitleMethod: 'Encode',
        TranscodingMaxAudioChannels: '2',
        RequireAvc: 'false',
        EnableAudioVbrEncoding: 'true',
        Tag: 'b6fe519c8db9925a9fa4686cc633bd98',
        SegmentContainer: 'ts',
        MinSegments: '1',
        BreakOnNonKeyFrames: 'True'
      });

      const streamUrl = `${API_BASE_URL}/api/stream/${video.Id}/main.m3u8?${params.toString()}`;
      console.log('Loading HLS stream:', streamUrl);

      hls.loadSource(streamUrl);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed, starting playback');
        videoElement.play().catch(e => console.error('Error playing video:', e));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
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

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
      };
    }
  }, [video]);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
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
        // Set initial end time to video duration
        setEndTime(ticksToTime(response.data.RunTimeTicks));
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

  const maxTime = getMaxTime();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-white">Create Clip: {video.Name}</h1>
          <button
            onClick={() => navigate(`/videos/${id}`)}
            className="px-4 py-2 rounded-md text-white"
            style={{ backgroundColor: 'var(--color-dark-primary)' }}
          >
            Back to Video
          </button>
        </div>

        <div className="space-y-6">
          {/* Video Preview Section */}
          <div className="bg-black rounded-lg overflow-hidden">
            {videoError ? (
              <div className="p-4 text-center text-red-500">
                {videoError}
                <button
                  onClick={() => {
                    setVideoError(null);
                    if (videoRef.current && hlsRef.current) {
                      hlsRef.current.startLoad();
                    }
                  }}
                  className="block mx-auto mt-2 px-4 py-2 rounded-md text-white"
                  style={{ backgroundColor: 'var(--color-dark-primary)' }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                controls
                className="w-full"
                style={{ maxHeight: '400px' }}
                onError={handleVideoError}
                onLoadedData={handleVideoLoad}
                crossOrigin="anonymous"
              />
            )}
          </div>

          {/* Clip Creation Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Clip Title
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-md"
                style={{
                  backgroundColor: 'var(--color-dark-bg)',
                  color: 'var(--color-dark-text)',
                  borderColor: 'var(--color-dark-text-secondary)'
                }}
                placeholder="Enter clip title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Start Time
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max={maxTime.hours}
                      value={startTime.hours}
                      onChange={(e) => handleTimeChange('start', 'hours', e.target.value)}
                      className="w-full px-2 py-2 rounded-md text-center"
                      style={{
                        backgroundColor: 'var(--color-dark-bg)',
                        color: 'var(--color-dark-text)',
                        borderColor: 'var(--color-dark-text-secondary)'
                      }}
                    />
                    <div className="text-xs text-center text-gray-400 mt-1">Hours</div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={startTime.minutes}
                      onChange={(e) => handleTimeChange('start', 'minutes', e.target.value)}
                      className="w-full px-2 py-2 rounded-md text-center"
                      style={{
                        backgroundColor: 'var(--color-dark-bg)',
                        color: 'var(--color-dark-text)',
                        borderColor: 'var(--color-dark-text-secondary)'
                      }}
                    />
                    <div className="text-xs text-center text-gray-400 mt-1">Minutes</div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={startTime.seconds}
                      onChange={(e) => handleTimeChange('start', 'seconds', e.target.value)}
                      className="w-full px-2 py-2 rounded-md text-center"
                      style={{
                        backgroundColor: 'var(--color-dark-bg)',
                        color: 'var(--color-dark-text)',
                        borderColor: 'var(--color-dark-text-secondary)'
                      }}
                    />
                    <div className="text-xs text-center text-gray-400 mt-1">Seconds</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  {formatTime(startTime)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  End Time
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      min={startTime.hours}
                      max={maxTime.hours}
                      value={endTime.hours}
                      onChange={(e) => handleTimeChange('end', 'hours', e.target.value)}
                      className="w-full px-2 py-2 rounded-md text-center"
                      style={{
                        backgroundColor: 'var(--color-dark-bg)',
                        color: 'var(--color-dark-text)',
                        borderColor: 'var(--color-dark-text-secondary)'
                      }}
                    />
                    <div className="text-xs text-center text-gray-400 mt-1">Hours</div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={endTime.minutes}
                      onChange={(e) => handleTimeChange('end', 'minutes', e.target.value)}
                      className="w-full px-2 py-2 rounded-md text-center"
                      style={{
                        backgroundColor: 'var(--color-dark-bg)',
                        color: 'var(--color-dark-text)',
                        borderColor: 'var(--color-dark-text-secondary)'
                      }}
                    />
                    <div className="text-xs text-center text-gray-400 mt-1">Minutes</div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={endTime.seconds}
                      onChange={(e) => handleTimeChange('end', 'seconds', e.target.value)}
                      className="w-full px-2 py-2 rounded-md text-center"
                      style={{
                        backgroundColor: 'var(--color-dark-bg)',
                        color: 'var(--color-dark-text)',
                        borderColor: 'var(--color-dark-text-secondary)'
                      }}
                    />
                    <div className="text-xs text-center text-gray-400 mt-1">Seconds</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  {formatTime(endTime)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                className="w-full px-4 py-2 rounded-md"
                style={{
                  backgroundColor: 'var(--color-dark-bg)',
                  color: 'var(--color-dark-text)',
                  borderColor: 'var(--color-dark-text-secondary)'
                }}
                rows={3}
                placeholder="Enter clip description"
              />
            </div>

            <div className="flex justify-end">
              <button
                className="px-6 py-2 rounded-md text-white"
                style={{ backgroundColor: 'var(--color-dark-primary)' }}
              >
                Create Clip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClipStudio; 