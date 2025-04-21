export function addCorsHeaders(headers: Headers = new Headers()): Headers {
  if (Deno.env.get("CORS") === 'true') {
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-MediaBrowser-Token, X-User-Id');
    headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  }
  return headers;
} 