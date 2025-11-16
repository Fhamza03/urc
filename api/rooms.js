import { sql } from "@vercel/postgres";
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv(); // ← Correction de __Redis__

export const config = {
  runtime: 'edge',
};

async function getConnecterUser(request) {
  let token = new Headers(request.headers).get('Authorization');
  if (token === undefined || token === null || token === "") {
    return null;
  } else {
    token = token.replace("Bearer ", "");
  }
  
  console.log("checking " + token);
  const user = await redis.get(token);
  
  if (user) {
    console.log("Got user : " + user.username);
  } else {
    console.log("No user found for token");
  }
  
  return user;
}

export default async function handler(req) {
  try {
    console.log("=== ROOMS API START ===");
    console.log("Method:", req.method);
    
    // Récupérer l'utilisateur depuis Redis
    const user = await getConnecterUser(req);
    
    if (!user) {
      console.log("❌ Unauthorized - no user");
      return new Response(
        JSON.stringify({
          code: "UNAUTHORIZED",
          message: "Session expirée",
        }),
        { 
          status: 401, 
          headers: { "content-type": "application/json" } 
        }
      );
    }

    console.log("✅ User authenticated:", user.username);

    if (req.method === "GET") {
      console.log("📥 Fetching rooms for user:", user.id);
      
      const { rows } = await sql`
        SELECT 
          r.room_id AS id,
          r.name,
          r.created_on,
          r.created_by,
          EXISTS (
            SELECT 1
            FROM room_members rm
            WHERE rm.room_id = r.room_id
              AND rm.user_id = ${user.id}
          ) AS is_member
        FROM rooms r
        ORDER BY r.created_on DESC;
      `;
      
      console.log("✅ Rooms fetched:", rows.length);
      console.log("Sample room:", rows[0]);
      
      return new Response(
        JSON.stringify({
          success: true,
          rooms: rows,
        }),
        { 
          status: 200, 
          headers: { 
            "content-type": "application/json",
            "cache-control": "no-store"
          } 
        }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { name } = body;
      
      console.log("📝 Creating room:", name);
      
      if (!name || !name.trim()) {
        return new Response(
          JSON.stringify({ error: "Le nom du salon est requis" }),
          { 
            status: 400, 
            headers: { "content-type": "application/json" } 
          }
        );
      }

      const created_on = new Date().toISOString();
      
      const { rows } = await sql`
        INSERT INTO rooms (name, created_on, created_by)
        VALUES (${name.trim()}, ${created_on}, ${user.id})
        RETURNING room_id AS id, name, created_on, created_by;
      `;

      const newRoom = rows[0];
      
      console.log("✅ Room created:", newRoom);

      // Ajouter le créateur comme membre
      await sql`
        INSERT INTO room_members (room_id, user_id)
        VALUES (${newRoom.id}, ${user.id});
      `;
      
      console.log("✅ Creator added as member");

      return new Response(
        JSON.stringify({
          success: true,
          room: {
            ...newRoom,
            is_member: true
          },
        }),
        { 
          status: 201, 
          headers: { "content-type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "content-type": "application/json" } }
    );
    
  } catch (err) {
    console.error("=== ERROR ===");
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: err.message
      }),
      { 
        status: 500, 
        headers: { "content-type": "application/json" } 
      }
    );
  }
}