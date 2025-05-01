import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchVideoDetails } from '../store/slices/videoSlice';
import { Clip } from '../types';

interface VideoPlayerProps {
  videoId: string;
  onClipCreated?: (clip: Clip) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, onClipCreated }) => {
  const dispatch = useDispatch();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isCreatingClip, setIsCreatingClip] = useState(false);

  // Get video data and status from entity state
  const video = useSelector((state: RootState) => state.entities.videos.byId[videoId]);
  const videoStatus = useSelector((state: RootState) => state.entities.videos.status[videoId]);

  useEffect(() => {
    if (videoId) {
      dispatch(fetchVideoDetails(videoId));
    }
  }, [videoId, dispatch]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      if (startTime === null) {
        setStartTime(currentTime);
      } else if (endTime === null) {
        setEndTime(currentTime);
      }
    }
  };

  const handleCreateClip = async () => {
    if (startTime === null || endTime === null || !videoRef.current) return;

    setIsCreatingClip(true);
    try {
      const response = await fetch('/api/clips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          startTime: startTime.toFixed(3),
          endTime: endTime.toFixed(3),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create clip');
      }

      const clip = await response.json();
      if (onClipCreated) {
        onClipCreated(clip);
      }

      // Reset clip creation state
      setStartTime(null);
      setEndTime(null);
    } catch (error) {
      console.error('Error creating clip:', error);
    } finally {
      setIsCreatingClip(false);
    }
  };

  if (videoStatus === 'loading') {
    return <div>Loading video...</div>;
  }

  if (videoStatus === 'failed' || !video) {
    return <div>Failed to load video</div>;
  }

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={`/api/hls-playlist/${videoId}/master`}
        controls
        onTimeUpdate={handleTimeUpdate}
      />
      <div className="clip-controls">
        <button
          onClick={() => {
            setStartTime(null);
            setEndTime(null);
          }}
          disabled={startTime === null && endTime === null}
        >
          Reset
        </button>
        <button
          onClick={handleCreateClip}
          disabled={startTime === null || endTime === null || isCreatingClip}
        >
          {isCreatingClip ? 'Creating...' : 'Create Clip'}
        </button>
      </div>
      {startTime !== null && (
        <div>Start: {startTime.toFixed(2)}s</div>
      )}
      {endTime !== null && (
        <div>End: {endTime.toFixed(2)}s</div>
      )}
    </div>
  );
};

export default VideoPlayer; 