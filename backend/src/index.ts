// Video streaming endpoint
if (url.pathname.startsWith('/api/stream/')) {
  const videoId = url.pathname.split('/').pop();
  if (!videoId) {
    return new Response(JSON.stringify({ error: 'Video ID is required' }), {
      status: 400,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
  return handleVideoStream(client, req, videoId);
} 