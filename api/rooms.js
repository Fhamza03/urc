import { sql } from "@vercel/postgres";
import { checkSession, unauthorizedResponse } from "../lib/session";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    //const authHeader = req.headers.get("authorization"); 
    //const token = authHeader?.split(" ")[1];

    const connected = await checkSession(req);
    if (!connected) return unauthorizedResponse();

    const { rows } = await sql`
      SELECT room_id AS id, name, created_on 
      FROM rooms
      ORDER BY created_on ASC;
    `;

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
