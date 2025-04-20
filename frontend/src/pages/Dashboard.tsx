import React from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchClips } from '../store/slices/clipsSlice';
import { VideoSearch } from '../components/VideoSearch';

export const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { clips, loading, error } = useAppSelector((state) => state.clips);

  React.useEffect(() => {
    dispatch(fetchClips());
  }, [dispatch]);

  if (loading) {
    return <div style={{ color: 'var(--color-dark-text)' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--color-dark-text)' }}>Error: {error}</div>;
  }

  return (
    <div className="space-y-8">
      <section>
        <VideoSearch />
      </section>

      <section>
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--color-dark-text)' }}>Your Clips</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip) => (
            <div
              key={clip.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--color-dark-surface)' }}
            >
              <h2 className="font-semibold" style={{ color: 'var(--color-dark-text)' }}>{clip.title}</h2>
              <p className="text-sm" style={{ color: 'var(--color-dark-text-secondary)' }}>{clip.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}; 