import { sql } from "@vercel/postgres";

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    console.log("=== ROOMS API START ===");
    console.log("Method:", req.method);
    console.log("URL:", req.url);
    
    console.log("Testing database connection...");
    const testQuery = await sql`SELECT 1 as test`;
    console.log("Database OK:", testQuery);
    
    const cookies = req.headers.get('cookie');
    console.log("Cookies:", cookies);
    
    if (req.method === "GET") {
      console.log("Fetching rooms...");
      
      const { rows } = await sql`
        SELECT 
          room_id AS id,
          name,
          created_on,
          created_by
        FROM rooms
        ORDER BY created_on DESC
        LIMIT 10;
      `;
      
      console.log("Rooms found:", rows.length);
      console.log("Rooms data:", JSON.stringify(rows));
      
      return new Response(
        JSON.stringify({
          success: true,
          rooms: rows,
          debug: {
            hasCookies: !!cookies,
            timestamp: new Date().toISOString()
          }
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
    
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "content-type": "application/json" } }
    );
    
  } catch (err) {
    console.error("=== ERROR ===");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Error details:", JSON.stringify(err, null, 2));
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: {
          name: err.name,
          message: err.message,
          stack: err.stack
        }
      }),
      { 
        status: 500, 
        headers: { "content-type": "application/json" } 
      }
    );
  }
}