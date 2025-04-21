import { createClip, getClipsByUserId, getClipById, deleteClip } from "../db/index.ts";
import { addCorsHeaders } from "../utils/cors.ts";

export async function handleGetClips(req: Request): Promise<Response> {
  console.log(`📋 GET /api/clips`);
  
  try {
    const userId = req.headers.get('X-User-Id');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 401,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }

    const clips = await getClipsByUserId(userId);
    console.log(`✅ Found ${clips.length} clips for user ${userId}`);
    
    return new Response(JSON.stringify(clips), {
      status: 200,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  } catch (error: any) {
    console.error(`❌ Error fetching clips: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
}

export async function handleCreateClip(req: Request): Promise<Response> {
  console.log(`📝 POST /api/clips`);
  
  try {
    const userId = req.headers.get('X-User-Id');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 401,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }

    const { videoId, title, description, startTime, endTime } = await req.json();
    
    if (!videoId || !title || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }

    const clip = await createClip({
      userId,
      videoId,
      title,
      description,
      startTime,
      endTime,
      status: 'pending'
    });

    console.log(`✅ Created clip: ${clip.title}`);
    return new Response(JSON.stringify(clip), {
      status: 201,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  } catch (error: any) {
    console.error(`❌ Error creating clip: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
}

export async function handleDeleteClip(req: Request, clipId: number): Promise<Response> {
  console.log(`🗑️ DELETE /api/clips/${clipId}`);
  
  try {
    const userId = req.headers.get('X-User-Id');
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 401,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }

    const clip = await getClipById(clipId);

    if (!clip) {
      return new Response(JSON.stringify({ error: 'Clip not found' }), {
        status: 404,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }

    if (clip.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: addCorsHeaders(new Headers({
          'Content-Type': 'application/json'
        }))
      });
    }

    await deleteClip(clipId);
    console.log(`✅ Deleted clip: ${clip.title}`);
    
    return new Response(null, {
      status: 204,
      headers: addCorsHeaders()
    });
  } catch (error: any) {
    console.error(`❌ Error deleting clip: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: addCorsHeaders(new Headers({
        'Content-Type': 'application/json'
      }))
    });
  }
} 