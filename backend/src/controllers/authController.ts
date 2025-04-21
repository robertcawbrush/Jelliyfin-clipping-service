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

    // Use the shared API instance from the client
    const api = client.getSdkApi();
    
    // Authenticate using the SDK
    const authResult = await api.authenticateUserByName(username, password);

    
    if (!authResult.data.User) {
      throw new Error('User data not found in authentication response');
    }
    
    console.log(`✅ User authenticated successfully`);
    return new Response(JSON.stringify({
      accessToken: authResult.data.AccessToken,
      userId: authResult.data.User.Id
    }), {
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