import { JellyfinClient } from "../api/jellyfin.ts";
import { addCorsHeaders } from "../utils/cors.ts";

export async function handleLogin(client: JellyfinClient, req: Request): Promise<Response> {
  console.log(`🔐 POST /api/auth/login`);
  
  try {
    const { username, password } = await req.json();
    
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }

    const authResult = await client.authenticate(username, password);
    
    console.log(`✅ User authenticated successfully`);
    return new Response(JSON.stringify(authResult), {
      status: 200,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  } catch (error: any) {
    console.error(`❌ Authentication failed: ${error.message}`);
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
} 