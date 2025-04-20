import React from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchClips } from '../store/slices/clipsSlice';

export const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const { clips, loading, error } = useAppSelector((state) => state.clips);

  React.useEffect(() => {
    dispatch(fetchClips());
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Clips</h1>
      <div>
        {clips.map((clip) => (
          <div key={clip.id}>
            <h2>{clip.title}</h2>
            <p>{clip.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
