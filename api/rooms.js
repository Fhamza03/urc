import { getConnecterUser } from "../lib/session.js";
import { sql } from "@vercel/postgres";

export const config = {
  runtime: 'edge',
};

export default async function handler(request, response) {
  try {
    const user = await getConnecterUser(request);
    if (!user) {
      return response.status(401).json({
        code: "UNAUTHORIZED",
        message: "Session expirée",
      });
    }

    if (request.method === "GET") {
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
      return response.json({
        success: true,
        rooms: rows,
      });
    }

    if (request.method === "POST") {
      const { name } = request.body;

      if (!name || !name.trim()) {
        return response.status(400).json({
          error: "Le nom du salon est requis",
        });
      }

      const created_on = new Date().toISOString();

      const { rows } = await sql`
        INSERT INTO rooms (name, created_on, created_by)
        VALUES (${name.trim()}, ${created_on}, ${user.id})
        RETURNING room_id AS id, name, created_on, created_by;
      `;

      const newRoom = rows[0];

      return response.json({
        success: true,
        room: newRoom,
      });
    }

    response.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("Error in rooms API:", err);
    response.status(500).json({ error: "Internal server error" });
  }
}
